import {
  handleAbort,
  handleDrawAccept,
  handleDrawDecline,
  handleDrawOffer,
  getSpectatorState,
  handleRematchAccept,
  handleRematchDecline,
  handleRematchOffer,
  getSyncState,
  handleResign,
  processMove,
  createDirectGame,
} from "../../core/game/engine";
import {
  handleJoinQueue,
  handleLeaveQueue,
} from "../../core/matchmaking/queue";
import { WsMessageSchema } from "../../types/events";
import { v7 as uuidv7 } from "uuid";

import type {
  AuthenticatedWebSocket,
  FullyAuthenticatedWebSocket,
} from "./web-socket-server";
import {
  sendToUser,
  broadcastGameUpdate,
  subscribeToGameUpdates,
  unsubscribeFromGameUpdates,
  joinGameChatRoom,
  leaveGameChatRoom,
  broadcastGameChat,
} from "./session-manager";
import { DomainError } from "../../lib/errors";
import { WsMessageType } from "../../types/types";
import { queueChatMessage } from "../../api/repository/chat-worker";
import { queueGameChatMessage } from "../../api/repository/game-chat-worker";
import {
  markChatAsRead,
  markAllChatsAsRead,
} from "../../api/repository/chat-repository";
import { redis } from "../redis/redis-client";
import { Keys } from "../../lib/keys";

function sendWs(
  ws: AuthenticatedWebSocket,
  type: WsMessageType,
  payload?: unknown,
) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

export async function routeMessage(
  ws: FullyAuthenticatedWebSocket,
  rawMessage: string,
): Promise<void> {
  try {
    const parsedData = JSON.parse(rawMessage);
    const envelope = WsMessageSchema.parse(parsedData);

    switch (envelope.type) {
      case WsMessageType.JOIN_QUEUE: {
        const payload = envelope.payload;

        sendWs(ws, WsMessageType.QUEUE_JOINED, {
          status: "waiting",
          timeControl: payload.timeControl,
        });

        handleJoinQueue(ws.user.id, payload.timeControl).catch((err) => {
          console.error(`[Queue Error] for ${ws.user.id}:`, err);
        });

        break;
      }

      case WsMessageType.MAKE_MOVE: {
        const payload = envelope.payload;

        try {
          const result = await processMove(
            payload.gameId,
            ws.user.id,
            payload.from,
            payload.to,
            payload.promotion,
          );

          if (
            !result.white?.id ||
            !result.black?.id ||
            !result.newFen ||
            !result.move
          ) {
            return;
          }

          const moveMadeMessage = {
            type: WsMessageType.MOVE_MADE,
            payload: {
              gameId: payload.gameId,
              fen: result.newFen,
              pgn: result.pgn,
              move: result.move,
              white: result.white,
              black: result.black,
              isGameOver: result.isGameOver,
            },
          };

          await broadcastGameUpdate(payload.gameId, moveMadeMessage);
        } catch (err: unknown) {
          const isKnownError = err instanceof DomainError;

          const userMessage = isKnownError
            ? err.userMessage
            : "Action rejected.";

          await sendToUser(ws.user.id, {
            type: WsMessageType.MOVE_REJECTED,
            payload: { reason: userMessage },
          });
        }
        break;
      }

      case WsMessageType.LEAVE_QUEUE:
        await handleLeaveQueue(ws.user.id);
        break;

      case WsMessageType.SYNC_GAME: {
        const state = await getSyncState(ws.user.id);

        if (!state) {
          return;
        }

        subscribeToGameUpdates(state.gameId, ws);
        sendWs(ws, WsMessageType.GAME_STATE, state);
        break;
      }

      case WsMessageType.OFFER_DRAW: {
        await handleDrawOffer(envelope.payload.gameId, ws.user.id);
        break;
      }

      case WsMessageType.ACCEPT_DRAW: {
        await handleDrawAccept(envelope.payload.gameId, ws.user.id);
        break;
      }

      case WsMessageType.DECLINE_DRAW: {
        await handleDrawDecline(envelope.payload.gameId, ws.user.id);
        break;
      }

      case WsMessageType.OFFER_REMATCH: {
        await handleRematchOffer(envelope.payload, ws.user.id);
        break;
      }

      case WsMessageType.ACCEPT_REMATCH: {
        await handleRematchAccept(envelope.payload, ws.user.id);
        break;
      }

      case WsMessageType.DECLINE_REMATCH: {
        await handleRematchDecline(envelope.payload, ws.user.id);
        break;
      }

      case WsMessageType.OFFER_CHALLENGE: {
        const { targetId, timeControl } = envelope.payload;
        await sendToUser(targetId, {
          type: WsMessageType.CHALLENGE_RECEIVED,
          payload: { offeredBy: ws.user, timeControl },
        });
        break;
      }

      case WsMessageType.DECLINE_CHALLENGE: {
        const { targetId } = envelope.payload;
        await sendToUser(targetId, {
          type: WsMessageType.CHALLENGE_DECLINED,
          payload: { offeredBy: ws.user },
        });
        break;
      }

      case WsMessageType.ACCEPT_CHALLENGE: {
        const { targetId, timeControl } = envelope.payload;
        await createDirectGame(targetId, ws.user.id, timeControl);
        console.log(
          `[Challenge] ${ws.user.id} accepted challenge from ${targetId} for ${timeControl}`,
        );
        break;
      }

      case WsMessageType.GAME_ABORTED: {
        await handleAbort(envelope.payload.gameId, ws.user.id);
        break;
      }

      case WsMessageType.RESIGN_GAME: {
        await handleResign(envelope.payload.gameId, ws.user.id);
        break;
      }

      case WsMessageType.SPECTATE_GAME: {
        const { gameId } = envelope.payload;

        const state = await getSpectatorState(gameId);
        if (!state) {
          sendWs(ws, WsMessageType.ERROR, "Game not found.");
          return;
        }

        subscribeToGameUpdates(gameId, ws);
        sendWs(ws, WsMessageType.GAME_STATE, state);
        break;
      }

      case WsMessageType.LEAVE_SPECTATOR: {
        unsubscribeFromGameUpdates(envelope.payload.gameId, ws);
        break;
      }

      case WsMessageType.SEND_GAME_CHAT: {
        const { gameId, content } = envelope.payload;

        const chatMessage = {
          id: uuidv7(),
          gameId,
          sender: ws.user,
          content,
          createdAt: new Date().toISOString(),
        };

        await broadcastGameChat(gameId, {
          type: WsMessageType.NEW_GAME_CHAT,
          payload: chatMessage,
        });

        await queueGameChatMessage(chatMessage);
        break;
      }

      case WsMessageType.SEND_CHAT_MESSAGE: {
        const { receiverId, content } = envelope.payload;

        const senderIdsCacheKey = Keys.getBlockedIdsCacheKey(ws.user.id);
        const receiverIdsCacheKey = Keys.getBlockedIdsCacheKey(receiverId);

        const [hasSenderBlockedReceiver, hasReceiverBlockedSender] =
          await Promise.all([
            redis.sismember(senderIdsCacheKey, receiverId),
            redis.sismember(receiverIdsCacheKey, ws.user.id),
          ]);

        if (hasSenderBlockedReceiver === 1) {
          sendWs(ws, WsMessageType.ERROR, {
            message: "You have blocked this user.",
          });
          return;
        }

        if (hasReceiverBlockedSender === 1) {
          sendWs(ws, WsMessageType.ERROR, {
            message: "You are blocked by this user.",
          });
          return;
        }

        const msg = {
          id: uuidv7(),
          senderId: ws.user.id,
          receiverId,
          content,
          createdAt: new Date(),
        };

        await queueChatMessage(msg);

        await sendToUser(receiverId, {
          type: WsMessageType.RECEIVE_CHAT_MESSAGE,
          payload: msg,
        });

        sendWs(ws, WsMessageType.CHAT_MESSAGE_ACK, msg);
        console.log(
          `[Chat] Message queued from ${ws.user.id} to ${receiverId}`,
        );
        break;
      }

      case WsMessageType.MARK_CHAT_READ: {
        const friendId = envelope.payload.friendId;
        await markChatAsRead(ws.user.id, friendId);
        break;
      }

      case WsMessageType.MARK_ALL_CHATS_READ: {
        await markAllChatsAsRead(ws.user.id);
        break;
      }

      case WsMessageType.JOIN_GAME_CHAT: {
        joinGameChatRoom(envelope.payload.gameId, ws);
        break;
      }

      case WsMessageType.LEAVE_GAME_CHAT: {
        leaveGameChatRoom(envelope.payload.gameId, ws);
        break;
      }

      case WsMessageType.PING: {
        sendWs(ws, WsMessageType.PONG);
        break;
      }

      default:
        console.warn(`[Router] Unknown message type:`, envelope);
        sendWs(ws, WsMessageType.ERROR, "Unknown message type");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Router] Message handling failed:", message);
    sendWs(ws, WsMessageType.ERROR, "Invalid message format");
  }
}

import {
  getSyncState,
  getSpectatorState,
  handleAbort,
  handleDrawAccept,
  handleDrawDecline,
  handleDrawOffer,
  handleRematchAccept,
  handleRematchDecline,
  handleRematchOffer,
  handleResign,
  processMove,
} from "../../core/game/engine";
import {
  handleJoinQueue,
  handleLeaveQueue,
} from "../../core/matchmaking/queue";
import { WsMessageSchema } from "../../types/events";

import type { AuthenticatedWebSocket } from "./web-socket-server";
import {
  sendToUser,
  broadcastGameUpdate,
  joinSpectatorRoom,
  leaveSpectatorRoom,
} from "./session-manager";
import { DomainError } from "../../lib/errors";
import { WsMessageType } from "../../types/types";

function sendWs(
  ws: AuthenticatedWebSocket,
  type: WsMessageType,
  payload: unknown,
) {
  if (ws.readyState === 1) {
    // WebSocket.OPEN
    ws.send(JSON.stringify({ type, payload }));
  }
}

export async function routeMessage(
  ws: AuthenticatedWebSocket,
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

        handleJoinQueue(ws.userId, payload.timeControl).catch((err) => {
          console.error(`[Queue Error] for ${ws.userId}:`, err);
        });

        break;
      }

      case WsMessageType.MAKE_MOVE: {
        const payload = envelope.payload;

        try {
          const result = await processMove(
            payload.gameId,
            ws.userId,
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

          const uniquePlayerIds = Array.from(
            new Set([result.white.id, result.black.id]),
          );
          await Promise.all([
            ...uniquePlayerIds.map((id) => sendToUser(id, moveMadeMessage)),
            broadcastGameUpdate(
              payload.gameId,
              moveMadeMessage,
              uniquePlayerIds,
            ),
          ]);
        } catch (err: unknown) {
          const isKnownError = err instanceof DomainError;

          const userMessage = isKnownError
            ? err.userMessage
            : "Action rejected.";

          await sendToUser(ws.userId, {
            type: WsMessageType.MOVE_REJECTED,
            payload: { reason: userMessage },
          });
        }
        break;
      }

      case WsMessageType.LEAVE_QUEUE:
        await handleLeaveQueue(ws.userId);
        break;

      case WsMessageType.SYNC_GAME: {
        const state = await getSyncState(ws.userId);

        if (!state) {
          return;
        }

        sendWs(ws, WsMessageType.GAME_STATE, state);
        break;
      }

      case WsMessageType.OFFER_DRAW: {
        await handleDrawOffer(envelope.payload.gameId, ws.userId);
        break;
      }

      case WsMessageType.ACCEPT_DRAW: {
        await handleDrawAccept(envelope.payload.gameId, ws.userId);
        break;
      }

      case WsMessageType.DECLINE_DRAW: {
        await handleDrawDecline(envelope.payload.gameId, ws.userId);
        break;
      }

      case WsMessageType.OFFER_REMATCH: {
        await handleRematchOffer(envelope.payload, ws.userId);
        break;
      }

      case WsMessageType.ACCEPT_REMATCH: {
        await handleRematchAccept(envelope.payload, ws.userId);
        break;
      }

      case WsMessageType.DECLINE_REMATCH: {
        await handleRematchDecline(envelope.payload, ws.userId);
        break;
      }

      case WsMessageType.GAME_ABORTED: {
        await handleAbort(envelope.payload.gameId, ws.userId);
        break;
      }

      case WsMessageType.RESIGN_GAME: {
        await handleResign(envelope.payload.gameId, ws.userId);
        break;
      }

      case WsMessageType.SPECTATE_GAME: {
        const { gameId } = envelope.payload;

        const state = await getSpectatorState(gameId);
        if (!state) {
          sendWs(ws, WsMessageType.ERROR, "Game not found.");
          return;
        }

        const isPlayer =
          state.white.id === ws.userId || state.black.id === ws.userId;
        if (!isPlayer) {
          joinSpectatorRoom(gameId, ws);
        }

        sendWs(ws, WsMessageType.GAME_STATE, state);
        break;
      }

      case WsMessageType.LEAVE_SPECTATOR: {
        leaveSpectatorRoom(envelope.payload.gameId, ws);
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

import z from "zod";
import { PlayerInfoSchema } from "./player";

const ChatUserSchema = PlayerInfoSchema.omit({ rating: true }).extend({
  name: z.string(),
  isBlocked: z.boolean(),
});

export const BaseMessageSchema = z.object({
  id: z.string(),
  receiverId: z.string(),
  senderId: z.string(),
  content: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});

export const GameChatMessageSchema = BaseMessageSchema.extend({
  gameId: z.string(),
  sender: PlayerInfoSchema,
}).omit({ receiverId: true });

export const ChatMessageSchemaResponseSchema = z.object({
  user: ChatUserSchema,
  messages: z.array(BaseMessageSchema),
});

export const ChatConversationSchema = z.object({
  user: ChatUserSchema,
  lastMessage: BaseMessageSchema,
  unreadCount: z.number(),
});

export type BaseMessage = z.infer<typeof BaseMessageSchema>;
export type GameChatMessage = z.infer<typeof GameChatMessageSchema>;
export type ChatMessage = z.infer<typeof BaseMessageSchema>;
export type ChatMessageSchemaResponse = z.infer<
  typeof ChatMessageSchemaResponseSchema
>;
export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type ChatUserInfo = z.infer<typeof ChatUserSchema>;

// CHAT HISTORY ENDPOINT
//  {
//       "id": "019d8c6f-4e75-733c-99dd-9abae0c4ca67",
//       "senderId": "H6tNkZDbpVxBla4BJXSRnpqVDX5zoRUL",
//       "receiverId": "9Y3rcWzOizacI67ygV0ea73p50hvs6kk",
//       "content": "assaad",
//       "createdAt": "2026-04-14T14:39:58.069Z",
//       "read": false
//     },

// CONVERSATIONS
// {
//       "user": {
//         "id": "H6tNkZDbpVxBla4BJXSRnpqVDX5zoRUL",
//         "name": "Rohit Tomar",
//         "username": "tomarrohit959",
//         "image": null
//       },
//       "lastMessage": {
//         "id": "019d8c70-40ae-70e7-b93c-e38467e557d2",
//         "senderId": "H6tNkZDbpVxBla4BJXSRnpqVDX5zoRUL",
//         "receiverId": "9Y3rcWzOizacI67ygV0ea73p50hvs6kk",
//         "content": "Yes",
//         "createdAt": "2026-04-14T14:41:00.078Z",
//         "read": false
//       }
//     },

// {
//   "type": "RECEIVE_CHAT_MESSAGE",
//   "payload": {
//     "id": "019d8c70-40ae-70e7-b93c-e38467e557d2",
//     "sender": {
//       "id": "H6tNkZDbpVxBla4BJXSRnpqVDX5zoRUL",
//       "username": "tomarrohit959",
//       "image": null,
//       "rating": 1026
//     },
//     "receiverId": "9Y3rcWzOizacI67ygV0ea73p50hvs6kk",
//     "content": "Yes",
//     "createdAt": "2026-04-14T14:41:00.078Z",
//     "read": false
//   },

//   // SEND
//   "type": "SEND_CHAT_MESSAGE",
//   "payload": {
//     "receiverId": "9Y3rcWzOizacI67ygV0ea73p50hvs6kk",
//     "content": "Yes"
//   },

//   // ACK
//   "type": "CHAT_MESSAGE_ACK",
//   "payload": {
//     "id": "019d8c70-40ae-70e7-b93c-e38467e557d2",
//     "sender": {
//       "id": "H6tNkZDbpVxBla4BJXSRnpqVDX5zoRUL",
//       "username": "tomarrohit959",
//       "image": null,
//       "rating": 1026
//     },
//     "receiverId": "9Y3rcWzOizacI67ygV0ea73p50hvs6kk",
//     "content": "Yes",
//     "createdAt": "2026-04-14T14:41:00.078Z",
//     "read": false
//   }
// }

// during game Chat.

// Ack to the user who have sent the message
// {
//   "type": "NEW_GAME_CHAT",
//   "payload": {
//     "id": "019d8c80-cdc2-74e7-bc8d-e1a6be76fd8c",
//     "gameId": "019d8c80-2bf6-77bc-9aba-5f87d7707ef5",
//     "sender": {
//       "id": "9Y3rcWzOizacI67ygV0ea73p50hvs6kk",
//       "username": "tomarrohittt",
//       "image": null,
//       "rating": 974
//     },
//     "content": "Hii",
//     "createdAt": "2026-04-14T14:59:04.770Z"
//   }
// }

// On the player end who have received the Message.
// {
//   "type": "NEW_GAME_CHAT",
//   "payload": {
//     "id": "019d8c82-20c5-710f-93d0-ead04b21b9a4",
//     "gameId": "019d8c80-2bf6-77bc-9aba-5f87d7707ef5",
//     "sender": {
//       "id": "H6tNkZDbpVxBla4BJXSRnpqVDX5zoRUL",
//       "username": "tomarrohit959",
//       "image": null,
//       "rating": 1026
//     },
//     "content": "aws",
//     "createdAt": "2026-04-14T15:00:31.557Z"
//   }
// }

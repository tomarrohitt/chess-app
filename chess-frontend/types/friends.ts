import { User } from "./auth";

export enum FriendStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  BLOCKED = "BLOCKED",
}

export type GetFriend = Omit<User, "email" | "emailVerified" | "updatedAt">;

export type SearchFriend = Omit<
  GetFriend,
  "wins" | "losses" | "draws" | "createdAt"
> & {
  friendStatus:
    | FriendStatus.PENDING
    | FriendStatus.ACCEPTED
    | FriendStatus.BLOCKED
    | null;
  friendSenderId: string;
};

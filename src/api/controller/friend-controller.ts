import { Request, Response } from "express";
import { auth } from "../../lib/auth";
import { toFetchHeaders } from "../../lib/utils/to-fetch-headers";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getFriends,
  getFriendRequests,
  getFriendshipCounts,
  getBlockedUsers,
  getFriendship,
  searchGlobalUsers,
} from "../repository/friend-repository";
import { TargetUserIdSchema } from "../validation/friends-schema";

export async function requestFriend(req: Request, res: Response) {
  const result = TargetUserIdSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "userId is required and must be a string" });
  }

  const targetUserId = result.data.userId;

  if (req.user.id === targetUserId) {
    return res
      .status(400)
      .json({ error: "Cannot send a friend request to yourself" });
  }

  const existingFriendships = await getFriendship(req.user.id, targetUserId);
  for (const record of existingFriendships) {
    if (record.status === "BLOCKED") {
      return res.status(400).json({ error: "Action not allowed" });
    }
    if (record.status === "ACCEPTED") {
      return res.status(400).json({ error: "Already friends" });
    }
    if (record.status === "PENDING") {
      if (record.userId === req.user.id) {
        return res.status(400).json({ error: "Friend request already sent" });
      } else {
        return res
          .status(400)
          .json({ error: "User already sent you a friend request" });
      }
    }
  }

  await sendFriendRequest(req.user.id, targetUserId);
  return res.json({ success: true });
}

export async function acceptRequest(req: Request, res: Response) {
  const result = TargetUserIdSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "userId is required and must be a string" });
  }

  const targetUserId = result.data.userId;

  if (req.user.id === targetUserId) {
    return res
      .status(400)
      .json({ error: "Cannot accept a request from yourself" });
  }

  const existingFriendships = await getFriendship(req.user.id, targetUserId);

  for (const record of existingFriendships) {
    if (record.status === "BLOCKED") {
      return res.status(400).json({ error: "Action not allowed" });
    }
    if (record.status === "ACCEPTED") {
      return res.status(400).json({ error: "Already friends" });
    }
  }

  const incomingRequest = existingFriendships.find(
    (f) => f.userId === targetUserId && f.status === "PENDING",
  );

  if (!incomingRequest) {
    return res
      .status(400)
      .json({ error: "No pending friend request from this user" });
  }

  await acceptFriendRequest(req.user.id, targetUserId);
  return res.json({ success: true });
}

export async function cancelRequest(req: Request, res: Response) {
  const result = TargetUserIdSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "userId is required and must be a string" });
  }

  const targetUserId = result.data.userId;

  if (req.user.id === targetUserId) {
    return res
      .status(400)
      .json({ error: "Cannot cancel a request to yourself" });
  }

  const existingFriendships = await getFriendship(req.user.id, targetUserId);

  const outgoingRequest = existingFriendships.find(
    (f) => f.userId === req.user.id && f.status === "PENDING",
  );

  if (!outgoingRequest) {
    return res
      .status(400)
      .json({ error: "No pending friend request to cancel" });
  }

  await removeFriend(req.user.id, targetUserId);
  return res.json({ success: true });
}

export async function declineRequest(req: Request, res: Response) {
  const result = TargetUserIdSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "userId is required and must be a string" });
  }

  const targetUserId = result.data.userId;

  if (req.user.id === targetUserId) {
    return res
      .status(400)
      .json({ error: "Cannot reject a request from yourself" });
  }

  const existingFriendships = await getFriendship(req.user.id, targetUserId);

  for (const record of existingFriendships) {
    if (record.status === "BLOCKED") {
      return res.status(400).json({ error: "Action not allowed" });
    }
    if (record.status === "ACCEPTED") {
      return res.status(400).json({ error: "Already friends" });
    }
  }

  const incomingRequest = existingFriendships.find(
    (f) => f.userId === targetUserId && f.status === "PENDING",
  );

  if (!incomingRequest) {
    return res
      .status(400)
      .json({ error: "No pending friend request from this user" });
  }

  await declineFriendRequest(req.user.id, targetUserId);
  return res.json({ success: true });
}

export async function remove(req: Request, res: Response) {
  const result = TargetUserIdSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "userId is required and must be a string" });
  }

  const targetUserId = result.data.userId;

  if (req.user.id === targetUserId) {
    return res
      .status(400)
      .json({ error: "Cannot remove yourself as a friend" });
  }

  const existingFriendships = await getFriendship(req.user.id, targetUserId);
  const isFriend = existingFriendships.some((f) => f.status === "ACCEPTED");

  if (!isFriend) {
    return res
      .status(400)
      .json({ error: "You are not friends with this user" });
  }

  await removeFriend(req.user.id, targetUserId);
  return res.json({ success: true });
}

export async function block(req: Request, res: Response) {
  const result = TargetUserIdSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "userId is required and must be a string" });
  }

  const targetUserId = result.data.userId;
  if (req.user.id === targetUserId) {
    return res.status(400).json({ error: "Cannot block yourself" });
  }

  const existingFriendships = await getFriendship(req.user.id, targetUserId);
  const alreadyBlocked = existingFriendships.some(
    (f) => f.userId === req.user.id && f.status === "BLOCKED",
  );

  if (alreadyBlocked) {
    return res.status(400).json({ error: "User is already blocked" });
  }

  await blockUser(req.user.id, targetUserId);
  return res.json({ success: true });
}

export async function unblock(req: Request, res: Response) {
  const result = TargetUserIdSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "userId is required and must be a string" });
  }

  const targetUserId = result.data.userId;
  if (req.user.id === targetUserId) {
    return res.status(400).json({ error: "Cannot unblock yourself" });
  }

  const existingFriendships = await getFriendship(req.user.id, targetUserId);
  const currentlyBlocked = existingFriendships.some(
    (f) => f.userId === req.user.id && f.status === "BLOCKED",
  );

  if (!currentlyBlocked) {
    return res.status(400).json({ error: "User is not blocked" });
  }

  await unblockUser(req.user.id, targetUserId);
  return res.json({ success: true });
}

export async function listFriends(req: Request, res: Response) {
  const friendsList = await getFriends(req.user.id);
  return res.json({ success: true, data: friendsList });
}

export async function getCounts(req: Request, res: Response) {
  const counts = await getFriendshipCounts(req.user.id);
  return res.json({ success: true, data: counts });
}

export async function listRequests(req: Request, res: Response) {
  const requests = await getFriendRequests(req.user.id);
  return res.json({ success: true, data: requests });
}

export async function listBlocked(req: Request, res: Response) {
  const blockedUsers = await getBlockedUsers(req.user.id);
  return res.json({ success: true, data: blockedUsers });
}

export async function searchUsers(req: Request, res: Response) {
  const result = await searchGlobalUsers(req.query.q as string, req.user.id);

  return res.json({ success: true, data: result });
}

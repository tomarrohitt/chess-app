import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const gameStatusEnum = pgEnum("status", [
  "IN_PROGRESS",
  "CHECKMATE",
  "RESIGN",
  "DRAW",
  "AGREEMENT",
  "STALEMATE",
  "INSUFFICIENT_MATERIAL",
  "FIFTY_MOVE_RULE",
  "THREEFOLD_REPETITION",
  "TIME_OUT",
  "ABANDONED",
]);

export const resultEnum = pgEnum("result", ["d", "w", "b"]);

export const friendStatusEnum = pgEnum("friend_status", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "BLOCKED",
]);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    rating: integer("rating").notNull().default(1000),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    draws: integer("draws").notNull().default(0),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => {
    return [
      index("users_search_trgm_idx").using(
        "gin",
        sql`(${table.username} || ' ' || ${table.name}) gin_trgm_ops`,
      ),
    ];
  },
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().notNull(),
    whiteId: text("white_id")
      .references(() => user.id)
      .notNull(),
    blackId: text("black_id")
      .references(() => user.id)
      .notNull(),
    winnerId: text("winner_id").references(() => user.id),

    status: gameStatusEnum("status").notNull(),
    result: resultEnum("result").notNull().default("d"),

    timeControl: varchar("time_control", { length: 20 }).notNull(),
    pgn: text("pgn").notNull(),
    moveTimes: jsonb("move_times").$type<number[]>().notNull().default([]),
    finalFen: varchar("fen", { length: 2048 }).notNull(),

    whiteTimeLeftMs: integer("white_time_left_ms").notNull(),
    blackTimeLeftMs: integer("black_time_left_ms").notNull(),

    whiteRating: integer("white_rating").notNull().default(1000),
    blackRating: integer("black_rating").notNull().default(1000),
    whiteDiff: integer("white_diff").notNull().default(0),
    blackDiff: integer("black_diff").notNull().default(0),

    capturedByWhite: jsonb("captured_by_white")
      .$type<string[]>()
      .notNull()
      .default([]),
    capturedByBlack: jsonb("captured_by_black")
      .$type<string[]>()
      .notNull()
      .default([]),
    chatLogs: jsonb("chat_logs").$type<unknown[]>().default([]).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("games_white_id_idx").on(table.whiteId),
    index("games_black_id_idx").on(table.blackId),
    index("games_created_at_idx").on(table.createdAt),
    index("games_winner_id_idx").on(table.winnerId),
  ],
);

export const gamesRelations = relations(games, ({ one }) => ({
  white: one(user, {
    fields: [games.whiteId],
    references: [user.id],
  }),
  black: one(user, {
    fields: [games.blackId],
    references: [user.id],
  }),
  winner: one(user, {
    fields: [games.winnerId],
    references: [user.id],
  }),
}));

export const friends = pgTable(
  "friends",
  {
    userId: text("user_id")
      .references(() => user.id)
      .notNull(),

    friendId: text("friend_id")
      .references(() => user.id)
      .notNull(),
    status: friendStatusEnum("status").default("PENDING").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.friendId] })],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    senderId: text("sender_id")
      .references(() => user.id)
      .notNull(),
    receiverId: text("receiver_id")
      .references(() => user.id)
      .notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    read: boolean("read").default(false).notNull(),
  },
  (table) => [
    index("messages_sender_id_idx").on(table.senderId),
    index("messages_receiver_id_idx").on(table.receiverId),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);

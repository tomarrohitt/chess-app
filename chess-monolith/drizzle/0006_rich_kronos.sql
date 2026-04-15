CREATE TABLE "cleared_chats" (
	"user_id" text NOT NULL,
	"other_user_id" text NOT NULL,
	"cleared_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cleared_chats_user_id_other_user_id_pk" PRIMARY KEY("user_id","other_user_id")
);
--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "status" SET DEFAULT 'PENDING'::text;--> statement-breakpoint
DROP TYPE "public"."friend_status";--> statement-breakpoint
CREATE TYPE "public"."friend_status" AS ENUM('PENDING', 'ACCEPTED', 'BLOCKED');--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."friend_status";--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "status" SET DATA TYPE "public"."friend_status" USING "status"::"public"."friend_status";--> statement-breakpoint
ALTER TABLE "cleared_chats" ADD CONSTRAINT "cleared_chats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleared_chats" ADD CONSTRAINT "cleared_chats_other_user_id_user_id_fk" FOREIGN KEY ("other_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
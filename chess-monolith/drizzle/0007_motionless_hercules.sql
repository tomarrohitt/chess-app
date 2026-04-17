CREATE TABLE "chat_state" (
	"user_id" text NOT NULL,
	"other_user_id" text NOT NULL,
	"cleared_at" timestamp DEFAULT now() NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_state_user_id_other_user_id_pk" PRIMARY KEY("user_id","other_user_id")
);
--> statement-breakpoint
DROP TABLE "cleared_chats" CASCADE;--> statement-breakpoint
ALTER TABLE "chat_state" ADD CONSTRAINT "chat_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_state" ADD CONSTRAINT "chat_state_other_user_id_user_id_fk" FOREIGN KEY ("other_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "read";
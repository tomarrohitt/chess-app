ALTER TABLE "games" ALTER COLUMN "chat_logs" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "chat_logs" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "chat_logs" SET NOT NULL;
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { db } from "../../infrastructure/db/db";
import { user } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { extractToken } from "../../lib/utils/auth-utils";
import { Keys } from "../../lib/keys";
import { redis } from "../../infrastructure/redis/redis-client";
import { v2 as cloudinary } from "cloudinary";

export const uploadAvatar = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      public_id: `${req.user.id}-${Date.now()}`,
      timeout: 60000,
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const newImagePath = uploadResult.secure_url;

    if (req.user.image && req.user.image.startsWith("/uploads/")) {
      const oldFilePath = path.join(process.cwd(), req.user.image);
      if (fs.existsSync(oldFilePath)) {
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error("Failed to delete old local avatar:", err);
        });
      }
    }

    const token = extractToken(req);

    await Promise.all([
      db
        .update(user)
        .set({ image: newImagePath })
        .where(eq(user.id, req.user.id)),
      token ? redis.del(Keys.session(token)) : Promise.resolve(),
    ]);

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      image: newImagePath,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({ error: "Failed to upload image" });
  }
};

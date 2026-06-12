import mongoose, { Schema, type Model } from "mongoose";
import type { ModelId } from "@/lib/constants";

export interface IChat {
  userId: string;
  title: string;
  projectId?: mongoose.Types.ObjectId | null;
  model: ModelId;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: String, required: true, index: true, default: "mat" },
    title: { type: String, required: true, default: "New chat" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    model: { type: String, required: true, default: "claude-sonnet-4-6" },
    starred: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "chats" },
);

ChatSchema.index({ userId: 1, updatedAt: -1 });

export const Chat: Model<IChat> =
  (mongoose.models.Chat as Model<IChat>) || mongoose.model<IChat>("Chat", ChatSchema);

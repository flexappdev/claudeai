import mongoose, { Schema, type Model } from "mongoose";

export type MessageRole = "user" | "assistant";

export interface IMessage {
  chatId: mongoose.Types.ObjectId;
  role: MessageRole;
  content: string;
  artifactIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, default: "" },
    artifactIds: [{ type: Schema.Types.ObjectId, ref: "Artifact" }],
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "messages" },
);

MessageSchema.index({ chatId: 1, createdAt: 1 });

export const Message: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ||
  mongoose.model<IMessage>("Message", MessageSchema);

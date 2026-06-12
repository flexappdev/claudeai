import mongoose, { Schema, type Model } from "mongoose";
import { ARTIFACT_TYPES, type ArtifactType } from "@/lib/constants";

export interface IArtifact {
  chatId: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId | null;
  identifier: string;
  title: string;
  type: ArtifactType;
  language?: string | null;
  content: string;
  version: number;
  createdAt: Date;
}

const ArtifactSchema = new Schema<IArtifact>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    messageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    identifier: { type: String, required: true, index: true },
    title: { type: String, required: true },
    type: { type: String, enum: [...ARTIFACT_TYPES], required: true },
    language: { type: String, default: null },
    content: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "artifacts" },
);

ArtifactSchema.index({ chatId: 1, identifier: 1, version: -1 });

export const Artifact: Model<IArtifact> =
  (mongoose.models.Artifact as Model<IArtifact>) ||
  mongoose.model<IArtifact>("Artifact", ArtifactSchema);

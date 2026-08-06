import mongoose, { Schema, type Model } from "mongoose";
import type { SkillIndexEntry } from "@/lib/types";

export interface ISkillIndexSnapshot {
  key: "master";
  skills: SkillIndexEntry[];
  definitions: number;
  scannedAt: Date;
}

const SkillIndexEntrySchema = new Schema<SkillIndexEntry>(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Workflow" },
    platforms: {
      claudeAi: { type: Boolean, default: false },
      claudeCode: { type: Boolean, default: false },
      codex: { type: Boolean, default: false },
    },
    sources: { type: [String], default: [] },
    definitions: { type: Number, default: 1 },
    appSkillId: { type: String, default: null },
    appEnabled: { type: Boolean, default: false },
  },
  { _id: false },
);

const SkillIndexSnapshotSchema = new Schema<ISkillIndexSnapshot>(
  {
    key: { type: String, required: true, unique: true, default: "master" },
    skills: { type: [SkillIndexEntrySchema], default: [] },
    definitions: { type: Number, default: 0 },
    scannedAt: { type: Date, required: true },
  },
  { collection: "skill_index_snapshots", timestamps: true },
);

export const SkillIndexSnapshot: Model<ISkillIndexSnapshot> =
  (mongoose.models.SkillIndexSnapshot as Model<ISkillIndexSnapshot>) ||
  mongoose.model<ISkillIndexSnapshot>("SkillIndexSnapshot", SkillIndexSnapshotSchema);

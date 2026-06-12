import mongoose, { Schema, type Model } from "mongoose";

export type SkillSource = "user" | "builtin";

export interface ISkill {
  userId: string;
  slug: string;
  name: string;
  description: string;
  content: string;
  enabled: boolean;
  source: SkillSource;
  createdAt: Date;
}

const SkillSchema = new Schema<ISkill>(
  {
    userId: { type: String, required: true, index: true, default: "mat" },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    enabled: { type: Boolean, default: false, index: true },
    source: { type: String, enum: ["user", "builtin"], default: "user" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "skills" },
);

export const Skill: Model<ISkill> =
  (mongoose.models.Skill as Model<ISkill>) || mongoose.model<ISkill>("Skill", SkillSchema);

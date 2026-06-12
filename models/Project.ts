import mongoose, { Schema, type Model } from "mongoose";

export interface IProject {
  userId: string;
  name: string;
  description: string;
  instructions: string;
  memory: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: String, required: true, index: true, default: "mat" },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    instructions: { type: String, default: "" },
    memory: { type: String, default: "" },
    color: { type: String, default: "#006699" },
  },
  { timestamps: true, collection: "projects" },
);

ProjectSchema.index({ userId: 1, updatedAt: -1 });

export const Project: Model<IProject> =
  (mongoose.models.Project as Model<IProject>) ||
  mongoose.model<IProject>("Project", ProjectSchema);

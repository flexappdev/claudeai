import mongoose, { Schema, type Model } from "mongoose";

export interface IProjectFile {
  projectId: mongoose.Types.ObjectId;
  filename: string;
  mimeType: string;
  content: string;
  size: number;
  createdAt: Date;
}

const ProjectFileSchema = new Schema<IProjectFile>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, default: "text/plain" },
    content: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "project_files" },
);

export const ProjectFile: Model<IProjectFile> =
  (mongoose.models.ProjectFile as Model<IProjectFile>) ||
  mongoose.model<IProjectFile>("ProjectFile", ProjectFileSchema);

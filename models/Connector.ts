import mongoose, { Schema, type Model } from "mongoose";
import { CONNECTOR_KEYS, type ConnectorKey } from "@/lib/constants";

export type ConnectorStatus = "connected" | "disconnected";

export interface IConnector {
  userId: string;
  key: ConnectorKey;
  name: string;
  status: ConnectorStatus;
  config: Record<string, string>;
  connectedAt?: Date | null;
}

const ConnectorSchema = new Schema<IConnector>(
  {
    userId: { type: String, required: true, index: true, default: "mat" },
    key: { type: String, enum: [...CONNECTOR_KEYS], required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ["connected", "disconnected"], default: "disconnected" },
    config: { type: Schema.Types.Mixed, default: {} },
    connectedAt: { type: Date, default: null },
  },
  { collection: "connectors" },
);

ConnectorSchema.index({ userId: 1, key: 1 }, { unique: true });

export const Connector: Model<IConnector> =
  (mongoose.models.Connector as Model<IConnector>) ||
  mongoose.model<IConnector>("Connector", ConnectorSchema);

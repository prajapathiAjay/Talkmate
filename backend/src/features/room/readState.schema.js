import mongoose from "mongoose";

// When a user last read a room. Unread = other people's messages newer than this.
const readStateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    lastReadAt: { type: Date, required: true },
  },
  { timestamps: true }
);

readStateSchema.index({ userId: 1, roomId: 1 }, { unique: true });

export const ReadStateModel = mongoose.model("ReadState", readStateSchema);

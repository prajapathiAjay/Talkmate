import { RoomModel } from "./room.schema.js";
import mongoose from "mongoose";
import { ReadStateModel } from "./readState.schema.js";
import { MessageModel } from "../message/message.schema.js";

// The room if this user may read/post in it (the public room, or a private room
// they're a participant of), otherwise null
export const canAccessRoomRepo = async (roomId, userId) => {
  if (!mongoose.isValidObjectId(roomId)) return null;
  const room = await RoomModel.findById(roomId).select("type participants");
  if (!room) return null;
  const isParticipant = room.participants.some((id) => id.toString() === String(userId));
  return room.type === "public" || isParticipant ? room : null;
};

export const roomCreationRepo = async (roomData) => {
  try {
    if (!roomData?.type) {
      return {
        success: false,
        error: {
          statusCode: 400,
          message: "Room  type is required",
        },
      };
    }

    let existingRoom;

    if (roomData?.type === "private") {
      existingRoom = await RoomModel.findOne({
        type: "private",
        participants: {
          $all: roomData.participants,
        },
      });
    }

    if (existingRoom) {
      return {
        success: false,
        error: {
          statusCode: 400,
          message: "Room already exists for chat",
        },
      };
    }

    const newRoom = new RoomModel(roomData);
    await newRoom.save();

    return {
      success: true,
      status: 201,
      message: `New room with name:${newRoom?.roomName} has been created uccessfully`,
      data: newRoom,
    };
  } catch (error) {
    if (error.code === 11000) {
      return {
        success: false,
        error: {
          statusCode: 409, // Conflict
          message: "Room name already exists",
        },
      };
    }

    return {
      success: false,
      error: {
        statusCode: 500,
        message: error,
      },
    };
  }
};

export const getRoomDataRepo = async (data) => {
  try {
    if (data?.type === "public") {
      const roomData = await RoomModel.findOne({ type: data?.type });

      return {
        success: true,
        status: 200,
        data: roomData,
      };
    } else if (data?.type === "private") {
      const roomData = await RoomModel.find({ type: "private", participants: { $in: data?.participantIds } });

      return {
        success: true,
        status: 200,
        data: roomData,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: 500,
        message: error,
      },
    };
  }
};

export const roomDatawithseenRepo = async (name = "", Id) => {
  const myId = new mongoose.Types.ObjectId(Id);

  try {
    const response = await RoomModel.aggregate([
      {
        $match: {
          type: "private",
          participants: myId,
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            participants: "$participants",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$participants"] },
                    { $ne: ["$_id", myId] },
                  ],
                },
                name: {
                  $regex: `^${name.trim()}`,
                  $options: "i",
                },
              },
            },
            {
              $project: {
                password: 0,
              },
            },
          ],
          as: "friend",
        },
      },
      {
        $unwind: "$friend",
      },
    ]);

    return {
      success: true,
      status: 200,
      message: "private room dat fetched Successfully",
      data: response,
    };
  } catch (error) {
    console.error("error", error);
  }
};

// Unread counts for every room the user belongs to: { "<roomId>": count }.
// Counts other people's chat messages newer than the user's last read time;
// with no read record yet, counting starts from when the account was created.
export const getUnreadCountsRepo = async (userId) => {
  const me = new mongoose.Types.ObjectId(userId);
  const accountCreatedAt = me.getTimestamp();

  const [rooms, readStates] = await Promise.all([
    RoomModel.find({ $or: [{ type: "public" }, { participants: me }] }).select("_id"),
    ReadStateModel.find({ userId: me }).select("roomId lastReadAt").lean(),
  ]);
  const lastReadByRoom = new Map(readStates.map((s) => [s.roomId.toString(), s.lastReadAt]));

  const counts = {};
  await Promise.all(
    rooms.map(async (room) => {
      const since = lastReadByRoom.get(room._id.toString()) || accountCreatedAt;
      const count = await MessageModel.countDocuments({
        roomId: room._id,
        createdAt: { $gt: since },
        messageType: "user",
        senderId: { $ne: me },
      });
      if (count > 0) counts[room._id.toString()] = count;
    })
  );
  return counts;
};

// Mark a room as read up to now
export const markRoomReadRepo = async (roomId, userId) => {
  await ReadStateModel.updateOne(
    { userId, roomId },
    { $set: { lastReadAt: new Date() } },
    { upsert: true }
  );
};

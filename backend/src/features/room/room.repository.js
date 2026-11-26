import { RoomModel } from "./room.schema.js";
import mongoose from "mongoose";
import { ReadStateModel } from "./readState.schema.js";
import { MessageModel } from "../message/message.schema.js";
import { UserModel } from "../user/user.schema.js";
import { startsWithRegex } from "../../utils/searchRegex.js";

// The room if this user may read/post in it (the public room, or a private room
// they're a participant of), otherwise null
export const canAccessRoomRepo = async (roomId, userId) => {
  if (!mongoose.isValidObjectId(roomId)) return null;
  const room = await RoomModel.findById(roomId).select("type participants");
  if (!room) return null;
  const isParticipant = room.participants.some((id) => id.toString() === String(userId));
  return room.type === "public" || isParticipant ? room : null;
};

const roomError = (statusCode, message) => ({ success: false, error: { statusCode, message } });

// A private chat between the logged-in user and one other user. The server builds
// the room itself; nothing from the request body is saved except the friend's id.
export const createPrivateRoomRepo = async (userId, friendId) => {
  try {
    if (!mongoose.isValidObjectId(friendId)) {
      return roomError(400, "A valid friendId is required");
    }
    if (String(friendId) === String(userId)) {
      return roomError(400, "You can't start a chat with yourself");
    }
    if (!(await UserModel.exists({ _id: friendId }))) {
      return roomError(404, "User not found");
    }

    // Exactly these two people, so a room with extra people doesn't count.
    // Already chatting is not an error: hand back the existing room.
    const existingRoom = await RoomModel.findOne({
      type: "private",
      participants: { $all: [userId, friendId], $size: 2 },
    });
    if (existingRoom) {
      return {
        success: true,
        status: 200,
        message: "Private chat already exists",
        data: existingRoom,
      };
    }

    const newRoom = await RoomModel.create({
      type: "private",
      participants: [userId, friendId],
      createdBy: userId,
    });

    return {
      success: true,
      status: 201,
      message: "Private chat created successfully",
      data: newRoom,
    };
  } catch (error) {
    return roomError(500, "Error while creating the chat");
  }
};

// The app has exactly one public room; create it on first start
export const ensurePublicRoomRepo = async () => {
  const publicRoom = await RoomModel.findOne({ type: "public" });
  if (publicRoom) return publicRoom;
  return RoomModel.create({ roomName: "Public Room", type: "public" });
};

export const getRoomDataRepo = async (data, userId) => {
  try {
    if (data?.type === "public") {
      const roomData = await RoomModel.findOne({ type: data?.type });

      return {
        success: true,
        status: 200,
        data: roomData,
      };
    } else if (data?.type === "private") {
      // Only your own private chats; who "you" are comes from the login token
      const roomData = await RoomModel.find({ type: "private", participants: userId });

      return {
        success: true,
        status: 200,
        data: roomData,
      };
    }

    return roomError(400, "Room type must be public or private");
  } catch (error) {
    return roomError(500, "Error while fetching the room data");
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
                name: startsWithRegex(name),
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
    return roomError(500, "Error while fetching private chats");
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

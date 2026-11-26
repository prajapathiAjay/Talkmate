import mongoose from "mongoose";
import { FriendModel } from "./friend.schema.js";
import { UserModel } from "../user/user.schema.js";

export const getFriendsRepo = async (userId) => {
  try {
    const response = await FriendModel.find({ userId }).populate("friendId", "name email isOnline lastSeen");
    return {
      success: true,
      status: 200,
      data: response,
    };
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

const friendError = (statusCode, message) => ({ success: false, error: { statusCode, message } });

export const addFriendRepo = async (userId, friendId) => {
  try {
    if (!mongoose.isValidObjectId(friendId)) {
      return friendError(400, "A valid friendId is required");
    }
    if (String(friendId) === String(userId)) {
      return friendError(400, "You can't add yourself as a friend");
    }
    if (!(await UserModel.exists({ _id: friendId }))) {
      return friendError(404, "User not found");
    }

    const existingFriend = await FriendModel.findOne({ userId, friendId });
    if (existingFriend) {
      return {
        success: false,
        error: {
          statusCode: 400,
          message: "Friend already exists",
        },
      };
    }

    const response = await FriendModel.create({ userId, friendId });
    return {
      success: true,
      status: 200,
      data: response,
    };
  } catch (error) {
    return friendError(500, "Adding friend failed");
  }
};

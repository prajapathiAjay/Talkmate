import bcrypt from "bcrypt";
import { UserModel } from "./user.schema.js";
import { RoomModel } from "../room/room.schema.js";
import { FriendModel } from "../friend/friend.schema.js";
import { startsWithRegex } from "../../utils/searchRegex.js";

export const userRegisterationRepo = async (userData) => {
  try {
    const existingUser = await UserModel.findOne({ email: userData?.email });
    if (existingUser) {
      return {
        success: false,
        error: {
          statusCode: 409,
          msg: "Email is already registered",
        },
      };
    }

    const publicRoomData = await RoomModel.findOne({ type: "public" });
    const newUser = new UserModel(userData);

    await newUser.save();
    return {
      success: true,
      status: 201,
      message: "User Registered Successfully",
      data: {
        user: {
          publicRoomId: publicRoomData?._id,
          userId: newUser?._id,
          name: newUser?.name,
        },
      },
    };
  } catch (error) {
    // Unique index on email catches simultaneous sign-ups the check above misses
    if (error.code === 11000) {
      return {
        success: false,
        error: {
          statusCode: 409,
          msg: "Email is already registered",
        },
      };
    }

    return {
      success: false,
      error: {
        statusCode: 500,
        msg: error,
      },
    };
  }
};

export const userSignInRepo = async (data) => {
  const { email, password } = data;

  try {
    const user = await UserModel.findOne({ email });
    const publicRoomData = await RoomModel.findOne({ type: "public" });

    if (!user) {
      return {
        success: false,
        error: {
          statusCode: 401,
          msg: "User Not Found",
        },
      };
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return {
        success: false,
        error: {
          statusCode: 401,
          msg: "Invalid Credentials",
        },
      };
    }

    return {
      success: true,
      status: 200,
      message: "Signin Successful",
      data: {
        user: {
          publicRoomId: publicRoomData?._id,
          userId: user?._id,
          name: user?.name,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: 500,
        msg: error,
      },
    };
  }
};

export const getAllUsersRepo = async (id, isOnline, name = "") => {
  try {
    const filter = {};

    if (isOnline !== undefined) {
      filter.isOnline = isOnline === "true";
    }

    if (String(name ?? "").trim()) {
      filter.name = startsWithRegex(name);
    }

    const getAllUser = await UserModel.find(filter).select("-password");
    const allFriends = await FriendModel.find({ userId: { $eq: id } });

    const friendsIds = allFriends.map((friend) => friend.friendId.toString());

    const gestAlluserWithFriendStatus = getAllUser.map((user) => ({
      ...user.toObject(),
      isFriend: friendsIds.includes(user._id.toString()),
    }));

    return {
      success: true,
      status: 200,
      message: "All Users Fetched Successfully",
      data: gestAlluserWithFriendStatus,
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

// Socket repo functions

export const handleOnlineUsersrepo = async (onlineStatus, userId) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isOnline: onlineStatus, lastSeen: new Date() },
      { new: true }
    ).select("-password");
    return {
      success: true,
      status: 200,
      data: updatedUser,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

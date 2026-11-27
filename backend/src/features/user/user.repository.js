import bcrypt from "bcrypt";
import { UserModel } from "./user.schema.js";
import { RoomModel } from "../room/room.schema.js";
import { FriendModel } from "../friend/friend.schema.js";
import { startsWithRegex } from "../../utils/searchRegex.js";

// Find a user by email ignoring capitals: "Ajay@gmail.com" and "ajay@gmail.com" are
// the same inbox. The email is still saved exactly as the user typed it.
const findUserByEmail = (email) =>
  UserModel.findOne({ email: String(email ?? "").trim() }).collation({ locale: "en", strength: 2 });

export const userRegisterationRepo = async (userData) => {
  try {
    const existingUser = await findUserByEmail(userData?.email);
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

    // Bad input (e.g. name too short, invalid email): a 400 with the schema's own message
    if (error.name === "ValidationError") {
      return {
        success: false,
        error: {
          statusCode: 400,
          msg: Object.values(error.errors)[0]?.message || "Invalid sign-up details",
        },
      };
    }

    return {
      success: false,
      error: {
        statusCode: 500,
        msg: "Registration failed. Please try again.",
      },
    };
  }
};

export const userSignInRepo = async (data) => {
  const { email, password } = data;

  try {
    const user = await findUserByEmail(email);
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
        msg: "Sign in failed. Please try again.",
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

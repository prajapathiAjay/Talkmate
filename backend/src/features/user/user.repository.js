import bcrypt from "bcrypt";
import crypto from "crypto";
import { UserModel } from "./user.schema.js";
import { RoomModel } from "../room/room.schema.js";
import { FriendModel } from "../friend/friend.schema.js";
import { startsWithRegex } from "../../utils/searchRegex.js";

// Find a user by email ignoring capitals: "Ajay@gmail.com" and "ajay@gmail.com" are
// the same inbox. The email is still saved exactly as the user typed it.
const findUserByEmail = (email) =>
  UserModel.findOne({ email: String(email ?? "").trim() })
    .collation({ locale: "en", strength: 2 })
    .select("+tokenVersion");

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
          email: newUser?.email,
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
      // For the login token only; not sent to the app
      tokenVersion: user.tokenVersion ?? 0,
      data: {
        user: {
          publicRoomId: publicRoomData?._id,
          userId: user?._id,
          name: user?.name,
          email: user?.email,
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

// ---- Account settings and password reset ----

const accountError = (statusCode, msg) => ({ success: false, error: { statusCode, msg } });

export const updateNameRepo = async (userId, name) => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { name: name.trim() },
    { new: true, runValidators: true }
  ).select("name email");
  if (!user) return accountError(404, "User not found");
  return { success: true, data: { name: user.name, email: user.email } };
};

// Saves a new password and marks when it changed, which logs out other devices
const setPassword = (user, newPassword) =>
  bcrypt.hash(newPassword, 10).then((hash) => {
    user.password = hash;
    user.passwordChangedAt = new Date();
    // Invalidates every existing login token (other devices get signed out)
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    // Only password fields change; don't fail on older accounts that predate newer rules
    return user.save({ validateBeforeSave: false });
  });

export const changePasswordRepo = async (userId, currentPassword, newPassword) => {
  const user = await UserModel.findById(userId).select("+tokenVersion");
  if (!user) return accountError(404, "User not found");

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return accountError(400, "Current password is incorrect");
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    return accountError(400, "New password must be different from the current one");
  }

  await setPassword(user, newPassword);
  return { success: true, tokenVersion: user.tokenVersion };
};

const RESET_CODE_MINUTES = 30;
const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");

// Creates a one-time reset code for this email. Returns { user, code } when the
// account exists, or null when it doesn't (the caller must not reveal which).
export const createPasswordResetRepo = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const code = crypto.randomBytes(32).toString("hex");
  user.resetPasswordTokenHash = hashCode(code);
  user.resetPasswordExpires = new Date(Date.now() + RESET_CODE_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  return { user, code, minutes: RESET_CODE_MINUTES };
};

export const resetPasswordRepo = async (code, newPassword) => {
  if (typeof code !== "string" || !code) return accountError(400, "This reset link is invalid");

  const user = await UserModel.findOne({
    resetPasswordTokenHash: hashCode(code),
    resetPasswordExpires: { $gt: new Date() },
  }).select("+tokenVersion");
  if (!user) {
    return accountError(400, "This reset link is invalid or has expired. Please request a new one.");
  }

  await setPassword(user, newPassword);
  return { success: true };
};

// ---- Muted chats ----

export const getMutedRoomsRepo = async (userId) => {
  const user = await UserModel.findById(userId).select("+mutedRooms").lean();
  return (user?.mutedRooms || []).map((id) => id.toString());
};

export const setRoomMutedRepo = async (userId, roomId, muted) => {
  await UserModel.updateOne(
    { _id: userId },
    muted ? { $addToSet: { mutedRooms: roomId } } : { $pull: { mutedRooms: roomId } }
  );
  return getMutedRoomsRepo(userId);
};

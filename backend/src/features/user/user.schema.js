import mongoose from "mongoose";

// Fields marked select: false are private to the account (never sent in user
// lists or status updates); queries that need them ask with .select("+field")
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is Required"],
    minLength: [3, "The name should be at least 3 characters long"],
  },
  email: {
    type: String,
    required: [true, "Email Is required"],
    unique: true,
    match: [/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  // When the password was last changed or reset (for the record)
  passwordChangedAt: {
    type: Date,
    select: false,
  },
  // Goes up by one on every password change/reset. Login tokens carry the version
  // they were made with, and older ones are rejected (see utils/token.js).
  tokenVersion: {
    type: Number,
    default: 0,
    select: false,
  },
  // Forgot-password: only a hash of the emailed code is stored, never the code itself
  resetPasswordTokenHash: {
    type: String,
    index: true,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  // Chats this user muted: no unread badges for them
  mutedRooms: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
    select: false,
  },
});

export const UserModel = mongoose.model("User", userSchema);

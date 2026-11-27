import jwt from "jsonwebtoken";
import { UserModel } from "../features/user/user.schema.js";

// "Remember me" logins last a long time; others only a day (the app also keeps
// them in sessionStorage, so they end when the browser closes)
const REMEMBERED_EXPIRY = process.env.JWT_EXPIRES_IN || "30d";
const SESSION_EXPIRY = "1d";

// `tokenVersion` is the user's current version (see user.schema.js). Each password
// change or reset raises it, which invalidates every token made with the old one.
export const signToken = (userId, rememberMe = true, tokenVersion = 0) =>
  jwt.sign({ id: userId, v: tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? REMEMBERED_EXPIRY : SESSION_EXPIRY,
  });

// Check a login token and return { id }. Throws if the token is invalid, expired,
// belongs to a deleted user, or was made before the user's last password change
// (so changing or resetting a password logs out every other device).
export const verifyToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await UserModel.findById(decoded.id).select("+tokenVersion").lean();
  if (!user) throw new Error("Invalid token: user not found");

  // Tokens and accounts from before versions existed count as version 0
  if ((decoded.v ?? 0) !== (user.tokenVersion ?? 0)) {
    throw new Error("Token expired: password was changed");
  }

  return { id: decoded.id };
};

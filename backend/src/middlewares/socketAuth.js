import { verifyToken } from "../utils/token.js";

export const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    socket.user = await verifyToken(token);
  } catch (err) {
    return next(new Error("Invalid or expired token"));
  }

  next();
};

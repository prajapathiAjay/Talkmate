import jwt from "jsonwebtoken";

export const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = {
      id: decoded.id,
    };

    next();
  } catch (err) {
    console.error(err);
    next(new Error("Invalid or expired token"));
  }
};

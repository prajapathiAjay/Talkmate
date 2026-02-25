

import jwt from "jsonwebtoken";
import * as cookie from "cookie";

export const socketAuth = (socket, next) => {
  try {
    // console.log("Handshake headers:", socket.handshake.headers);

    const rawCookie = socket.handshake.headers.cookie;

    if (!rawCookie) {
      console.log("❌ No rawCookie");
      return next(new Error("Unauthorized"));
    }
    
    const cookies = cookie.parse(rawCookie);
    const jwtToken = cookies.jwtToken;
  //  console.log("jwtToken",jwtToken)
    if (!jwtToken) {
      console.log("❌ No jwtToken in cookie");
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);

    // console.log("✅ Token verified:", decoded);

    socket.user = {
      id: decoded.id,
    };

    next();
  } catch (err) {
    console.log("🔥 JWT VERIFY ERROR:", err.message);
    next(new Error("Invalid or expired token"));
  }
};
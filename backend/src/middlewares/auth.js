import { verifyToken } from "../utils/token.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      msg: "Unauthorized Access",
    });
  }

  try {
    req.user = await verifyToken(authHeader.split(" ")[1]);
  } catch (err) {
    return res.status(401).json({
      success: false,
      msg: "Invalid or Expired Token",
    });
  }

  next();
};

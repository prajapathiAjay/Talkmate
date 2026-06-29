

// import jwt from "jsonwebtoken";

// export const authMiddleware = (req, res, next) => {
//   try {
//     const { jwtToken } = req.cookies;
//   console.log("Cookies:", req.cookies);
//     console.log("JWT Token:", req.cookies.jwtToken);
//     if (!jwtToken) {
//       return res.status(401).json({
//         success: false,
//         msg: "Unauthorized Access",
//       });
//     }

//     const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);

//     // Attach user context
//     req.user = {
//       id: decoded.id,
//     };

//     next();
//   } catch (err) {
//     return res.status(401).json({
//       success: false,
//       msg: "Invalid or Expired Token",
//     });
//   }
// };


import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    console.log("Authorization Header:", authHeader);

    // Check if header exists and starts with Bearer
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized Access",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    console.log("Token:", token);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = {
      id: decoded.id,
    };

    next();
  } catch (err) {
    console.log(err);

    return res.status(401).json({
      success: false,
      msg: "Invalid or Expired Token",
    });
  }
};


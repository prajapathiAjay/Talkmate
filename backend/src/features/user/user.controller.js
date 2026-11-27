import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRegisterationRepo, userSignInRepo, getAllUsersRepo } from "./user.repository.js";
import { customErrorHandler } from "../../middlewares/errorHandler.js";

// The first required field that is missing or not text, or null if all are present
const missingField = (body, fields) =>
  fields.find((field) => typeof body?.[field] !== "string" || !body[field].trim()) || null;

export const userRegisteration = async (req, res, next) => {
  try {
    const missing = missingField(req.body, ["name", "email", "password"]);
    if (missing) {
      return next(new customErrorHandler(400, `${missing} is required`));
    }

    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const resp = await userRegisterationRepo({
      ...req.body,
      password: hashedPassword,
    });

    if (resp.success) {
      const token = jwt.sign(
        { id: resp.data.user.userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      return res.status(201).json({
        success: true,
        message: resp.message,
        data: resp.data,
        token,
      });
    }

    // Business logic error (handled response)
    return next(
      new customErrorHandler(
        resp.error?.statusCode || 400,
        resp.error?.msg || "Registration failed"
      )
    );
  } catch (error) {
    // Unexpected / runtime errors
    return next(
      new customErrorHandler(
        error.statusCode || 500,
        error.message || "Internal Server Error"
      )
    );
  }
};

export const userSignIn = async (req, res, next) => {
  try {
    const missing = missingField(req.body, ["email", "password"]);
    if (missing) {
      return next(new customErrorHandler(400, `${missing} is required`));
    }

    const response = await userSignInRepo(req.body);

    if (response.success) {
      const token = jwt.sign(
        { id: response.data.user.userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      return res.status(200).json({
        success: true,
        message: response.message,
        token,
        data: response.data,
      });
    }

    return next(
      new customErrorHandler(
        response.error.statusCode,
        response.error.msg
      )
    );
  } catch (error) {
    return next(
      new customErrorHandler(
        500,
        error.message || "Internal Server Error"
      )
    );
  }
};

export const userLogout = async (req, res, next) => {
  try {
    res
      .clearCookie("jwtToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    return next(
      new customErrorHandler(
        500,
        error.message || "Internal Server Error"
      )
    );
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { isOnline, name } = req.query;

    const allUsers = await getAllUsersRepo(req?.user?.id, isOnline, name);

    if (allUsers.success) {
      return res.status(200).json({
        success: allUsers?.success,
        message: allUsers?.message,
        data: allUsers?.data,
      });
    }
    return next(new customErrorHandler(500, "Error while fetching users"));
  } catch (error) {
    return next(new customErrorHandler(500, error.message || "internal Server error"));
  }
};

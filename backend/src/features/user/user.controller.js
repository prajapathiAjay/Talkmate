import bcrypt from "bcrypt";
import {
  userRegisterationRepo,
  userSignInRepo,
  getAllUsersRepo,
  updateNameRepo,
  changePasswordRepo,
  createPasswordResetRepo,
  resetPasswordRepo,
} from "./user.repository.js";
import { customErrorHandler } from "../../middlewares/errorHandler.js";
import { signToken } from "../../utils/token.js";
import { passwordProblem, nameProblem } from "../../utils/validation.js";
import { sendMail } from "../../utils/mailer.js";

// The first required field that is missing or not text, or null if all are present
const missingField = (body, fields) =>
  fields.find((field) => typeof body?.[field] !== "string" || !body[field].trim()) || null;

export const userRegisteration = async (req, res, next) => {
  try {
    const missing = missingField(req.body, ["name", "email", "password"]);
    if (missing) {
      return next(new customErrorHandler(400, `${missing} is required`));
    }
    const weakPassword = passwordProblem(req.body.password);
    if (weakPassword) {
      return next(new customErrorHandler(400, weakPassword));
    }

    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Only these fields are saved, so a request can't set things like mutedRooms
    const resp = await userRegisterationRepo({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
    });

    if (resp.success) {
      return res.status(201).json({
        success: true,
        message: resp.message,
        data: resp.data,
        token: signToken(resp.data.user.userId, true),
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
    return next(new customErrorHandler(500, "Registration failed. Please try again."));
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
      // "Remember me" unticked -> a short-lived token (the app keeps it only for this session)
      const rememberMe = req.body.rememberMe !== false;

      return res.status(200).json({
        success: true,
        message: response.message,
        token: signToken(response.data.user.userId, rememberMe, response.tokenVersion),
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
    return next(new customErrorHandler(500, "Sign in failed. Please try again."));
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

// PATCH /api/user/profile { name }
export const updateProfile = async (req, res, next) => {
  try {
    const problem = nameProblem(req.body?.name);
    if (problem) return next(new customErrorHandler(400, problem));

    const resp = await updateNameRepo(req.user.id, req.body.name);
    if (!resp.success) return next(new customErrorHandler(resp.error.statusCode, resp.error.msg));

    return res.status(200).json({ success: true, message: "Name updated", data: resp.data });
  } catch (error) {
    return next(new customErrorHandler(500, "Couldn't update your name. Please try again."));
  }
};

// PATCH /api/user/password { currentPassword, newPassword }
// Logs out other devices; this device gets a fresh token in the response.
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, rememberMe } = req.body || {};
    if (typeof currentPassword !== "string" || !currentPassword) {
      return next(new customErrorHandler(400, "Current password is required"));
    }
    const weakPassword = passwordProblem(newPassword);
    if (weakPassword) return next(new customErrorHandler(400, weakPassword));

    const resp = await changePasswordRepo(req.user.id, currentPassword, newPassword);
    if (!resp.success) return next(new customErrorHandler(resp.error.statusCode, resp.error.msg));

    return res.status(200).json({
      success: true,
      message: "Password changed. Other devices have been signed out.",
      token: signToken(req.user.id, rememberMe !== false, resp.tokenVersion),
    });
  } catch (error) {
    return next(new customErrorHandler(500, "Couldn't change your password. Please try again."));
  }
};

// Max reset emails per address per hour, so nobody can flood someone's inbox.
// Kept in memory: it resets when the server restarts, which is fine for this purpose.
const RESET_LIMIT = 3;
const RESET_WINDOW_MS = 60 * 60 * 1000;
const resetRequests = new Map(); // lowercased email -> [timestamps]

const tooManyResetRequests = (email) => {
  const key = email.trim().toLowerCase();
  const now = Date.now();
  const recent = (resetRequests.get(key) || []).filter((t) => now - t < RESET_WINDOW_MS);
  if (recent.length >= RESET_LIMIT) {
    resetRequests.set(key, recent);
    return true;
  }
  resetRequests.set(key, [...recent, now]);
  return false;
};

// POST /api/user/forgot-password { email }
// Always gives the same answer, so it can't be used to find out who has an account.
export const forgotPassword = async (req, res, next) => {
  const sameAnswer = {
    success: true,
    message: "If an account exists for that email, we've sent a link to reset the password.",
  };

  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    if (!email) return next(new customErrorHandler(400, "email is required"));

    if (tooManyResetRequests(email)) {
      return next(
        new customErrorHandler(429, "Too many reset requests. Please try again in an hour.")
      );
    }

    const reset = await createPasswordResetRepo(email);
    if (reset) {
      const appUrl = (process.env.FRONTEND_URI || "http://localhost:5173").replace(/\/+$/, "");
      const link = `${appUrl}/reset-password?token=${reset.code}`;
      await sendMail({
        to: reset.user.email,
        subject: "Reset your JubJub password",
        text:
          `Hi ${reset.user.name},\n\n` +
          `Someone asked to reset the password for your JubJub account. ` +
          `Open this link to choose a new one (it works for ${reset.minutes} minutes, once):\n\n` +
          `${link}\n\n` +
          `If this wasn't you, ignore this email - your password won't change.`,
        html:
          `<p>Hi ${escapeHtml(reset.user.name)},</p>` +
          `<p>Someone asked to reset the password for your JubJub account. ` +
          `This link works for ${reset.minutes} minutes, once:</p>` +
          `<p><a href="${link}">Reset my password</a></p>` +
          `<p>If this wasn't you, ignore this email - your password won't change.</p>`,
      });
    }

    return res.status(200).json(sameAnswer);
  } catch (error) {
    console.error("forgotPassword failed:", error);
    return next(new customErrorHandler(500, "Couldn't send the reset email. Please try again later."));
  }
};

// POST /api/user/reset-password { token, password }
export const resetPassword = async (req, res, next) => {
  try {
    const weakPassword = passwordProblem(req.body?.password);
    if (weakPassword) return next(new customErrorHandler(400, weakPassword));

    const resp = await resetPasswordRepo(req.body?.token, req.body.password);
    if (!resp.success) return next(new customErrorHandler(resp.error.statusCode, resp.error.msg));

    return res.status(200).json({
      success: true,
      message: "Password reset. You can now sign in with your new password.",
    });
  } catch (error) {
    return next(new customErrorHandler(500, "Couldn't reset your password. Please try again."));
  }
};

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

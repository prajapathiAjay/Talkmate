import { getFriendsRepo, addFriendRepo } from "./friend.repository.js";
import { customErrorHandler } from "../../middlewares/errorHandler.js";

export const getFriends = async (req, res, next) => {
  try {
    const response = await getFriendsRepo(req?.user?.id);

    if (response?.success) {
      res.status(200).json({
        success: true,
        data: response?.data,
        message: "Friends fetched successfully",
      });
    }
  } catch (error) {
    new customErrorHandler(
      res.error?.statusCode || 400,
      res.error?.msg || "message fetching failed"
    );
  }
};

export const addFriend = async (req, res, next) => {
  try {
    const { friendId } = req.body;

    // Who is adding comes from the login token, never from the request body
    const response = await addFriendRepo(req.user.id, friendId);
    if (response?.success) {
      return res.status(200).json({
        success: true,
        data: response?.data,
        message: "Friend added successfully",
      });
    }
    return next(
      new customErrorHandler(
        response?.error?.statusCode || 400,
        response?.error?.message || "Adding friend failed"
      )
    );
  } catch (error) {
    return next(new customErrorHandler(500, "Adding friend failed"));
  }
};

import { MessageModel } from "./message.schema.js";

export const createMessageRepository = async (messageData) => {
  try {
    const newMessage = new MessageModel(messageData);
    await newMessage.save();
    return {
      success: true,
      status: 201,
      message: "New message has been created successfully",
      data: newMessage,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: 500,
        message: error,
      },
    };
  }
};

export const MESSAGE_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

// One page of a room's history, oldest first: the newest `limit` messages, or with
// `before` (a message id) the `limit` messages just older than that one.
// hasMore says whether even older messages exist.
export const getMessageRepo = async ({ roomId, before, limit }) => {
  try {
    const size = Math.min(Math.max(parseInt(limit, 10) || MESSAGE_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const filter = { roomId };

    if (before) {
      const anchor = await MessageModel.findOne({ _id: before, roomId }).select("createdAt").lean();
      if (!anchor) return { success: true, status: 200, data: [], hasMore: false };
      // Older than the anchor; the id breaks ties between messages in the same millisecond
      filter.$or = [
        { createdAt: { $lt: anchor.createdAt } },
        { createdAt: anchor.createdAt, _id: { $lt: anchor._id } },
      ];
    }

    // Newest first so the limit keeps the most recent ones, then flipped to oldest first
    const newestFirst = await MessageModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(size + 1)
      .lean();

    return {
      success: true,
      status: 200,
      message: "messageFetched Successfully",
      data: newestFirst.slice(0, size).reverse(),
      hasMore: newestFirst.length > size,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

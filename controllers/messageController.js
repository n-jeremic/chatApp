const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const Message = require('../models/messageModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const createChat = async (receiver_id, sender_id) => {
  let chat = await Chat.findOneAndUpdate(
    {
      users: { $all: [receiver_id, sender_id] }
    },
    { lastMsgAt: Date.now() },
    { new: true }
  );

  if (!chat) {
    chat = await Chat.create({ users: [sender_id, receiver_id], lastMsgAt: Date.now() });
  }

  return chat;
};

exports.createMessage = catchAsync(async (req, res, next) => {
  if (!req.params.receiver_id) {
    return next(new AppError('A message must have a receiver!', 400));
  }

  const chat = await createChat(req.params.receiver_id, req.user.id);

  req.body.chatId = chat.id;
  req.body.from = req.user.id;
  req.body.to = req.params.receiver_id;
  const message = await Message.create(req.body);

  await User.findByIdAndUpdate(req.params.receiver_id, {
    $push: { newMessages: message.id }
  });

  res.status(200).json({
    status: 'success',
    data: {
      message
    }
  });
});

exports.markMsgsAsSeen = catchAsync(async (req, res, next) => {
  await Message.updateMany({ to: req.user._id, from: req.params.userId }, { seen: true });

  res.status(200).json({
    status: 'success'
  });
});

exports.deleteChat = catchAsync(async (req, res, next) => {
  await Chat.findByIdAndDelete(req.params.chatId);
  await Message.deleteMany({ chatId: req.params.chatId });

  res.status(204).json({
    status: 'success'
  });
});

const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A chat must have minimum of 2 users!']
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now()
    },
    lastMsgAt: {
      type: Date,
      required: [true, 'There must be a time of last message!']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// VIRTUAL PROPERTIES
chatSchema.virtual('messages', {
  ref: 'Message',
  foreignField: 'chatId',
  localField: '_id'
});

chatSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'messages',
    select: '-__v'
  }).populate({
    path: 'users',
    select: '-__v'
  });

  next();
});

const Chat = new mongoose.model('Chat', chatSchema);

module.exports = Chat;

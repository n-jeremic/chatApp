const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A chat must have minimum of 2 users!']
      }
    ]
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
  });

  next();
});

const Chat = new mongoose.model('Chat', chatSchema);

module.exports = Chat;

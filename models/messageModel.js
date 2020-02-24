const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'There must be a sender!']
  },
  to: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'There must be a receiver!']
  },
  text: {
    type: String,
    required: [true, 'Message can not be empty!']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  chatId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chat',
    required: [true, 'Message must belong to the chat!']
  }
});

messageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'from',
    select: 'firstName lastName profilePhoto'
  }).populate({
    path: 'to',
    select: 'firstName lastName profilePhoto'
  });

  next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

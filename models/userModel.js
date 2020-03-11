const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'User must provide first name!']
    },
    lastName: {
      type: String,
      required: [true, 'User must provide last name!']
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'User must provide an email!'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email!']
    },
    dateOfBirth: Date,
    birthday: String,
    profilePhoto: {
      type: String,
      default: 'default.jpg'
    },
    coverPhoto: {
      type: String,
      default: 'defaultCover.jpg'
    },
    password: {
      type: String,
      required: [true, 'User must provide a password!'],
      minlength: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'User must confirm a password!'],
      validate: {
        // This validator only runs on CREATE and SAVE
        validator: function(el) {
          return this.password === el;
        },
        message: 'Passwords do not match!'
      }
    },
    changedPasswordAt: Date,
    newMessages: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Message'
      }
    ],
    newNotifications: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Notification'
      }
    ],
    gameRequest: {
      userId: mongoose.Schema.ObjectId,
      gameId: mongoose.Schema.ObjectId,
      firstName: String,
      lastName: String,
      profilePhoto: String,
      accepted: Boolean
    },
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    passwordResetToken: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// VIRTUAL PROPERTIES
userSchema.virtual('chats', {
  ref: 'Chat',
  foreignField: 'users',
  localField: '_id'
});

userSchema.virtual('posts', {
  ref: 'Post',
  foreignField: 'user',
  localField: '_id'
});

// MODEL METHODS
userSchema.methods.createPasswordResetToken = async function() {
  const user_id = this._id;
  const resetToken = jwt.sign({ user_id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  this.passwordResetToken = await bcrypt.hash(resetToken, 8);

  return resetToken;
};

// PRE-SAVE DOCUMENT MIDDLEWARE
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.changedPasswordAt = Date.now() - 1000;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

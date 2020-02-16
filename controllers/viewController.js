const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

exports.login = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log In'
  });
};

exports.signup = (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Sign Up'
  });
};

exports.chat = catchAsync(async (req, res, next) => {
  const users = await User.find().populate('chats');
  const sortedUsers = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].id == req.user.id) {
      continue;
    }
    if (users[i].isLoggedIn) {
      sortedUsers.unshift(users[i]);
    } else {
      sortedUsers.push(users[i]);
    }
  }

  res.status(200).render('chat', {
    title: 'Chat',
    users: sortedUsers,
    userMe: req.user
  });
});

exports.myProfile = catchAsync(async (req, res, next) => {
  res.status(200).render('profile', {
    title: 'My Profile',
    userMe: req.user
  });
});

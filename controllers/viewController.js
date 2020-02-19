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
  const user = await User.findById(req.user.id).populate({
    path: 'posts',
    select: '-__v'
  });

  if (user.dateOfBirth) {
    const dateArr = user.dateOfBirth.toString().split(' ');
    const finalArr = [];
    for (let i = 0; i < 4; i++) {
      finalArr.push(dateArr[i]);
    }

    user.birthday = finalArr.join(' ');
  }

  res.status(200).render('profile', {
    title: 'My Profile',
    user,
    userMe: req.user
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  if (req.params.user_id === req.user.id) {
    return res.redirect('/me');
  }
  const user = await User.findById(req.params.user_id).populate({
    path: 'posts',
    select: '-__v'
  });

  if (!user) {
    return next(new AppError('This user no longer exists!', 404));
  }

  if (user.dateOfBirth) {
    const dateArr = user.dateOfBirth.toString().split(' ');
    const finalArr = [];
    for (let i = 0; i < 4; i++) {
      finalArr.push(dateArr[i]);
    }

    user.birthday = finalArr.join(' ');
  }

  res.status(200).render('profile', {
    title: 'Profile',
    user,
    userMe: req.user
  });
});

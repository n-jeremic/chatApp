const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = user_id => {
  return jwt.sign({ user_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  res.cookie('jwt', token, cookieOptions);

  return token;
};

exports.signup = catchAsync(async (req, res, next) => {
  req.body.isLoggedIn = true;
  const newUser = await User.create(req.body);
  const token = createSendToken(newUser, res);
  newUser.password = undefined;

  res.status(201).json({
    status: 'success',
    token,
    data: {
      newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('You must provide email and password!', 400));
  }

  let user = await User.findOne({ email }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Invalid email or password!', 400));
  }

  const token = createSendToken(user, res);
  user = await User.findOneAndUpdate(
    { email },
    { isLoggedIn: true },
    {
      new: true,
      runValidators: false
    }
  ).select('-__v');

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'You are not logged in. Please log in to perform this action!',
        404
      )
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.user_id);

  if (!currentUser) {
    return next(new AppError('This user no longer exist.', 404));
  }

  req.user = currentUser;
  next();
});

exports.logOut = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user.id,
    { isLoggedIn: false },
    {
      runValidators: false
    }
  );

  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Successfully logged out!'
  });
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const { password, newPassword, newPasswordConfirm } = req.body;

  if (!password || !newPasswordConfirm || !newPassword) {
    return next(new AppError('Please send all required data!', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!(await bcrypt.compare(password, user.password))) {
    return next(
      new AppError(
        'Please provide a valid password in order to update it!',
        400
      )
    );
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  const token = createSendToken(user, res);
  res.status(200).json({
    status: 'success',
    token
  });
});

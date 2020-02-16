const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const userRouter = require('./routes/userRoutes');
const messageRouter = require('./routes/messageRoutes');
const viewRouter = require('./routes/viewRoutes');
const errorController = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARE STACK (Every request goes through this stack)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES
app.use('/api/messages', messageRouter);
app.use('/api/users', userRouter);
app.use('/', viewRouter);

// ERROR HANDLING
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorController);

module.exports = app;

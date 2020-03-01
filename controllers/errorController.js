const sendErorr = (req, res, err) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    if (err.message.includes('You are not logged in.')) {
      res.redirect('/login');
      return;
    }

    res.status(err.statusCode).render('error', {
      error: err
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'fail';

  sendErorr(req, res, err);
};

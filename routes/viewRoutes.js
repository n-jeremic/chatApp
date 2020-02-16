const express = require('express');
const authController = require('../controllers/authController');
const viewController = require('../controllers/viewController');

const router = express.Router();

router.get('/login', viewController.login);
router.get('/signup', viewController.signup);
router.get('/chat', authController.protect, viewController.chat);
router.get('/profile', authController.protect, viewController.myProfile);

module.exports = router;

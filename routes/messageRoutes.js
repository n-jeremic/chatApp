const express = require('express');
const authController = require('../controllers/authController');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.post('/:receiver_id', authController.protect, messageController.createMessage);

module.exports = router;

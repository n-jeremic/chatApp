const express = require('express');
const authController = require('../controllers/authController');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.post('/sendRequest/:userId', authController.protect, gameController.sendGameRequest);

router.patch('/roundScore/:gameId/:player', authController.protect, gameController.updateRoundScore);
router.patch('/totalScore/:gameId/:player', authController.protect, gameController.updateTotalScore);

module.exports = router;

const express = require('express');
const authController = require('../controllers/authController');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.post('/sendRequest/:userId', authController.protect, gameController.sendGameRequest);
router.get('/checkRequest/:userId', authController.protect, gameController.checkGameRequest);

router.patch('/roundScore/:gameId/:player', authController.protect, gameController.updateRoundScore);
router.patch('/totalScore/:gameId/:player', authController.protect, gameController.updateTotalScore);

router.get('/oppositePlayerScore/:gameId', authController.protect, gameController.checkOppositeScore);

router.post('/endGame/:gameId', authController.protect, gameController.endGame);

router.post('/cancelRequest', authController.protect, gameController.cancelRequest);

router.get('/availableUsers', authController.protect, gameController.availableUsers);

module.exports = router;

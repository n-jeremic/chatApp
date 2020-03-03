if (location.href.includes('playGame')) {
  getGame();
}

let watchRequestInterval;
let gameObj;
const currentUser = JSON.parse(document.getElementById('currentUserData').dataset.currentUser);
let player1;
let player2;
let oppositeScoreInterval;

async function getGame() {
  const gameId = location.href.split('/')[4];
  try {
    const response = await axios({
      method: 'GET',
      url: `/api/game/oppositePlayerScore/${gameId}`
    });

    if (response.data.status === 'success') {
      gameObj = response.data.data.game;
      $('#page-spinner').css('display', 'none');
      initGameHTML(gameObj);
      findMyPlayer(gameObj);
      findActivePlayer(gameObj);
      return;
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

async function sendGameRequest(userId, btn) {
  btn.disabled = true;
  btn.classList.remove('invite--btn');
  btn.innerHTML = 'Pending...';
  $('.invite--btn').css('display', 'none');
  try {
    const response = await axios({
      method: 'POST',
      url: `/api/game/sendRequest/${userId}`
    });

    if (response.data.status === 'success') {
      watchRequestInterval = setInterval(() => watchGameRequest(userId, btn), 2000);
      // Disable incoming game requests
      clearInterval(gameRequestInterval);
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
    btn.disabled = false;
    btn.classList.add('invite--btn');
    btn.innerHTML = 'Invite';
    $('.invite--btn').css('display', 'inline-block');
  }
}

async function watchGameRequest(userId, btn) {
  try {
    const response = await axios({
      method: 'GET',
      url: `/api/game/checkRequest/${userId}`
    });

    if (response.data.status === 'accepted') {
      clearInterval(watchRequestInterval);
      initGameHTML(response.data.data.game);
      gameObj = response.data.data.game;
      findMyPlayer(gameObj);
      findActivePlayer(gameObj);
    } else {
      return;
    }
  } catch (err) {
    console.log(err);
  }
}

function initGameHTML(gameObj) {
  const myPlayer = returnMyPlayer(gameObj);
  const oppositePlayer = myPlayer === 'homePlayer' ? 'awayPlayer' : 'homePlayer';

  // PLAYER 1 (CURRENT USER)
  $('#player1--img').attr('src', `/img/users/${gameObj[myPlayer].profilePhoto}`);
  $('#player1--name').text(`${gameObj[myPlayer].firstName} ${gameObj[myPlayer].lastName}`);
  $('#player1--totalScore').val('0');

  // PLAYER 2
  $('#player2--img').attr('src', `/img/users/${gameObj[oppositePlayer].profilePhoto}`);
  $('#player2--name').text(`${gameObj[oppositePlayer].firstName} ${gameObj[oppositePlayer].lastName}`);
  $('#player2--totalScore').val('0');

  $('#game-interface').show(1000);

  if (myPlayer === 'homePlayer') {
    $('#available_users-list').css('display', 'none');
    $('#game-container').prepend("<div class='col-lg-2'></div>");
  }
}

function findMyPlayer(gameObj) {
  if (gameObj.homePlayer._id === currentUser._id) {
    player1 = gameObj.homePlayer;
    player2 = gameObj.awayPlayer;
    return;
  } else if (gameObj.awayPlayer._id === currentUser._id) {
    player1 = gameObj.awayPlayer;
    player2 = gameObj.homePlayer;
    return;
  }
}

function findActivePlayer(gameObj) {
  if (gameObj.homePlayer._id === currentUser._id) {
    if (gameObj.homePlayer.active === true) {
      makeActivePlayerInterface('player1');
      clearInterval(oppositeScoreInterval);
    } else {
      makeActivePlayerInterface('player2');
      oppositeScoreInterval = setInterval(() => {
        checkOpositePlayer(gameObj);
      }, 1000);
    }
    return;
  } else if (gameObj.awayPlayer._id === currentUser._id) {
    if (gameObj.awayPlayer.active === true) {
      makeActivePlayerInterface('player1');
      clearInterval(oppositeScoreInterval);
    } else {
      makeActivePlayerInterface('player2');
      oppositeScoreInterval = setInterval(() => {
        checkOpositePlayer(gameObj);
      }, 1000);
    }
    return;
  }
}

function returnMyPlayer(gameObj) {
  let myPlayer;
  if (gameObj.homePlayer._id === currentUser._id) {
    myPlayer = 'homePlayer';
    return myPlayer;
  } else {
    myPlayer = 'awayPlayer';
    return myPlayer;
  }
}

function makeActivePlayerInterface(player) {
  if (player === 'player1') {
    $('#player1--interface').removeClass('inactivePlayer');
    $('#player2--interface').addClass('inactivePlayer');
    $('#player1--activeHand').show();
    $('#player2--activeHand').hide();
    $('#rollBtn').show(800);
    $('#setRoundBtn').show(800);
    $('#setRoundBtn').attr('disabled', true);
    $('#player2--text').css('visibility', 'hidden');
    $('#player2--roundScore').css('visibility', 'hidden');
  } else {
    $('#player2--interface').removeClass('inactivePlayer');
    $('#player1--interface').addClass('inactivePlayer');
    $('#player2--activeHand').show();
    $('#player1--activeHand').hide();
    $('#rollBtn').hide();
    $('#setRoundBtn').hide();
    $('#player2--text').html(`${player2.firstName} is on the move...`);
    $('#player2--text').css('visibility', 'visible');
    $('#player1--roundScore').css('visibility', 'hidden');
  }
}

async function rollMyDice() {
  const randomNumber = getRandomNumber();
  const myPlayerString = returnMyPlayer(gameObj);
  $('.fa-dice-six').addClass('fa-spin');
  $('#setRoundBtn').attr('disabled', true);
  $('#rollBtn').attr('disabled', true);

  // Update score in database
  await updateRoundScore(myPlayerString, gameObj, randomNumber);

  $('.fa-dice-six').removeClass('fa-spin');
  const dice = document.getElementById('player1--dice');
  toggleClasses(dice);
  dice.dataset.roll = randomNumber;
  setTimeout(() => {
    $('#rollBtn').attr('disabled', false);
    $('#setRoundBtn').attr('disabled', false);
    $('#player1--roundScore').css('visibility', 'visible');
    $('#player1--roundScore').text(player1.roundScore);
    if (randomNumber === 1) {
      $('#player1--dice .die-item').css('border', '3px solid red');
      $('#setRoundBtn').attr('disabled', true);
      $('#rollBtn').attr('disabled', true);
      setTimeout(() => {
        findActivePlayer(gameObj);
        $('#player1--dice .die-item').css('border', '');
        $('#rollBtn').attr('disabled', false);
        $('#setRoundBtn').attr('disabled', false);
      }, 1500);
    }
  }, 3200);

  // Update score in JS
  findMyPlayer(gameObj);
}

function toggleClasses(dice) {
  dice.classList.toggle('odd-roll');
  dice.classList.toggle('even-roll');
}

function getRandomNumber() {
  const randomNumber = Math.ceil(Math.random() * 6);
  return randomNumber;
}

async function updateRoundScore(playerString, gameObjJS, currentScore) {
  try {
    const response = await axios({
      method: 'PATCH',
      url: `/api/game/roundScore/${gameObjJS._id}/${playerString}`,
      data: {
        currentScore
      }
    });

    if (response.data.status === 'success') {
      gameObj = response.data.data.game;
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

async function checkOpositePlayer(gameObjJS) {
  let myPlayer = returnMyPlayer(gameObjJS);
  let oppositePlayer = myPlayer === 'homePlayer' ? 'awayPlayer' : 'homePlayer';
  clearInterval(oppositeScoreInterval);

  try {
    const response = await axios({
      method: 'GET',
      url: `/api/game/oppositePlayerScore/${gameObjJS._id}`
    });

    if (response.data.status === 'success') {
      if (response.data.data.game[oppositePlayer].totalScore !== gameObjJS[oppositePlayer].totalScore) {
        // Update score in JS
        gameObj = response.data.data.game;
        findMyPlayer(gameObj);

        setOppositeRound();
      } else if (response.data.data.game[oppositePlayer].roundScore !== gameObjJS[oppositePlayer].roundScore) {
        // Update score in JS
        gameObj = response.data.data.game;
        findMyPlayer(gameObj);

        let currentScore;
        if (response.data.data.game[oppositePlayer].currentScore === 0) {
          currentScore = 1;
        } else {
          currentScore = response.data.data.game[oppositePlayer].currentScore;
        }

        rollOppositeDice(currentScore);

        if (currentScore > 1) {
          oppositeScoreInterval = setInterval(() => {
            checkOpositePlayer(gameObj);
          }, 1000);
        }
      } else if (response.data.data.game[oppositePlayer].active === false) {
        // Update score in JS
        gameObj = response.data.data.game;
        findMyPlayer(gameObj);

        rollOppositeDice(1);
      } else {
        oppositeScoreInterval = setInterval(() => {
          checkOpositePlayer(gameObj);
        }, 1000);
      }

      return;
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

function rollOppositeDice(score) {
  const dice = document.getElementById('player2--dice');
  toggleClasses(dice);
  dice.dataset.roll = score;

  $('#player2--text').html(`${player2.firstName} is rolling the dice...`);

  setTimeout(() => {
    $('#player2--roundScore').text(player2.roundScore);
    $('#player2--roundScore').css('visibility', 'visible');
    $('#player2--text').html(`${player2.firstName} is on the move...`);
    if (score === 1) {
      $('#player2--dice .die-item').css('border', '3px solid red');
      $('#player2--text').css('visibility', 'hidden');
      setTimeout(() => {
        findActivePlayer(gameObj);
        $('#player2--dice .die-item').css('border', '');
      }, 1500);
    }
  }, 3200);
}

async function setMyRound() {
  const myPlayer = returnMyPlayer(gameObj);
  const roundScore = player1.roundScore;
  $('#setRoundBtn').attr('disabled', true);
  $('#rollBtn').attr('disabled', true);

  try {
    const response = await axios({
      method: 'PATCH',
      url: `/api/game/totalScore/${gameObj._id}/${myPlayer}`,
      data: {
        roundScore
      }
    });

    if (response.data.status === 'success') {
      gameObj = response.data.data.game;
      $('#setRoundBtn').attr('disabled', false);
      $('#rollBtn').attr('disabled', false);
      $('#player1--totalScore').val(gameObj[myPlayer].totalScore);
      findActivePlayer(gameObj);
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

function setOppositeRound() {
  $('#player2--totalScore').val(player2.totalScore);
  $('#player2--totalScore').css('font-weight', 700);
  $('#player2--totalScore').css('background-color', '#ffff80');
  $('#player2--text').html(`${player2.firstName} set the round!`);
  $('#player2--text').css('font-weight', 600);
  setTimeout(() => {
    findActivePlayer(gameObj);
    $('#player2--totalScore').css('font-weight', 500);
    $('#player2--text').css('font-weight', 400);
    $('#player2--totalScore').css('background-color', 'whitesmoke');
  }, 2500);
}

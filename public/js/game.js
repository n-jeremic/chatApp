let watchRequestInterval;
let gameObj;
const currentUser = JSON.parse(document.getElementById('currentUserData').dataset.currentUser);
let player1;
let player2;
let oppositeScoreInterval;

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
  // PLAYER 1 (CURRENT USER)
  $('#player1--img').attr('src', `/img/users/${gameObj.homePlayer.profilePhoto}`);
  $('#player1--name').text(`${gameObj.homePlayer.firstName} ${gameObj.homePlayer.lastName}`);
  $('#player1--totalScore').val('0');
  $('#player1--active').css('display', 'inline-block');

  // PLAYER 2
  $('#player2--img').attr('src', `/img/users/${gameObj.awayPlayer.profilePhoto}`);
  $('#player2--name').text(`${gameObj.awayPlayer.firstName} ${gameObj.awayPlayer.lastName}`);
  $('#player2--totalScore').val('0');

  $('#available_users-list').hide();
  $('#game-container').prepend("<div class='col-lg-2'></div>");
  $('#game-interface').show(1000);
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
      }, 200);
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
      }, 500);
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
    $('#player2--text').text(`${player2.firstName} is on the move...`);
    $('#player2--text').css('visibility', 'visible');
    $('#player1--roundScore').css('visibility', 'hidden');
  }
}

async function rollMyDice() {
  const randomNumber = getRandomNumber();
  const myPlayerString = returnMyPlayer(gameObj);

  const dice = document.getElementById('player1--dice');
  toggleClasses(dice);
  dice.dataset.roll = randomNumber;
  $('#setRoundBtn').attr('disabled', true);
  $('#rollBtn').attr('disabled', true);
  setTimeout(() => {
    $('#rollBtn').attr('disabled', false);
    $('#setRoundBtn').attr('disabled', false);
    $('#player1--roundScore').css('visibility', 'visible');
    $('#player1--roundScore').text(player1.roundScore);
    if (randomNumber === 1) {
      findActivePlayer(gameObj);
    }
  }, 3300);

  // Update score in database
  await updateRoundScore(myPlayerString, gameObj, randomNumber);

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
      if (response.data.data.game[oppositePlayer].roundScore !== gameObjJS[oppositePlayer].roundScore) {
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

        if (currentScore === 1) {
          findActivePlayer(gameObj);
        } else {
          oppositeScoreInterval = setInterval(() => {
            checkOpositePlayer(gameObj);
          }, 500);
        }
      } else {
        oppositeScoreInterval = setInterval(() => {
          checkOpositePlayer(gameObj);
        }, 500);
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

  $('#player2--text').text(`${player2.firstName} is rolling the dice...`);

  setTimeout(() => {
    $('#player2--roundScore').text(player2.roundScore);
    $('#player2--roundScore').css('visibility', 'visible');
    $('#player2--text').text(`${player2.firstName} is on the move...`);
  }, 3000);
}

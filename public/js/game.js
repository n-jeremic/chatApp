import { get } from 'mongoose';

$(document).ready(getAllGames);

if (location.href.includes('playGame')) {
  getGame();
}

window.addEventListener('beforeunload', function() {
  if (gameObj) {
    cancelGameRequest(gameObj);
  }
});

let watchRequestInterval;
let gameObj;
let player1;
let player2;
let oppositeScoreInterval;
let oppositePlayerCheck = 0;
let sentRequestCounter = 0;

async function getAllGames() {
  try {
    const response = await axios({
      method: 'GET',
      url: '/api/game'
    });

    if (response.data.status === 'success') {
      const results = organizeTableData(response.data.data.games);
      createTable(results);
    }
  } catch (err) {
    console.log(err);
  }
}

function organizeTableData(gamesArr) {
  const resultsArr = [];

  for (let i = 0; i < gamesArr.length; i++) {
    deletePlayerProperties(gamesArr, i);
    const awayPlayerIndex = resultsArr.findIndex(el => el._id === gamesArr[i].awayPlayer._id);
    const homePlayerIndex = resultsArr.findIndex(el => el._id === gamesArr[i].homePlayer._id);

    if (gamesArr[i].winner._id === gamesArr[i].homePlayer._id) {
      if (homePlayerIndex === -1) {
        gamesArr[i].homePlayer.won = 1;
        gamesArr[i].homePlayer.lost = 0;
        resultsArr.push(gamesArr[i].homePlayer);
      } else {
        resultsArr[homePlayerIndex].won += 1;
      }

      if (awayPlayerIndex === -1) {
        gamesArr[i].awayPlayer.lost = 1;
        gamesArr[i].awayPlayer.won = 0;
        resultsArr.push(gamesArr[i].awayPlayer);
      } else {
        resultsArr[awayPlayerIndex].lost += 1;
      }
    } else {
      if (awayPlayerIndex === -1) {
        gamesArr[i].awayPlayer.won = 1;
        gamesArr[i].awayPlayer.lost = 0;
        resultsArr.push(gamesArr[i].awayPlayer);
      } else {
        resultsArr[awayPlayerIndex].won += 1;
      }

      if (homePlayerIndex === -1) {
        gamesArr[i].homePlayer.lost = 1;
        gamesArr[i].homePlayer.won = 0;
        resultsArr.push(gamesArr[i].homePlayer);
      } else {
        resultsArr[homePlayerIndex].lost += 1;
      }
    }
  }

  for (let i = 0; i < resultsArr.length; i++) {
    resultsArr[i].difference = resultsArr[i].won - resultsArr[i].lost;
  }

  resultsArr.sort((a, b) => b.difference - a.difference);

  return resultsArr;
}

function createTable(array) {
  $('#table-container').hide();
  $('#table-container').empty();
  let rows = '';
  array.forEach((el, i) => {
    rows += `<tr><th class="text-center">${i + 1}</th><td class="text-center"><a href="/profile/${el._id}" class="comment-userName">${el.firstName} ${
      el.lastName
    }</a></td><td class="text-center">${el.won}</td><td class="text-center">${el.lost}</td></tr>`;
  });
  const table = `<table class='table table-bordered'><thead><tr class='bg-danger' style="color: white"><th class="text-center">#</th><th class="text-center">PLAYER NAME</th><th class="text-center">WINS</th><th class="text-center">DEFEATS</th></tr><thead><tbody>${rows}</tbody><tfoot><tr class="table-warning"><td colspan="4" class='text-center'>PIG GAME STANDINGS</td></tr></tfoot></table>`;

  $('#table-container').append(table);
  $('#table-container').show(1000);
}

function deletePlayerProperties(gamesArr, i) {
  delete gamesArr[i].homePlayer.currentScore;
  delete gamesArr[i].homePlayer.roundScore;
  delete gamesArr[i].homePlayer.totalScore;
  delete gamesArr[i].homePlayer.active;

  delete gamesArr[i].awayPlayer.currentScore;
  delete gamesArr[i].awayPlayer.roundScore;
  delete gamesArr[i].awayPlayer.totalScore;
  delete gamesArr[i].awayPlayer.active;
}

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
  btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
  btn.disabled = true;
  btn.classList.remove('invite--btn');
  $('.invite--btn').css('display', 'none');

  try {
    const response = await axios({
      method: 'POST',
      url: `/api/game/sendRequest/${userId}`
    });

    if (response.data.status === 'success') {
      // Disable incoming game requests
      clearInterval(gameRequestInterval);

      btn.innerHTML = 'Pending...';
      gameObj = response.data.data.game;
      watchRequestInterval = setInterval(() => watchGameRequest(userId, response.data.data.game, btn), 1000);

      Swal.fire('Request sent!', 'If there is no response after 20 seconds, your request will be canceled.', 'success');
      $('#placeholder').css('display', 'none');
      $('#alert-window').css('display', 'block');
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', err.response.data.message, 'error');
    btn.disabled = false;
    btn.classList.add('invite--btn');
    btn.innerHTML = 'Invite';
    $('.invite--btn').css('display', 'inline-block');
  }
}

async function watchGameRequest(userId, game, btn) {
  if (sentRequestCounter < 25) {
    try {
      const response = await axios({
        method: 'GET',
        url: `/api/game/checkRequest/${userId}`
      });

      if (response.data.status === 'accepted') {
        sentRequestCounter = 0;
        clearInterval(watchRequestInterval);
        initGameHTML(response.data.data.game);
        gameObj = response.data.data.game;
        findMyPlayer(gameObj);
        findActivePlayer(gameObj);
      } else {
        sentRequestCounter++;
        return;
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    clearInterval(watchRequestInterval);
    sentRequestCounter = 0;
    gameObj = undefined;
    await cancelGameRequest(game);
    btn.disabled = false;
    btn.classList.add('invite--btn');
    btn.innerHTML = 'Invite';
    $('.invite--btn').css('display', 'inline-block');
    gameRequestInterval = setInterval(checkMyGameRequest, 3000);
  }
}

async function cancelGameRequest(game) {
  try {
    const response = await axios({
      method: 'POST',
      url: '/api/game/cancelRequest',
      data: {
        game
      }
    });

    if (response.data.status === 'success') {
      Swal.fire('Warning', `${game.awayPlayer.firstName} ${game.awayPlayer.lastName} did not respond! Your request has been canceled.`, 'error');
      $('#alert-window').css('display', 'none');
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

function initGameHTML(gameObj) {
  const myPlayer = returnMyPlayer(gameObj);
  const oppositePlayer = myPlayer === 'homePlayer' ? 'awayPlayer' : 'homePlayer';

  // PLAYER 1 (CURRENT USER)
  $('#player1--img').attr('src', `/img/users/${gameObj[myPlayer].profilePhoto}`);
  $('#player1--name').text(`${gameObj[myPlayer].firstName} ${gameObj[myPlayer].lastName}`);
  $('#player1--totalScore').val(`${gameObj[myPlayer].totalScore}`);
  $('#player1--totalScore').css('background-color', 'whitesmoke');
  $('#player1--dice').attr('data-roll', '1');
  $('#player1--roundScore').css('visibility', 'hidden');

  // PLAYER 2
  $('#player2--img').attr('src', `/img/users/${gameObj[oppositePlayer].profilePhoto}`);
  $('#player2--name').text(`${gameObj[oppositePlayer].firstName} ${gameObj[oppositePlayer].lastName}`);
  $('#player2--totalScore').val(`${gameObj[oppositePlayer].totalScore}`);
  $('#player2--totalScore').css('background-color', 'whitesmoke');
  $('#player2--dice').attr('data-roll', '1');
  $('#player2--roundScore').css('visibility', 'hidden');
  $('#player2--text').css('visibility', 'hidden');

  $('#playingGame').css('opacity', 1.0);
  $('.winner-interface').css('display', 'none');
  $('#alert-window').css('display', 'none');
  $('#placeholder').css('display', 'none');
  $('#available_users-list').css('display', 'none');
  $('#indentation').css('display', 'block');
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
      if (response.data.data.game.winner || response.data.data.game[oppositePlayer].totalScore >= 10) {
        // Update score in JS
        gameObj = response.data.data.game;
        oppositePlayerCheck = 0;

        await endGame();
      } else if (response.data.data.game[oppositePlayer].totalScore !== gameObjJS[oppositePlayer].totalScore) {
        // Update score in JS
        gameObj = response.data.data.game;
        findMyPlayer(gameObj);
        oppositePlayerCheck = 0;

        setOppositeRound();
      } else if (response.data.data.game[oppositePlayer].roundScore !== gameObjJS[oppositePlayer].roundScore) {
        // Update score in JS
        gameObj = response.data.data.game;
        findMyPlayer(gameObj);
        oppositePlayerCheck = 0;

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
        oppositePlayerCheck = 0;

        rollOppositeDice(1);
      } else {
        oppositePlayerCheck++;
        oppositeScoreInterval = setInterval(() => {
          checkOpositePlayer(gameObj);
        }, 1000);
      }

      if (oppositePlayerCheck > 30) {
        await setWinner();
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
  const totalScore = roundScore + player1.totalScore;

  if (totalScore >= 10) {
    $('#player1--totalScore').val(totalScore);
    $('#player1--totalScore').css('background-color', '#4dff4d');
    $('#player1--totalScore').css('font-weight', 700);
  }

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
      if (gameObj.winner) {
        await endGame();
      } else {
        $('#player1--totalScore').val(gameObj[myPlayer].totalScore);
        $('#setRoundBtn').attr('disabled', false);
        $('#rollBtn').attr('disabled', false);
        findActivePlayer(gameObj);
      }
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

async function endGame() {
  try {
    const response = await axios({
      method: 'POST',
      url: `/api/game/endGame/${gameObj._id}`
    });

    if (response.data.status === 'success') {
      gameObj = response.data.data.game;
      displayWinnerInterface();
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

async function getAvailableUsers() {
  try {
    const response = await axios({
      method: 'GET',
      url: '/api/game/availableUsers'
    });

    if (response.data.status === 'success') {
      $('#availableUsers').empty();
      response.data.data.users.forEach(user => appendUserList(user));
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

function appendUserList(user) {
  const markUp = `<li href='#' style='padding: 5px !important' class='list-group-item list-group-item-action'><a href='/profile/${user._id}'><img class='mr-2' src='/img/users/${user.profilePhoto}' width='50px' style='border-radius: 50%;'></a><span class='align-middle' style="font-size: 18px">${user.firstName} ${user.lastName}</span><button class=' btn btn-sm btn-danger float-right invite--btn' style='margin-top: 10px;' onclick='sendGameRequest("${user._id}", this)'>Invite</button></li>`;

  $('#availableUsers').append(markUp);
}

async function closeGameInterface() {
  $('#game-interface').css('display', 'none');
  $('#placeholder').css('display', 'block');
  $('#availableUsers').empty();
  $('#availableUsers').append(
    '<div class="text-center" style="margin-top: 50px; margin-bottom: 50px;"><div class="spinner-border text-info" role="status" style="width: 4rem; height: 4rem;"></div></div>'
  );
  $('#indentation').css('display', 'none');
  $('#available_users-list').show(1000);

  await getAvailableUsers();
  await getAllGames();
}

async function setWinner() {
  try {
    const response = await axios({
      method: 'POST',
      url: `/api/game/winner/${gameObj._id}`,
      data: {
        winner: player1
      }
    });

    if (response.data.status === 'success') {
      gameObj = response.data.data.game;
      displayWinnerInterface(true);
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

function displayWinnerInterface(disconnected = false) {
  if (disconnected === true) {
    Swal.fire('Warning', `${player2.firstName} ${player2.lastName} has been disconnected!`, 'error');
  }

  $('#winner-img').attr('src', `/img/users/${gameObj.winner.profilePhoto}`);
  $('#winner-text').text(`${gameObj.winner.firstName} ${gameObj.winner.lastName} WON!`);
  $('#player1--interface').removeClass('inactivePlayer');
  $('#player2--interface').removeClass('inactivePlayer');
  $('#player1--activeHand').hide();
  $('#player2--activeHand').hide();
  $('#playingGame').css('opacity', 0.2);
  $('.winner-interface').css('display', 'block');

  gameRequestInterval = setInterval(checkMyGameRequest, 3000);
}

let watchRequestInterval;

function rollDice() {
  const dice = document.getElementById('player1--dice');
  toggleClasses(dice);
  dice.dataset.roll = getRandomNumber(1, 6);
}

function toggleClasses(die) {
  die.classList.toggle('odd-roll');
  die.classList.toggle('even-roll');
}

function getRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.getElementById('roll-button').addEventListener('click', rollDice);

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

$(document).ready(getAllNotifications);
window.setInterval(getNewNotifications, 5000);

let receivedRequestCounter = 0;
let receivedRequestInterval;
let myGameRequest;
let gameRequestInterval;
if (location.href.includes('playGame') === false) {
  gameRequestInterval = setInterval(checkMyGameRequest, 3000);
}

document.getElementById('search--field').addEventListener('blur', function(event) {
  if (event.relatedTarget !== null) {
    if (event.relatedTarget.classList.contains('page-link')) {
      $('#search--field').focus();
      return;
    }
  } else {
    $('#search--field').val('');
    hideSearchDrop();
  }
});

async function logout() {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/users/logOut'
    });

    if (res.data.status === 'success') {
      location.assign('/login');
    }
  } catch (err) {
    console.log(err);
  }
}

async function getAllNotifications() {
  try {
    const printedNotIds = await getNewNotifications();

    const res = await axios({
      method: 'GET',
      url: '/api/users/myNotifications'
    });

    if (res.data.status === 'success') {
      if (printedNotIds) {
        for (let i = 0; i < res.data.data.notifications.length; i++) {
          if (printedNotIds.includes(res.data.data.notifications[i]._id)) {
            res.data.data.notifications.splice(i, 1);
          }
        }
      }

      if (res.data.data.notifications.length > 0) {
        res.data.data.notifications.forEach(notification => {
          if (notification.seen === false) {
            createNotificationHTML(notification, true, true);
          } else {
            createNotificationHTML(notification, false, true);
          }
        });
      } else {
        if (printedNotIds === undefined) {
          $('#notifications-list').append(
            "<div class='row'><div class='col-lg-12'><p class='text-center'>You don't have any notifications yet.</p></div></div>"
          );
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
}

function createNotificationHTML(data, isNew, onload = false) {
  if (isNew === true && onload === false) {
    $('#btn-notifications').css('color', 'white');
    let num_of_not = parseInt($('#num_of_notif').text());
    $('#num_of_notif').text(`${num_of_not + 1}`);
    $('#num_of_notif').css('display', 'inline-block');
  }

  const markUp = `<button href="#" class="list-group-item list-group-item-action notif-hover" style="padding: 8px !important; ${
    isNew === true ? 'background-color: #e6e6e6;' : ''
  } color: black;"><img width="40px" style="border-radius: 50%" src="/img/users/${
    data.from.userPhoto
  }" class="mr-2"><a style="color: #1a75ff" href="/profile/${data.from.userId}">${data.from.firstName} ${data.from.lastName}</a>${
    data.type === 'like' ? ' liked your ' : ' commented on your '
  }<a href="#" style="color: #1a75ff" onclick="getPostDetails('${data.post}'); markNotifAsSeen('${data._id}', this);">photo.</a>${
    isNew === true ? `<i class='fas fa-circle float-right mt-3 mr-2' id='circle-${data._id}' style="font-size: 10px; color: #4d4dff"></i>` : ''
  }</button>`;

  if (isNew === true && onload === false) {
    $('#notifications-list').prepend(markUp);
  } else {
    $('#notifications-list').append(markUp);
  }
}

async function getNewNotifications() {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/users/newNotifications'
    });

    if (res.data.status === 'success') {
      res.data.data.notifications.forEach(el => createNotificationHTML(el, true));
      const newNotIds = res.data.data.notifications.map(el => el._id);
      return newNotIds;
    }
  } catch (err) {
    console.log(err);
  }
}

function regularStyleBtn() {
  $('#btn-notifications').css('color', 'rgba(255,255,255,.5)');
  $('#num_of_notif').text('0');
  $('#num_of_notif').css('display', 'none');
}

function regularStyleNotif(clicked_el, notification_id) {
  clicked_el.parentElement.style.backgroundColor = '#fff';
  const circle = $(`#circle-${notification_id}`);
  if (circle) {
    circle.remove();
  }
  regularStyleBtn();
}

async function markNotifAsSeen(notif_id, clicked_el) {
  try {
    const response = await axios({
      method: 'PATCH',
      url: `/api/users/seenNotification/${notif_id}`
    });

    if (response.data.status === 'success') {
      regularStyleNotif(clicked_el, notif_id);
    }
  } catch (err) {
    console.log(err);
  }
}

async function searchUsers(query) {
  if (query.length === 0 || query[0] === ' ') {
    $('#dropdown-search').dropdown('hide');
    return;
  }

  $('.search-spinner').html('<i class="fas fa-spinner fa-spin"></i>');
  $('.notifications-drop').dropdown('hide');

  try {
    const response = await axios({
      method: 'GET',
      url: `/api/users/searchUsers?query=${query}`
    });

    if (response.data.status === 'success') {
      $('#total-results').text(`Total of ${response.data.data.results.length} results`);
      $('.search-spinner').html('<i class="fas fa-search"></i>');
      if (response.data.data.results.length < 9) {
        $('#search-results').empty();
        response.data.data.results.forEach(user => searchResultsHTML(user));
        $('#dropdown-search').dropdown('show');
        $('#pagination_content').hide();
        $('#dropdown-search').css('height', '');
        $('#num_current-results').text('');
      } else {
        paginate(response.data.data.results, 1);
        $('#dropdown-search').dropdown('show');
      }
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Oops!', 'Server error! Please try again.', 'error');
  }
}

function searchResultsHTML(user) {
  const markUp = `<a class="list-group-item list-group-item-action" href="#" onclick="goToProfile('${user._id}')" style="padding: 6px !important; border-radius: 0px !important;"><img class="rounded mr-2" width="40px" src="/img/users/${user.profilePhoto}"/>${user.firstName} ${user.lastName}</a>`;

  $('#search-results').append(markUp);
}

function paginate(results, page) {
  $('#dropdown-search').css('height', '536px');
  const num_of_pages = Math.ceil(results.length / 8);
  const start_position = (parseInt(page) - 1) * 8;
  const end_position = start_position + 8;

  $('#search-results').empty();
  let counter = 0;

  for (let i = start_position; i < end_position; i++) {
    if (!results[i]) {
      break;
    }
    counter++;
    searchResultsHTML(results[i]);
  }

  $('#num_current-results').text(`Showing ${start_position + 1} - ${start_position + counter} results`);

  $('.pagination').empty();
  $('.pagination').append(
    `<li class="page-item ${
      page === 1 ? 'disabled' : ''
    }"><a class="page-link" href="#" tabindex="-1"aria-disabled="true" onclick='paginate(${JSON.stringify(results)}, ${page - 1})'>Previous</a></li>`
  );

  for (let i = 1; i <= num_of_pages; i++) {
    $('.pagination').append(
      `<li class="page-item ${i == page ? 'active' : ''}"><a class="page-link" href="#" onclick='paginate(${JSON.stringify(
        results
      )}, ${i})'>${i}</a></li>`
    );
  }

  $('.pagination').append(
    `<li class="page-item ${
      page === num_of_pages ? 'disabled' : ''
    }"><a class="page-link" href="#" tabindex="-1"aria-disabled="true" onclick='paginate(${JSON.stringify(results)}, ${page + 1})'>Next</a></li>`
  );

  $('#pagination_content').show();
}

function hideSearchDrop() {
  $('#dropdown-search').dropdown('hide');
}

function goToProfile(user_id) {
  location.href = `/profile/${user_id}`;
}

async function checkMyGameRequest() {
  try {
    const response = await axios({
      method: 'GET',
      url: '/api/users/myGameRequest'
    });

    if (response.data.status === 'empty') {
      return;
    } else if (response.data.status === 'success') {
      if (response.data.data.request.accepted === false) {
        myGameRequest = response.data.data.request;
        createGameNotif(response.data.data.request);
        receivedRequestInterval = setInterval(() => {
          receivedRequestCounter++;
          if (receivedRequestCounter > 25) {
            $('#btn-gameRequest').remove();
            regularStyleBtn();
            clearInterval(receivedRequestInterval);
            Swal.fire(
              'Warning',
              `Game request from ${myGameRequest.firstName} ${myGameRequest.lastName} has been canceled since you didn't respond!`,
              'error'
            );
            gameRequestInterval = setInterval(checkMyGameRequest, 3000);
            receivedRequestCounter = 0;
            myGameRequest = undefined;
          }
        }, 1000);
      }

      clearInterval(gameRequestInterval);
    }

    return;
  } catch (err) {
    console.log(err);
  }
}

function createGameNotif(request) {
  $('#btn-notifications').css('color', 'white');
  let num_of_not = parseInt($('#num_of_notif').text());
  $('#num_of_notif').text(`${num_of_not + 1}`);
  $('#num_of_notif').css('display', 'inline-block');
  $('.notifications-drop').css('width', '510px');

  const markUp = `<button href="#" id="btn-gameRequest" class="list-group-item list-group-item-action notif-hover" style="padding: 8px !important; background-color: #e6e6e6; color: black;"><img width="40px" style="border-radius: 50%" src="/img/users/${request.profilePhoto}" class="mr-2"><a style="color: #1a75ff" href="/profile/${request.userId}">${request.firstName} ${request.lastName}</a> sent you a Pig Game request.<a href="/playGame/${request.gameId}" style="color: #1a75ff"> Play now!</a><i class='fas fa-circle float-right mt-3 mr-2' style="font-size: 10px; color: #4d4dff"></i></button>`;

  $('#notifications-list').prepend(markUp);
}

$(document).ready(getAllNotifications);
window.setInterval(getNewNotifications, 5000);

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
        $('#notifications-list').append(
          "<div class='row'><div class='col-lg-12'><p class='text-center'>You don't have any notifications yet.</p></div></div>"
        );
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

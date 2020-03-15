$(document).ready(displayInbox);
$(document).ready(() => localStorage.removeItem('newMessages'));

function displayInbox() {
  const chats = JSON.parse(document.getElementById('chats').dataset.chats);
  $('#inbox').empty();

  chats.forEach(el => {
    let senderData;
    let newMsgs = 0;
    let lastMsg = el.messages[el.messages.length - 1].text;
    if (lastMsg.length > 50) {
      lastMsg = lastMsg.slice(0, 48);
      lastMsg += '....';
    }
    el.users.forEach(user => {
      if (user._id !== currentUser._id) {
        senderData = user;
      }
    });

    el.messages.forEach(msg => {
      if (msg.to._id === currentUser._id && msg.seen === false) {
        newMsgs++;
      }
    });

    createInboxItem(senderData, newMsgs, lastMsg);
  });
}

function createInboxItem(userData, newMsgs, lastMsg) {
  const markUp = `<button
    type="button"
    class="list-group-item list-group-item-action ${newMsgs > 0 ? 'list-group-item-secondary' : ''}"
    style="border-radius: 0px !important; padding: 10px !important;"
    onclick="getChat(this, '${userData._id}')">
    <div class="media">
      <img src="/img/users/${userData.profilePhoto}" width="65px" class="align-self-start mr-3" alt="..." style="border-radius: 50%;" />
      <div class="media-body">
        <h5 class="mt-0"><a class="comment-userName" href="/profile/${userData._id}">${userData.firstName} ${userData.lastName}</a><span id="badge-${
    userData._id
  }" class="float-right badge badge-primary text-wrap" style="display: ${newMsgs > 0 ? 'inline-block' : 'none'}">${
    newMsgs > 1 ? newMsgs + ' unread messages' : newMsgs + ' unread message'
  }</span></h5>
        <p style="margin-bottom: 0px !important;">
          ${lastMsg}
        </p>
      </div>
    </div>
    </button>`;

  $('#inbox').append(markUp);
}

function createChatMsgHTML(text, from, textTime, userData) {
  const timeArr = textTime.split('T');
  const time = timeArr[1].split(':');
  const createdAt = `${timeArr[0]} at ${time[0]}:${time[1]}`;

  let markUp;
  if (from === 'me') {
    markUp = `<div class="row mt-2" style="padding: 4px;">
      <div class="col-lg-12">
        <img src="/img/users/${userData.profilePhoto}" class="align-top mr-1" alt="" width="50px" style="border-radius: 50%;" />
        <div class="message-inbox mt-1" style="background-color: white" data-toggle="tooltip" data-placement="top" title="${createdAt}">
          ${text}
        </div>
      </div>
    </div>`;
  } else {
    markUp = `<div class="row mt-2" style="padding: 4px;">
      <div class="col-lg-12">
        <img src="/img/users/${userData.profilePhoto}" class="align-top ml-1 float-right" alt="" width="50px" style="border-radius: 50%;" />
        <div class="message-inbox mt-1 float-right" style="background-color: #007bff; color: #fff" data-toggle="tooltip" data-placement="top" title="${createdAt}">
          ${text}
        </div>
      </div>
    </div>`;
  }

  $('#chat-container').append(markUp);
  $('[data-toggle="tooltip"]').tooltip();
}

async function getChat(clickedBtn, userId) {
  $('#chat-interface').css('display', 'none');
  $('.chat-spinner').css('display', 'inline-block');

  try {
    const response = await axios({
      method: 'GET',
      url: `/api/users/myChatWith/${userId}`
    });

    if (response.data.status === 'success') {
      clickedBtn.classList.remove('list-group-item-secondary');
      const number = parseInt(
        $(`#badge-${userId}`)
          .text()
          .split(' ')[0]
      );
      if (number > 0) {
        const number_newMsgs = parseInt(document.getElementById('num_of_msgs').textContent);
        const new_num = number_newMsgs - number;
        $('#num_of_msgs').text(`${new_num}`);
        if (new_num === 0) {
          $('#msgs--navbar').css('color', 'rgba(255,255,255,.5)');
          $('#num_of_msgs').css('display', 'none');
        }
        $(`#badge-${userId}`).remove();
        markMsgsAsSeen(userId);
      }
      $('.chat-spinner').css('display', 'none');
      displayChat(response.data.data.chat);
    }
  } catch (err) {
    console.log(err);
  }
}

function displayChat(chatData) {
  let otherUser;
  chatData.users.forEach(user => {
    if (user._id !== currentUser._id) {
      otherUser = user;
    }
  });

  $('#otherUser--img').attr('src', `/img/users/${otherUser.profilePhoto}`);
  $('#otherUser--name').html(`<a class="comment-userName" href="/profile/${otherUser._id}">${otherUser.firstName} ${otherUser.lastName}</a>`);
  $('#conversationStart').text(`Conversation started on ${chatData.createdAt.split('T')[0].replace(/-/g, ' / ')}`);
  $('#btn--sendMsg').attr('onclick', `sendMessage('${otherUser._id}', this)`);
  $('#btn--deleteChat').attr('onclick', `deleteChat('${chatData._id}', this)`);
  $('#sendMsg-input').val('');

  $('#chat-container').empty();
  chatData.messages.forEach(msg => {
    if (msg.from._id === currentUser._id) {
      createChatMsgHTML(msg.text, 'me', msg.createdAt, msg.from);
    } else {
      createChatMsgHTML(msg.text, 'notMe', msg.createdAt, msg.from);
    }
  });

  $('#chat-interface').show(400);
  scrollDownChat();
}

function scrollDownChat() {
  const objDiv = document.getElementById('chat-container');
  objDiv.scrollTop = objDiv.scrollHeight;
}

async function markMsgsAsSeen(sender_id) {
  try {
    await axios({
      method: 'PATCH',
      url: `/api/messages/msgsSeen/${sender_id}`
    });
  } catch (err) {
    console.log(err);
  }
}

async function sendMessage(receiver_id, el) {
  const text = document.getElementById('sendMsg-input').value;
  if (text.length > 0) {
    el.innerHTML = 'Sending...';
    el.disabled = true;

    try {
      const response = await axios({
        method: 'POST',
        url: `/api/messages/${receiver_id}`,
        data: {
          text
        }
      });

      if (response.data.status === 'success') {
        $('#sendMsg-input').val('');
        createChatMsgHTML(response.data.data.message.text, 'me', response.data.data.message.createdAt, currentUser);
        scrollDownChat();
      }
      el.innerHTML = 'Send';
      el.disabled = false;
    } catch (err) {
      console.log(err);
      Swal.fire('Ooops!', 'Server error! Please try again', 'error');
      el.innerHTML = 'Send';
      el.disabled = false;
      $('#sendMsg-input').val('');
    }
  } else {
    Swal.fire('Warning', "You can't send empty messages!", 'error');
  }
}

function deleteChat(chatId, clickedBtn) {
  Swal.fire({
    title: 'Do you want to delete this chat?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then(async result => {
    if (result.value) {
      clickedBtn.disabled = true;
      clickedBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';

      try {
        const response = await axios({
          method: 'DELETE',
          url: `/api/messages/${chatId}`
        });

        if (response.status === 204) {
          location.reload(true);
        }
      } catch (err) {
        console.log(err);
        Swal.fire('Warning', 'Server error! Please try again.', 'error');
      }
    }
  });
}

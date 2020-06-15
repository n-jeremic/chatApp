window.setInterval(getNewMessages, 1000);
window.setInterval(getOnlineUsers, 10000);
$(document).ready(() => {
  const newMsgsLS = localStorage.getItem('newMessages');
  if (!newMsgsLS) {
    return;
  } else {
    const newMsgsArr = JSON.parse(newMsgsLS);
    let sender_id;
    for (let i = 0; i < newMsgsArr.length; i++) {
      if (sender_id == newMsgsArr[i].from.id) {
        continue;
      }
      sender_id = newMsgsArr[i].from.id;
      const user_name = newMsgsArr[i].from.firstName + ' ' + newMsgsArr[i].from.lastName;
      getChat(newMsgsArr[i].from.id, user_name, newMsgsArr[i].from.profilePhoto, 'true');
    }

    localStorage.removeItem('newMessages');
  }
});

async function getOnlineUsers() {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/users/onlineUsers',
    });

    if (res.data.status === 'success') {
      displayUsers(res.data.data.sortedUsers);
    }
  } catch (err) {
    console.log(err);
  }
}

function displayUsers(users) {
  $('#card-users').empty();

  users.forEach((user) => {
    $('#card-users').append(
      `<button data-user_id='${user.id}' data-user_photo='${user.profilePhoto}' data-user_name='${user.firstName} ${
        user.lastName
      }' class='list-group-item list-group-item-action'><img class='img-fluid rounded mr-2' src='/img/users/${
        user.profilePhoto
      }' width='50px;'><span>${user.firstName} ${
        user.lastName
      }</span><span class='spinner-border spinner-border-sm ml-2' style="color: lightblue; display: none" role="status" aria-hidden="true" id='spinner-${
        user.id
      }'></span><i class='fas fa-user-${user.isLoggedIn === true ? 'check' : 'minus'} float-right mt-3' style='color: ${
        user.isLoggedIn === true ? '#00e600' : '#495057'
      }'></i></button>`
    );
  });

  return;
}

async function getChat(user_id, user_name, user_photo, newMessage = 'false') {
  if (document.getElementById(`btnChat-${user_id}`)) {
    return;
  }

  try {
    const response = await axios({
      method: 'GET',
      url: `/api/users/myChatWith/${user_id}`,
    });

    if (response.data.data.chat === null) {
      openChatButton(user_id, user_name, user_photo, null);
    } else {
      const messages = response.data.data.chat.messages;
      const arrLength = messages.length;
      let num_of_newMsgs = 0;
      for (let i = 0; i < arrLength; i++) {
        if (messages[i].to._id === currentUser._id && messages[i].seen === false) {
          num_of_newMsgs++;
        }
      }

      if (num_of_newMsgs > 0 && newMessage == 'false') {
        markMsgsAsSeen(user_id);
      }

      openChatButton(user_id, user_name, user_photo, messages, newMessage, num_of_newMsgs);
    }
  } catch (err) {
    console.log(err);
  }
}

document.getElementById('card-users').addEventListener('click', async (event) => {
  if (event.target.tagName !== 'DIV') {
    let check = 0;
    if (event.target.parentElement.tagName === 'DIV') {
      var { user_id, user_name, user_photo } = event.target.dataset;
      check++;
    } else {
      var { user_id, user_name, user_photo } = event.target.parentElement.dataset;
    }

    if (document.getElementById(`collapse-${user_id}`)) {
      $(`#collapse-${user_id}`).collapse('show');
      return;
    }

    if (check > 0) {
      event.target.disabled = true;
    } else {
      event.target.parentElement.disabled = true;
    }

    document.getElementById(`spinner-${user_id}`).style.display = 'inline-block';

    await getChat(user_id, user_name, user_photo);

    document.getElementById(`spinner-${user_id}`).style.display = 'none';
    event.target.disabled = false;
    event.target.parentElement.disabled = false;
  }
});

const openChatButton = (user_id, user_name, user_photo, messages, newMessage = 'false', num_of_newMsgs = 0) => {
  let markUpChat = '';

  if (messages != null) {
    messages.forEach((msg) => {
      if (msg.to.id != user_id) {
        markUpChat += createChatMessage(user_id, msg.text, user_photo, 'notMe', msg.createdAt);
      } else {
        markUpChat += createChatMessage(null, msg.text, null, 'me', msg.createdAt);
      }
    });
  }

  const markUpButton = `<div class="col-lg-4" id="entireChat-${user_id}"><p><button
    class="btn btn-${newMessage == 'false' ? 'outline-primary btn--chat' : 'primary alertMsg btn--newMsg'} btn-block btn-lg"
    type="button"
    id="btnChat-${user_id}"
    onclick="goWhite('${user_id}');"
    onmouseover="displayCloseBtn('${user_id}');"
    onmouseleave="hideCloseBtn('${user_id}');"
    data-toggle="collapse"
    data-target="#collapse-${user_id}"
    aria-expanded="${newMessage == 'false' ? 'true' : 'false'}"
    aria-controls="collapse-${user_id}">${user_name} <a class="float-right" onclick="closeChat('${user_id}')"><i class="fas fa-times" style="color: #ff704d; visibility: hidden" id="closeChat-${user_id}"></i></a><span class="num_of_newMsgs--chat" id="num_of_newMsgs--${user_id}" style="display: ${
    newMessage == 'true' ? 'inline-block' : 'none'
  }">${num_of_newMsgs}</span></button></p>
    <div class="collapse ${newMessage == 'false' ? 'show' : ''} shadow" id="collapse-${user_id}">
    <div class="card card-body chat-body">
    <div class="chat" id="scroll-${user_id}"><div class="container-fluid" id="chat-${user_id}">${markUpChat}</div></div>
    <div class="form-group type-message-form">
    <input id="msgTo-${user_id}"
      class="form-control"
      type="text"
    ></input>
    <button class="btn btn-secondary btn-sm btn-block mt-1" onclick="sendMessage('${user_id}', this)" id="sendBtn-${user_id}">
      Send message
    </button>
    </div>
    </div></div></div>`;

  $('#chats-interface').append(markUpButton);
  $('[data-toggle="tooltip"]').tooltip();
  scrollDownChat(user_id);

  const sendMsgBtn = document.getElementById(`sendBtn-${user_id}`);
  document.getElementById(`msgTo-${user_id}`).addEventListener('keyup', (event) => {
    goWhite(user_id);
    if (event.keyCode === 13) {
      sendMessage(user_id, sendMsgBtn);
    }
  });
};

const sendMessage = async (receiver_id, el) => {
  const text = document.getElementById(`msgTo-${receiver_id}`).value;
  if (text.length > 0) {
    el.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
    el.disabled = true;

    try {
      const response = await axios({
        method: 'POST',
        url: `/api/messages/${receiver_id}`,
        data: {
          text,
        },
      });

      if (response.data.status === 'success') {
        document.getElementById(`msgTo-${receiver_id}`).value = '';
        let message = createChatMessage(null, response.data.data.message.text, null, 'me', response.data.data.message.createdAt);
        $(`#chat-${receiver_id}`).append(message);
        $('[data-toggle="tooltip"]').tooltip();
        scrollDownChat(receiver_id);
      }
      el.innerHTML = 'Send message';
      el.disabled = false;
    } catch (err) {
      console.log(err);
    }
  } else {
    Swal.fire('Warning', "You can't send empty messages!", 'error');
  }
};

const createChatMessage = (user_id, message, user_photo, from, textTime) => {
  const timeArr = textTime.split('T');
  const time = timeArr[1].split(':');
  const createdAt = `${timeArr[0]} at ${time[0]}:${time[1]}`;

  let markUpChat = '';
  if (from === 'me') {
    markUpChat += `<div class="row"><div class="col-lg-12 no-padding"><p class="float-left">
          <a href="/profile/${currentUser.id}"><img
          src="/img/users/${currentUser.profilePhoto}"
          width="38px"
          class="img-fluid rounded" /></a><span class="text-message align-top ml-2" style="background-color: white" data-toggle="tooltip" data-placement="top" title="${createdAt}">${message}</span></p></div></div>`;
  } else {
    markUpChat += `<div class="row"><div class="col-lg-12 no-padding"><p class="float-right">
        <span class="align-top mr-2 text-message" style="background-color: #007bff; color: #fff" data-toggle="tooltip" data-placement="top" title="${createdAt}">${message}</span><a href="/profile/${user_id}"><img
        src="/img/users/${user_photo}"
        width="38px"
        class="img-fluid rounded" /></a></p></div></div>`;
  }

  return markUpChat;
};

async function getNewMessages() {
  try {
    const response = await axios({
      method: 'GET',
      url: '/api/users/newMessages',
    });

    if (response.data.status === 'empty') {
      return;
    }

    const newMsgsArr = response.data.data.newMessages;
    let sender_id;

    for (let i = 0; i < newMsgsArr.length; i++) {
      const openedChat = document.getElementById(`btnChat-${newMsgsArr[i].from.id}`);

      if (sender_id == newMsgsArr[i].from.id) {
        continue;
      }

      if (openedChat) {
        let newMsgs_count = parseInt(document.getElementById(`num_of_newMsgs--${newMsgsArr[i].from.id}`).textContent);
        let markUpChat = createChatMessage(
          newMsgsArr[i].from.id,
          newMsgsArr[i].text,
          newMsgsArr[i].from.profilePhoto,
          'notMe',
          newMsgsArr[i].createdAt
        );
        $(`#chat-${newMsgsArr[i].from.id}`).append(markUpChat);
        $('[data-toggle="tooltip"]').tooltip();
        scrollDownChat(newMsgsArr[i].from.id);
        openedChat.classList.remove('btn-outline-primary', 'btn--chat');
        openedChat.classList.add('btn-primary', 'alertMsg', 'btn--newMsg');
        $(`#num_of_newMsgs--${newMsgsArr[i].from.id}`).text(`${newMsgs_count + 1}`);
        $(`#num_of_newMsgs--${newMsgsArr[i].from.id}`).css('display', 'inline-block');
      } else {
        sender_id = newMsgsArr[i].from.id;
        const user_name = newMsgsArr[i].from.firstName + ' ' + newMsgsArr[i].from.lastName;
        await getChat(newMsgsArr[i].from.id, user_name, newMsgsArr[i].from.profilePhoto, 'true');
      }
    }

    return;
  } catch (err) {
    console.log(err);
  }
}

function scrollDownChat(user_id) {
  const objDiv = document.getElementById(`scroll-${user_id}`);
  objDiv.scrollTop = objDiv.scrollHeight;
}

function goWhite(user_id) {
  const btn_chat = document.querySelector(`#btnChat-${user_id}`);
  if (btn_chat) {
    if (btn_chat.classList.contains('alertMsg')) {
      markMsgsAsSeen(user_id);
      btn_chat.classList.remove('alertMsg');
    }

    btn_chat.classList.remove('btn--newMsg');
    btn_chat.classList.add('btn--chat');
    btn_chat.classList.remove('btn-primary');
    btn_chat.classList.add('btn-outline-primary');

    $(`#collapse-${user_id}`).collapse('show');
    scrollDownChat(user_id);

    $(`#num_of_newMsgs--${user_id}`).text('0');
    $(`#num_of_newMsgs--${user_id}`).css('display', 'none');
  }
}

function displayCloseBtn(user_id) {
  $(`#closeChat-${user_id}`).css('visibility', 'visible');
}

function hideCloseBtn(user_id) {
  $(`#closeChat-${user_id}`).css('visibility', 'hidden');
}

function closeChat(user_id) {
  $(`#entireChat-${user_id}`).remove();
}

async function markMsgsAsSeen(sender_id) {
  try {
    await axios({
      method: 'PATCH',
      url: `/api/messages/msgsSeen/${sender_id}`,
    });
  } catch (err) {
    console.log(err);
  }
}

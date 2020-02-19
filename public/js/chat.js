window.setInterval(getNewMessages, 1000);
const currentUser = JSON.parse(document.getElementById('currentUser').dataset.currentUser);

async function getChat(user_id, user_name, user_photo, newMessage = 'false') {
  if (document.getElementById(`btnChat-${user_id}`)) {
    return;
  }

  try {
    const response = await axios({
      method: 'GET',
      url: `/api/users/myChatWith/${user_id}`
    });

    if (response.data.data.chat === null) {
      openChatButton(user_id, user_name, user_photo, null);
    } else {
      openChatButton(user_id, user_name, user_photo, response.data.data.chat.messages, newMessage);
    }
  } catch (err) {
    console.log(err);
  }
}

document.getElementById('card-users').addEventListener('click', async event => {
  if (event.target.dataset.user_id) {
    const { user_id, user_name, user_photo } = event.target.dataset;

    if (document.getElementById(`collapse-${user_id}`)) {
      $(`#collapse-${user_id}`).collapse('show');
      return;
    }

    event.target.innerHTML += ` <span style="color: lightblue" class="spinner-border spinner-border-sm" role="status" aria-hidden="true" id="spinner-${user_id}"></span>`;
    event.target.disabled = true;

    await getChat(user_id, user_name, user_photo);

    document.getElementById(`spinner-${user_id}`).remove();
    event.target.disabled = false;
  }
});

const openChatButton = (user_id, user_name, user_photo, messages, newMessage = 'false') => {
  let markUpChat = '';

  if (messages != null) {
    messages.forEach(msg => {
      if (msg.to.id != user_id) {
        markUpChat += createChatMessage(user_id, msg.text, user_photo, 'notMe');
      } else {
        markUpChat += createChatMessage(null, msg.text, null, 'me');
      }
    });
  }

  const markUpButton = `<div class="col-lg-4" id="entireChat-${user_id}"><p><button
    class="btn btn-${newMessage == 'false' ? 'light' : 'primary'} btn-block btn-lg"
    type="button"
    id="btnChat-${user_id}"
    onclick="goWhite('${user_id}');"
    onmouseover="displayCloseBtn('${user_id}');"
    onmouseleave="hideCloseBtn('${user_id}');"
    data-toggle="collapse"
    data-target="#collapse-${user_id}"
    aria-expanded="${newMessage == 'false' ? 'true' : 'false'}"
    aria-controls="collapse-${user_id}">${user_name} <a class="float-right" onclick="closeChat('${user_id}')"><i class="fas fa-times" style="color: #ff704d; display: none" id="closeChat-${user_id}"></i></a></button></p>
    <div class="collapse ${newMessage == 'false' ? 'show' : ''}" id="collapse-${user_id}">
    <div class="card card-body chat-body">
    <div class="chat" id="scroll-${user_id}"><div class="container-fluid" id="chat-${user_id}">${markUpChat}</div></div>
    <div class="form-group type-message-form">
    <input id="msgTo-${user_id}"
      class="form-control"
      type="text"
    ></input>
    <button class="btn btn-success btn-sm btn-block mt-1" onclick="sendMessage('${user_id}', this)" id="sendBtn-${user_id}">
      Send message
    </button>
    </div>
    </div></div></div>`;

  $('#chats-interface').append(markUpButton);
  scrollDownChat(user_id);

  const sendMsgBtn = document.getElementById(`sendBtn-${user_id}`);
  document.getElementById(`msgTo-${user_id}`).addEventListener('keyup', event => {
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
          text
        }
      });

      if (response.data.status === 'success') {
        document.getElementById(`msgTo-${receiver_id}`).value = '';
        let message = createChatMessage(null, response.data.data.message.text, null, 'me');
        $(`#chat-${receiver_id}`).append(message);
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

const createChatMessage = (user_id, message, user_photo, from) => {
  let markUpChat = '';
  if (from === 'me') {
    markUpChat += `<div class="row"><div class="col-lg-12 no-padding"><p class="float-left">
          <a href="/profile/${currentUser.id}"><img
          src="/img/users/${currentUser.profilePhoto}"
          width="40px"
          class="img-fluid rounded" /></a><span class="text-message align-middle ml-2" style="background-color: white">${message}</span></p></div></div>`;
  } else {
    markUpChat += `<div class="row"><div class="col-lg-12 no-padding"><p class="float-right">
        <span class="text-message align-middle mr-2" style="background-color: #ffff80">${message}</span><a href="/profile/${user_id}"><img
        src="/img/users/${user_photo}"
        width="40px"
        class="img-fluid rounded" /></a></p></div></div>`;
  }

  return markUpChat;
};

async function getNewMessages() {
  try {
    const response = await axios({
      method: 'GET',
      url: '/api/users/newMessages'
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
        let markUpChat = createChatMessage(newMsgsArr[i].from.id, newMsgsArr[i].text, newMsgsArr[i].from.profilePhoto, 'notMe');
        $(`#chat-${newMsgsArr[i].from.id}`).append(markUpChat);
        scrollDownChat(newMsgsArr[i].from.id);
        document.querySelector(`#btnChat-${newMsgsArr[i].from.id}`).classList.remove('btn-light');
        document.querySelector(`#btnChat-${newMsgsArr[i].from.id}`).classList.add('btn-primary');
      } else {
        sender_id = newMsgsArr[i].from.id;
        const user_name = newMsgsArr[i].from.firstName + ' ' + newMsgsArr[i].from.lastName;
        await getChat(newMsgsArr[i].from.id, user_name, newMsgsArr[i].from.profilePhoto, 'true');
      }
    }
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
    btn_chat.classList.remove('btn-primary');
    btn_chat.classList.add('btn-light');

    $(`#collapse-${user_id}`).collapse('show');
    scrollDownChat(user_id);
  }
}

function displayCloseBtn(user_id) {
  $(`#closeChat-${user_id}`).show();
}

function hideCloseBtn(user_id) {
  $(`#closeChat-${user_id}`).hide();
}

function closeChat(user_id) {
  $(`#entireChat-${user_id}`).remove();
}

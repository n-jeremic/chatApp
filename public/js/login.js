document.querySelector('form').addEventListener('submit', async event => {
  event.preventDefault();
  document.querySelector('.btn--login').innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading..';
  document.querySelector('.btn--login').disabled = true;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  await login(email, password);

  document.querySelector('.btn--login').innerHTML = 'Log in';
  document.querySelector('.btn--login').disabled = false;
});

const login = async (email, password) => {
  try {
    const response = await axios({
      method: 'POST',
      url: '/api/users/login',
      data: {
        email,
        password
      }
    });

    if (response.data.status === 'success') {
      location.assign('/news');
    }
  } catch (err) {
    Swal.fire('Warning', err.response.data.message, 'error');
  }
};

async function resetPassword(clickedBtn) {
  const email = $('#email_resetPass').val();
  if (!email) {
    return Swal.fire('Warning', 'Please provide your email!', 'error');
  }

  clickedBtn.disabled = true;
  clickedBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting..';

  try {
    const response = await axios({
      method: 'POST',
      url: '/api/users/forgotPassword',
      data: {
        email
      }
    });

    if (response.data.status === 'success') {
      Swal.fire('Info', 'An email with instructions has been sent to you!', 'success');
      $('#email_resetPass').val('');
      $('#resetPassModal').modal('hide');
      clickedBtn.disabled = false;
      clickedBtn.innerHTML = "<i class='fas fa-paper-plane mr-1'></i> Submit";
    }
  } catch (err) {
    console.log(err);
    clickedBtn.disabled = false;
    clickedBtn.innerHTML = "<i class='fas fa-paper-plane mr-1'></i> Submit";
    $('#email_resetPass').val('');
    Swal.fire('Warning', err.response.data.message, 'error');
  }
}

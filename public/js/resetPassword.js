document.querySelector('form').addEventListener('submit', async event => {
  event.preventDefault();
  document.querySelector('.btn--resetPass').innerHTML =
    '<span class="spinner-border spinner-grow-sm" role="status" aria-hidden="true"></span> Loading..';
  document.querySelector('.btn--resetPass').disabled = true;
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  const locationArr = location.href.split('/');
  const token = locationArr[locationArr.length - 1];

  await resetPassword(password, passwordConfirm, token);

  document.querySelector('.btn--resetPass').innerHTML = 'Change password';
  document.querySelector('.btn--resetPass').disabled = false;
});

async function resetPassword(password, passwordConfirm, token) {
  try {
    const response = await axios({
      method: 'POST',
      url: `/api/users/resetPassword/${token}`,
      data: {
        password,
        passwordConfirm
      }
    });

    if (response.data.status === 'success') {
      Swal.fire('Success', 'You have successfully changed your password! Go ahead and log in.', 'success');
      window.setTimeout(() => location.assign('/login'), 1500);
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', err.response.data.message, 'error');
  }
}

document.querySelector('form').addEventListener('submit', async event => {
  event.preventDefault();
  document.querySelector('.btn--login').innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Loading..';
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

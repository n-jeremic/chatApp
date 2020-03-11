document.querySelector('form').addEventListener('submit', async event => {
  event.preventDefault();
  document.querySelector('.btn--signup').innerHTML =
    '<span class="spinner-border spinner-grow-sm" role="status" aria-hidden="true"></span> Loading..';
  document.querySelector('.btn--signup').disabled = true;
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;

  await signupUser(firstName, lastName, email, password, passwordConfirm);

  document.querySelector('.btn--signup').innerHTML = 'Log in';
  document.querySelector('.btn--signup').disabled = false;
});

const signupUser = async (firstName, lastName, email, password, passwordConfirm) => {
  const userFirstName = firstName.replace(`${firstName[0]}`, `${firstName[0].toUpperCase()}`);
  const userLastName = lastName.replace(`${lastName[0]}`, `${lastName[0].toUpperCase()}`);

  try {
    const response = await axios({
      method: 'POST',
      url: '/api/users/signup',
      data: {
        firstName: userFirstName,
        lastName: userLastName,
        email,
        password,
        passwordConfirm
      }
    });

    if (response.data.status === 'success') {
      Swal.fire('Info', 'You have signed up successfully!', 'success');
      window.setTimeout(() => {
        location.assign('/news');
      }, 1000);
    }
  } catch (err) {
    Swal.fire('Warning', err.response.data.message, 'error');
  }
};

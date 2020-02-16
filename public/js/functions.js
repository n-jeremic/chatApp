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

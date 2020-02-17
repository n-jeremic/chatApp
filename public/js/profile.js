async function updateInfo() {
  const inputFields = $('.form-update-info input');
  const data = {};
  $.each(inputFields, (key, value) => {
    if (value.value.length > 0) {
      if (value.id === 'firstName' || value.id === 'lastName') {
        const upperCase = value.value.replace(
          `${value.value[0]}`,
          `${value.value[0].toUpperCase()}`
        );
        data[value.id] = upperCase;
      } else {
        data[value.id] = value.value;
      }
    }
  });

  if (Object.keys(data).length === 0 && data.constructor === Object) {
    return Swal.fire('Warning', 'Please fill out the form!', 'error');
  }

  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/users/updateMe',
      data
    });

    if (res.data.status === 'success') {
      clearForm(inputFields);
      Swal.fire('Info', 'Data successfully updated!', 'success');
      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (err) {
    console.log(err);
  }
}

function clearForm(fields) {
  for (let i = 0; i < fields.length; i++) {
    fields[i].value = '';
  }
}

async function changePassword() {
  const inputFields = $('.form-change-password input');
  data = {};

  for (let i = 0; i < inputFields.length; i++) {
    if (inputFields[i].value.length === 0) {
      return Swal.fire('Warning', 'Please fill out the form!', 'error');
    } else {
      data[inputFields[i].id] = inputFields[i].value;
    }
  }

  document.getElementById('btn-changePassword').disabled = true;
  document.getElementById('btn-changePassword').innerHTML =
    '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>  Changing...';

  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/users/updateMyPassword',
      data
    });

    if (res.data.status === 'success') {
      clearForm(inputFields);
      Swal.fire('Info', 'Password successfully changed!', 'success');
      document.getElementById('btn-changePassword').disabled = false;
      document.getElementById('btn-changePassword').innerHTML =
        '<i class="fas fa-user-edit"></i> Change Password';
      $('#password_modal').modal('hide');
    }
  } catch (err) {
    Swal.fire('Warning', err.response.data.message, 'error');
    clearForm(inputFields);
    document.getElementById('btn-changePassword').disabled = false;
    document.getElementById('btn-changePassword').innerHTML =
      '<i class="fas fa-user-edit"></i> Change Password';
  }
}

function readImage(input) {
  let reader = new FileReader();

  reader.onload = function(event) {
    $('#photo_input').attr('src', event.target.result);
  };

  reader.readAsDataURL(input.files[0]);
}

async function updatePhoto() {
  const file = $('#update_photo').val();
  if (!file) {
    return Swal.fire('Warning', 'Please choose new photo!', 'error');
  }
  document.getElementById('btn-photo').innerHTML =
    '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Updating...';
  document.getElementById('btn-photo').disabled = true;

  const form = new FormData();
  form.append('profilePhoto', document.getElementById('update_photo').files[0]);

  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/users/updateMe',
      data: form
    });

    if (res.data.status === 'success') {
      $('#update_photo').val('');
      document.getElementById('btn-photo').innerHTML =
        '<i class="fas fa-user-edit"></i> Update profile photo';
      document.getElementById('btn-photo').disabled = false;
      Swal.fire('Info', 'Photo successfully updated!', 'success');
      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (err) {
    console.log(err.response.data.message);
    document.getElementById('btn-photo').innerHTML =
      '<i class="fas fa-user-edit"></i> Update profile photo';
    document.getElementById('btn-photo').disabled = false;
  }
}

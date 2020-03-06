async function updateInfo() {
  const inputFields = $('.form-update-info input');
  const data = {};
  $.each(inputFields, (key, value) => {
    if (value.value.length > 0) {
      if (value.id === 'firstName' || value.id === 'lastName') {
        const upperCase = value.value.replace(`${value.value[0]}`, `${value.value[0].toUpperCase()}`);
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
    Swal.fire('Warning', 'Updating failed! Please try again!', 'error');
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

  addSpinner('btn-changePassword');

  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/users/updateMyPassword',
      data
    });

    if (res.data.status === 'success') {
      clearForm(inputFields);
      Swal.fire('Info', 'Password successfully changed!', 'success');
      removeSpinner('btn-changePassword', '<i class="fas fa-user-edit"></i> Change Password');
      $('#password_modal').modal('hide');
    }
  } catch (err) {
    Swal.fire('Warning', err.response.data.message, 'error');
    console.log(err);
    clearForm(inputFields);
    removeSpinner('btn-changePassword', '<i class="fas fa-user-edit"></i> Change Password');
  }
}

function closePhotoModal() {
  document.getElementById('add_photo-container').style.display = 'none';
  document.getElementById('add_photo').value = '';
  document.getElementById('photo_description').value = '';
}

function closeProfilePhotoModal() {
  document.getElementById('update_photo').value = '';
  const profilePhoto = document.getElementById('user-pr_photo').dataset.user_photo;
  $('#photo_input').attr('src', `/img/users/${profilePhoto}`);
}

function displayPhoto() {
  document.getElementById('add_photo-container').style.display = 'block';
}

function readImage(input, el_id) {
  let reader = new FileReader();

  reader.onload = function(event) {
    $(`#${el_id}`).attr('src', event.target.result);
  };

  reader.readAsDataURL(input.files[0]);
}

function addSpinner(btn_id) {
  document.getElementById(btn_id).innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
  document.getElementById(btn_id).disabled = true;
}

function removeSpinner(btn_id, btn_content) {
  document.getElementById(btn_id).innerHTML = btn_content;
  document.getElementById(btn_id).disabled = false;
}

async function updateProfilePhoto() {
  const file = $('#update_photo').val();
  if (!file) {
    return Swal.fire('Warning', 'Please choose new photo!', 'error');
  }

  addSpinner('btn-profile-photo');
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
      removeSpinner('btn-profile-photo', '<i class="fas fa-user-edit"></i> Update profile photo');
      Swal.fire('Info', 'Photo successfully updated!', 'success');
      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (err) {
    Swal.fire('Warning', 'Photo uploading failed! Please try again!', 'error');
    console.log(err);
    removeSpinner('btn-profile-photo', '<i class="fas fa-user-edit"></i> Update profile photo');
  }
}

async function addNewPhoto() {
  const file = $('#add_photo').val();
  if (!file) {
    return Swal.fire('Warning', 'Please choose a photo!', 'error');
  }

  const form = new FormData();
  form.append('content', document.getElementById('add_photo').files[0]);
  if (document.getElementById('photo_description').value.length > 0) {
    form.append('description', document.getElementById('photo_description').value);
  }

  addSpinner('btn-add-new-photo');

  try {
    const response = await axios({
      method: 'POST',
      url: '/api/posts/addPost',
      data: form
    });

    if (response.data.status === 'success') {
      window.setTimeout(() => {
        location.reload(true);
      }, 200);
      removeSpinner('btn-add-new-photo', '<i class="fas fa-cloud-upload-alt"></i> Upload photo');
    }
  } catch (err) {
    Swal.fire('Warning', 'Photo uploading failed! Please try again!', 'error');
    console.log(err);
    removeSpinner('btn-add-new-photo', '<i class="fas fa-cloud-upload-alt"></i> Upload photo');
  }
}

function readCoverPhoto(file) {
  readImage(file, 'coverPhoto');
  $('.btn-coverPhoto').show(700);
}

function cancelCoverPhoto() {
  $('#coverPhoto').attr('src', `/img/users/${currentUser.coverPhoto}`);
  $('.btn-coverPhoto').hide();
  $('#coverPhotoInput').val('');
}

async function uploadCoverPhoto() {
  addSpinner('btn-updateCover');
  const file = document.getElementById('coverPhotoInput').files[0];
  const formData = new FormData();
  formData.append('coverPhoto', file);

  try {
    const response = await axios({
      method: 'PATCH',
      url: '/api/users/updateMe',
      data: formData
    });

    if (response.data.status === 'success') {
      $('.btn-coverPhoto').hide();
      location.reload(true);
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Photo uploading failed! Please try again!', 'error');
  }
}

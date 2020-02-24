async function likePost(post_id, btn) {
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-thumbs-up"></i> Liked';
  try {
    await axios({
      method: 'POST',
      url: `/api/posts/like/${post_id}`
    });

    const num_likes = parseInt(document.getElementById(`btn-num_likes-${post_id}`).innerText.split(' ')[0]);
    document.getElementById(`btn-num_likes-${post_id}`).innerText = `${num_likes + 1} likes`;
    $(`#btn-num_likes-${post_id}`).attr('disabled', false);
  } catch (err) {
    console.log(err);
    Swal.fire('Ooops!', 'Something went wrong!', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="far fa-thumbs-up"></i> Like';
  }
}

async function commentPost(post_id) {
  const comment = $(`#comment_input-${post_id}`).val();
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/posts/comment/${post_id}`,
      data: {
        text: comment
      }
    });

    if (res.data.status === 'success') {
      $(`#comment_input-${post_id}`).val('');
      $(`#collapse_addComment-${post_id}`).collapse('hide');
      const num_comments = parseInt(document.getElementById(`btn-num_comments-${post_id}`).innerText.split(' ')[0]);
      document.getElementById(`btn-num_comments-${post_id}`).innerText = `${num_comments + 1} comments`;
      let comments_container = $(`#comments_list-${post_id}`);
      if (comments_container.html().includes('No comments to show.')) {
        comments_container.empty();
      }

      comments_container.append(
        `<div class="collapse_comments"><div class="row mb-2"><div class="col-lg-1 mr-4"><img class="mr-3" src='/img/users/${res.data.data.commentData.userPhoto}' width='70px' style='border-radius: 50%;'></div><div class="col-lg-10"><p style='font-weight: 600; font-size: 17px; margin-bottom: 3px !important;'><a href='/profile/${res.data.data.commentData.userId}' class="comment-userName">${res.data.data.commentData.firstName} ${res.data.data.commentData.lastName}</a></p><p style='font-weight: 400; margin-bottom: 3px !important; font-size: 15px'>${res.data.data.commentData.comment}</p></div></div></div>`
      );
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Ooops!', 'Something went wrong!', 'error');
  }
}

function addLikesHTML(likeData) {
  const markUp = `<button class="list-group-item list-group-item-action" style="padding: 5px !important;"><img class="mr-2" src="/img/users/${likeData.userPhoto}" width="40px"/><a class="comment-userName" href="/profile/${likeData.userId}">${likeData.firstName} ${likeData.lastName}</a></button>`;

  $('#append_likes').append(markUp);
}

async function getLikes(post_id) {
  $('#append_likes').empty();
  $('#append_likes').html(
    '<div class="spinner-border text-info" style="margin: auto; margin-top: 50px; margin-bottom: 50px" role="status"><span class="sr-only">Loading...</span></div>'
  );

  try {
    const res = await axios({
      method: 'GET',
      url: `/api/posts/${post_id}`
    });

    if (res.data.status === 'success') {
      $('#append_likes').empty();
      res.data.data.post.likes.forEach(like => addLikesHTML(like));
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Ooops!', 'Something went wrong!', 'error');
    $('#modal_likes').modal('hide');
  }
}

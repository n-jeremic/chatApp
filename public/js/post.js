function openGallery(post_id) {
  // Get the modal
  const modal = document.getElementById('modal_photos');

  // Get the image and insert it inside the modal - use its "alt" text as a caption
  const img = document.getElementById(`photo-${post_id}`);
  const modalImg = document.getElementById('img01');

  modal.style.display = 'block';
  modalImg.src = img.src;

  // Get the <span> element that closes the modal
  const span = document.getElementsByClassName('close_post')[0];

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = 'none';
  };
}

async function getPostDetails(post_id) {
  try {
    const postData = await axios({
      method: 'GET',
      url: `/api/posts/${post_id}`
    });

    if (postData.data.status === 'success') {
      document.getElementById('post_description').innerText = '';
      if (postData.data.data.post.description) {
        document.getElementById('post_description').innerText = '-  ' + postData.data.data.post.description;
      }
      $('#btn-add_comment').attr('onclick', `sendComment('${post_id}')`);
      $('#btn-like').attr('onclick', `likePost('${post_id}')`);

      if (postData.data.data.post.likedByMe === true) {
        $('#btn-like').removeClass('btn-secondary');
        $('#btn-like').addClass('btn-primary');
        $('#btn-like').html("<i class='fas fa-thumbs-up'></i> Liked");
        $('#btn-like').attr('disabled', true);
      } else {
        $('#btn-like').removeClass('btn-primary');
        $('#btn-like').addClass('btn-secondary');
        $('#btn-like').html("<i class='far fa-thumbs-up'></i> Like");
        $('#btn-like').attr('disabled', false);
      }

      $('#post_date').text(`Posted on ${postData.data.data.post.createdAt.split('T')[0].replace(/-/g, ' / ')}`);
      if (postData.data.data.post.likes.length === 0) {
        $('#num_of_likes').html(`0 likes`);
        $('#num_of_likes').attr('disabled', true);
      } else {
        $('#num_of_likes').attr('disabled', false);
        $('#num_of_likes').html(`${postData.data.data.post.likes.length} likes`);
        $('#append_likes').empty();
        postData.data.data.post.likes.forEach(like => addLikesHTML(like));
      }

      if (postData.data.data.post.comments.length === 0) {
        $('#add_comments').html("<div class='row'><div class='col-lg-12'><p class='text-center mt-3'>No comments to show.</p></div></div>");
      } else {
        $('#add_comments').empty();
        postData.data.data.post.comments.forEach(comment => addCommentHTML(comment));
      }
      openGallery(post_id);
    }
  } catch (err) {
    document.getElementById('modal_photos').style.display = 'none';
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

function addCommentHTML(commentData) {
  const markUp = `<div class="row" style="margin: 0px !important">
      <div class="col-lg-12 mb-1" style="border: 1px solid rgba(0,0,0,.125); padding: 6px !important; border-radius: 5px;">
        <div class="media">
          <img
            src="/img/users/${commentData.userPhoto}"
            class="mr-2"
            alt="..."
            width="70px"
            style="border-radius: 50%;"
          />
          <div class="media-body">
            <p class="mt-0" style="margin-bottom: 4px !important; font-weight: 500;">
              <a class="comment-userName" href="/profile/${commentData.userId}">${commentData.firstName} ${commentData.lastName}</a>
            </p>
            <p style="font-size: 14px; margin-bottom: 2px !important;">
            ${commentData.comment}
            </p>
          </div>
        </div>
      </div>
    </div>`;

  $('#add_comments').append(markUp);
}

function addLikesHTML(likeData) {
  const markUp = `<button class="list-group-item list-group-item-action" style="padding: 5px !important;"><img class="mr-2" src="/img/users/${likeData.userPhoto}" width="40px"/><a class="comment-userName" href="/profile/${likeData.userId}">${likeData.firstName} ${likeData.lastName}</a></button>`;

  $('#append_likes').append(markUp);
}

async function sendComment(post_id) {
  const text = $('#comment').val();
  if (!text) {
    return Swal.fire('Warning', 'You must have some text in your comment!', 'error');
  }
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/posts/comment/${post_id}`,
      data: {
        text
      }
    });

    if (res.data.status === 'success') {
      const content = $('#add_comments').text();
      if (content.includes('No comments to show')) {
        $('#add_comments').empty();
      }
      addCommentHTML(res.data.data.commentData);
      $('#comment').val('');
      $('#modal_comment').modal('hide');
    }
  } catch (err) {
    $('#comment').val('');
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

async function likePost(post_id) {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/posts/like/${post_id}`
    });

    if (res.data.status === 'success') {
      let likes_number = parseInt(
        $('#num_of_likes')
          .text()
          .split(' ')[0]
      );

      $('#num_of_likes').html(`${likes_number + 1} likes`);
      $('#num_of_likes').attr('disabled', false);
      addLikesHTML(res.data.data);
      $('#btn-like').removeClass('btn-secondary');
      $('#btn-like').addClass('btn-primary');
      $('#btn-like').html("<i class='fas fa-thumbs-up'></i> Liked");
      $('#btn-like').attr('disabled', true);
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
  }
}

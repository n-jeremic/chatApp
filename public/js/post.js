function openGallery(photo_path) {
  // Get the modal
  const modal = document.getElementById('modal_photos');

  // Get the image and insert it inside the modal - use its "alt" text as a caption
  const modalImg = document.getElementById('img--post');

  // modal.style.display = 'block';
  modalImg.src = `/img/posts/${photo_path}`;

  // Get the <span> element that closes the modal
  const span = document.getElementsByClassName('close_post')[0];

  $('#post--spinner').hide();
  $('.modal_posts-content').show();
  $('#comments_container').show();

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = 'none';
  };
}

async function getPostDetails(post_id, deletePostCheck = false) {
  $('.modal_posts-content').hide();
  $('#comments_container').hide();
  $('#modal_photos').show();
  $('#post--spinner').show();

  try {
    const postData = await axios({
      method: 'GET',
      url: `/api/posts/${post_id}`
    });

    if (postData.data.status === 'success') {
      if (location.href.includes('me') && deletePostCheck === true) {
        $('#btn-deletePost').attr('onclick', `deletePost('${post_id}')`);

        $('#img--post').on('mouseover', () => {
          $('#btn-deletePost').show(600);
          $('#img--post').css('cursor', 'pointer');
          $('#btn-deletePost').on('mouseover', () => {
            $('#btn-deletePost').show();
          });
        });

        $('#img--post').on('mouseleave', () => {
          $('#btn-deletePost').hide();
          $('#img--post').css('cursor', '');
        });
      }

      $('#modal_gallery-postOwnerPhoto').attr('src', `/img/users/${postData.data.data.post.user.profilePhoto}`);
      $('#modal_gallery-postOwner').text(`${postData.data.data.post.user.firstName} ${postData.data.data.post.user.lastName}`);
      document.getElementById('post_description').innerText = '';
      if (postData.data.data.post.description) {
        document.getElementById('post_description').innerText = '-  ' + postData.data.data.post.description;
      }
      $('#btn-add_comment').attr('onclick', `sendComment('${post_id}')`);
      $('#btn-like').attr('onclick', `likePostModal('${post_id}')`);

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
        postData.data.data.post.likes.forEach(like => addLikesHTMLModal(like));
      }

      if (postData.data.data.post.comments.length === 0) {
        $('#add_comments').html("<div class='row'><div class='col-lg-12'><p class='text-center mt-3'>No comments to show.</p></div></div>");
      } else {
        $('#add_comments').empty();
        postData.data.data.post.comments.forEach(comment => addCommentHTML(comment));
      }
      openGallery(postData.data.data.post.content);
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
            src="/img/users/${commentData.user.profilePhoto}"
            class="mr-2"
            alt="..."
            width="70px"
            style="border-radius: 50%;"
          />
          <div class="media-body">
            <p class="mt-0" style="margin-bottom: 4px !important; font-weight: 500;">
              <a class="comment-userName" href="/profile/${commentData.user._id}">${commentData.user.firstName} ${commentData.user.lastName}</a>
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

function addLikesHTMLModal(likeData) {
  const markUp = `<button class="list-group-item list-group-item-action" style="padding: 5px !important;"><img class="mr-2" src="/img/users/${likeData.profilePhoto}" width="40px"/><a class="comment-userName" href="/profile/${likeData._id}">${likeData.firstName} ${likeData.lastName}</a></button>`;

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

async function likePostModal(post_id) {
  $('#btn-like').removeClass('btn-secondary');
  $('#btn-like').addClass('btn-primary');
  $('#btn-like').html("<i class='fas fa-thumbs-up'></i> Liked");
  $('#btn-like').attr('disabled', true);

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
      addLikesHTMLModal(res.data.data);
    }
  } catch (err) {
    console.log(err);
    Swal.fire('Warning', 'Server error! Please try again.', 'error');
    $('#btn-like').removeClass('btn-primary');
    $('#btn-like').addClass('btn-secondary');
    $('#btn-like').html("<i class='far fa-thumbs-up'></i> Like");
    $('#btn-like').attr('disabled', false);
  }
}

function deletePost(post_id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then(async result => {
    if (result.value) {
      $('#btn-deletePost').attr('disabled', true);
      $('#btn-deletePost').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...');
      try {
        const response = await axios({
          method: 'DELETE',
          url: `/api/posts/${post_id}`
        });

        if (response.status === 204) {
          location.reload(true);
        }
      } catch (err) {
        console.log(err);
        Swal.fire('Warning', 'Server error! Please try again.', 'error');
      }
    }
  });
}

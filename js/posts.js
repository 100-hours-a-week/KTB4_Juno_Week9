/* 공통 이미지 렌더링 */

const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return "";
  }

  return imageUrl.startsWith("http") ? imageUrl : `${API_BASE_URL}${imageUrl}`;
};

const setBackgroundImage = (element, imageUrl) => {
  if (!element) {
    return;
  }

  if (!imageUrl) {
    element.style.backgroundImage = "";
    return;
  }

  const fullImageUrl = getFullImageUrl(imageUrl);

  element.style.backgroundImage = `url(${fullImageUrl})`;
  element.style.backgroundSize = "cover";
  element.style.backgroundPosition = "center";
  element.style.backgroundRepeat = "no-repeat";
};

const formatCount = (count) => {
  if (count >= 1000) {
    return `${Math.floor(count / 1000)}k`;
  }

  return String(count);
};

/* 게시글 목록 페이지 API 연동 */

const postList = document.querySelector("#postList");

if (postList) {
  const getPostsApi = async () => {
    return await request("/posts");
  };

  const renderPosts = (posts) => {
    postList.innerHTML = "";

    if (!posts.length) {
      postList.innerHTML = `<p class="post-empty-message">게시글이 없습니다.</p>`;
      return;
    }

    posts.forEach((post) => {
      const postCardLink = document.createElement("a");

      postCardLink.href = `./post-detail.html?post_id=${post.post_id}`;
      postCardLink.className = "post-card-link";

      postCardLink.innerHTML = `
        <article class="post-card">
          <div class="post-card-top">
            <h2 class="post-title">${post.title}</h2>

            <div class="post-info-row">
              <div class="post-stats">
              <span>좋아요 ${formatCount(post.like_count)}</span>
              <span>댓글 ${formatCount(post.comment_count)}</span>
              <span>조회수 ${formatCount(post.view_count)}</span>
              </div>

              <time class="post-date">${post.created_at}</time>
            </div>
          </div>

          <div class="post-card-bottom">
            <div class="post-author-image"></div>
            <span class="post-author-name">${post.author_nickname}</span>
          </div>
        </article>
      `;

      const postAuthorImage = postCardLink.querySelector(".post-author-image");

      setBackgroundImage(postAuthorImage, post.author_profile_image);

      postList.appendChild(postCardLink);
    });
  };

  const loadPosts = async () => {
    try {
      const response = await getPostsApi();

      renderPosts(response.data.posts);
    } catch (error) {
      alert(error.message);
    }
  };

  loadPosts();
}

/* 게시글 상세 페이지 API 연동 */

const postDetailTitle = document.querySelector("#postDetailTitle");

if (postDetailTitle) {
  const postDetailAuthorImage = document.querySelector(
    "#postDetailAuthorImage",
  );
  const postDetailAuthorName = document.querySelector("#postDetailAuthorName");
  const postDetailDate = document.querySelector("#postDetailDate");
  const postDetailImage = document.querySelector("#postDetailImage");
  const postDetailContent = document.querySelector("#postDetailContent");

  const postDetailLikeCount = document.querySelector("#postDetailLikeCount");
  const postDetailViewCount = document.querySelector("#postDetailViewCount");
  const postDetailCommentCount = document.querySelector(
    "#postDetailCommentCount",
  );
  const detailLikeStatCard = document.querySelector(".like-stat-card");
  const postEditLink = document.querySelector("#postEditLink");
  const commentList = document.querySelector("#commentList");
  const postDetailActions = document.querySelector(".post-detail-actions");

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post_id");
  let currentComments = [];
  let editingCommentId = null;
  let deletingCommentId = null;

  const likeState = {
    liked: false,
    isProcessing: false,
  };

  const getPostDetailApi = async () => {
    return await request(`/posts/${postId}`);
  };

  const setPostDetailImage = (element, imageUrl) => {
    element.innerHTML = "";
    element.style.backgroundImage = "";

    if (!imageUrl) {
      return;
    }

    const fullImageUrl = getFullImageUrl(imageUrl);

    const imageElement = document.createElement("img");

    imageElement.src = fullImageUrl;
    imageElement.alt = "게시글 이미지";
    imageElement.className = "post-detail-image-element";

    element.appendChild(imageElement);
  };
  const renderComments = (comments) => {
    commentList.innerHTML = "";

    comments.forEach((comment) => {
      const commentItem = document.createElement("article");
      commentItem.className = "comment-item";
      commentItem.dataset.commentId = comment.comment_id;

      commentItem.innerHTML = `
        <div class="comment-main">
          <div class="comment-profile-image"></div>

          <div class="comment-content-box">
            <div class="comment-meta-row">
              <span class="comment-author-name">${comment.author_nickname}</span>
              <time class="comment-date">${comment.created_at}</time>
            </div>

            <p class="comment-content">${comment.content}</p>
          </div>
        </div>

        <div class="comment-actions">
          <button type="button" class="post-detail-action-button comment-edit-button">
            <span class="post-detail-action-text">수정</span>
          </button>
          <button type="button" class="post-detail-action-button comment-delete-button">
            <span class="post-detail-action-text">삭제</span>
          </button>
        </div>
      `;

      const commentProfileImage = commentItem.querySelector(
        ".comment-profile-image",
      );

      setBackgroundImage(commentProfileImage, comment.author_profile_image);

      commentList.appendChild(commentItem);
    });
  };

  const updateComments = (comments) => {
    currentComments = comments;
    renderComments(currentComments);
  };

  const updateLikeState = (likeCount, liked) => {
    postDetailLikeCount.textContent = formatCount(likeCount);
    likeState.liked = liked;

    if (likeState.liked) {
      detailLikeStatCard.style.backgroundColor = "#aca0eb";
      return;
    }

    detailLikeStatCard.style.backgroundColor = "#d9d9d9";
  };

  const reloadComments = async () => {
    const response = await getPostDetailApi();

    updateComments(response.data.comments || []);

    postDetailCommentCount.textContent = formatCount(
      response.data.comment_count,
    );
  };

  const isPostOwner = (authorId) => {
    const loginUserId = localStorage.getItem("userId");

    return String(authorId) === loginUserId;
  };

  const updatePostActionVisibility = (authorId) => {
    if (!postDetailActions) {
      return;
    }

    if (isPostOwner(authorId)) {
      postDetailActions.style.display = "flex";
      return;
    }

    postDetailActions.style.display = "none";
  };

  const renderPostDetail = (post) => {
    postDetailTitle.textContent = post.title;
    postDetailAuthorName.textContent = post.author_nickname;
    postDetailDate.textContent = post.created_at;
    postDetailContent.textContent = post.content;

    postDetailViewCount.textContent = formatCount(post.view_count);
    postDetailCommentCount.textContent = formatCount(post.comment_count);

    updateLikeState(post.like_count, post.liked);

    postEditLink.href = `./post-edit.html?post_id=${post.post_id}`;

    setBackgroundImage(postDetailAuthorImage, post.author_profile_image);
    if (post.image) {
      setPostDetailImage(postDetailImage, post.image);
      postDetailImage.style.display = "flex";
    } else {
      postDetailImage.style.display = "none";
    }

    updateComments(post.comments || []);
    updatePostActionVisibility(post.author_id);
  };

  const loadPostDetail = async () => {
    if (!postId) {
      alert("게시글 정보를 찾을 수 없습니다.");
      window.location.href = "./posts.html";
      return;
    }

    try {
      const response = await getPostDetailApi();

      renderPostDetail(response.data);
    } catch (error) {
      alert(error.message);
      window.location.href = "./posts.html";
    }
  };

  /* 게시글 상세 페이지 댓글 이벤트 */

  const commentCreateForm = document.querySelector(".comment-create-form");

  if (commentCreateForm) {
    const commentTextarea = document.querySelector(".comment-create-textarea");
    const commentSubmitButton = document.querySelector(
      ".comment-create-button",
    );
    const commentDeleteModal = document.querySelector("#commentDeleteModal");
    const commentDeleteCancelButton = commentDeleteModal.querySelector(
      ".delete-modal-cancel-button",
    );
    const commentDeleteConfirmButton = commentDeleteModal.querySelector(
      ".delete-modal-confirm-button",
    );

    let isCommentSubmitting = false;

    const createCommentApi = async (content) => {
      return await request(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content,
        }),
      });
    };

    const updateCommentApi = async (commentId, content) => {
      return await request(`/posts/${postId}/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          content,
        }),
      });
    };

    const deleteCommentApi = async (commentId) => {
      return await request(`/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });
    };

    const addLikeApi = async () => {
      return await request(`/posts/${postId}/likes`, {
        method: "POST",
      });
    };

    const deleteLikeApi = async () => {
      return await request(`/posts/${postId}/likes`, {
        method: "DELETE",
      });
    };

    const updateCommentButtonState = () => {
      const commentText = commentTextarea.value.trim();

      commentSubmitButton.disabled = isCommentSubmitting;

      if (isCommentSubmitting) {
        commentSubmitButton.style.backgroundColor = "#aca0eb";
        return;
      }

      if (commentText) {
        commentSubmitButton.style.backgroundColor = "#7f6aee";
        return;
      }

      commentSubmitButton.style.backgroundColor = "#aca0eb";
    };

    const startEditComment = (commentId) => {
      const comment = currentComments.find(
        (currentComment) =>
          String(currentComment.comment_id) === String(commentId),
      );

      if (!comment) {
        return;
      }

      editingCommentId = comment.comment_id;
      commentTextarea.value = comment.content;
      commentSubmitButton.textContent = "댓글 수정";
      updateCommentButtonState();
      commentTextarea.focus();
    };

    detailLikeStatCard.addEventListener("click", async () => {
      if (likeState.isProcessing) {
        return;
      }

      if (!postId) {
        alert("게시글 정보를 찾을 수 없습니다.");
        return;
      }

      likeState.isProcessing = true;
      detailLikeStatCard.style.pointerEvents = "none";
      detailLikeStatCard.setAttribute("aria-busy", "true");

      try {
        const response = likeState.liked
          ? await deleteLikeApi()
          : await addLikeApi();

        updateLikeState(response.data.like_count, response.data.liked);
      } catch (error) {
        alert(error.message);
      } finally {
        likeState.isProcessing = false;
        detailLikeStatCard.style.pointerEvents = "";
        detailLikeStatCard.removeAttribute("aria-busy");
      }
    });

    commentTextarea.addEventListener("input", updateCommentButtonState);

    commentCreateForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (isCommentSubmitting) {
        return;
      }

      const commentText = commentTextarea.value.trim();

      if (!commentText) {
        updateCommentButtonState();
        return;
      }

      if (!postId) {
        alert("게시글 정보를 찾을 수 없습니다.");
        return;
      }

      isCommentSubmitting = true;
      updateCommentButtonState();

      try {
        if (editingCommentId !== null) {
          await updateCommentApi(editingCommentId, commentText);
          alert("댓글이 수정되었습니다.");
        } else {
          await createCommentApi(commentText);
          alert("댓글이 작성되었습니다.");
        }

        await reloadComments();

        commentTextarea.value = "";
        editingCommentId = null;
        commentSubmitButton.textContent = "댓글 등록";
        updateCommentButtonState();
      } catch (error) {
        alert(error.message);
      } finally {
        isCommentSubmitting = false;
        updateCommentButtonState();
      }
    });

    commentList.addEventListener("click", (event) => {
      const editButton = event.target.closest(".comment-edit-button");
      const deleteButton = event.target.closest(".comment-delete-button");

      if (editButton) {
        const commentItem = editButton.closest(".comment-item");

        startEditComment(commentItem.dataset.commentId);
        return;
      }

      if (deleteButton) {
        const commentItem = deleteButton.closest(".comment-item");

        deletingCommentId = commentItem.dataset.commentId;
        commentDeleteModal.classList.add("show");
        document.body.style.overflow = "hidden";
      }
    });

    commentDeleteCancelButton.addEventListener("click", () => {
      deletingCommentId = null;
      commentDeleteModal.classList.remove("show");
      document.body.style.overflow = "";
    });

    commentDeleteConfirmButton.addEventListener("click", async () => {
      if (deletingCommentId === null) {
        return;
      }

      try {
        const commentId = deletingCommentId;

        await deleteCommentApi(commentId);
        alert("댓글이 삭제되었습니다.");

        await reloadComments();

        deletingCommentId = null;
        commentDeleteModal.classList.remove("show");
        document.body.style.overflow = "";
      } catch (error) {
        alert(error.message);
      }
    });

    updateCommentButtonState();
  }

  loadPostDetail();
}

/* 게시글 작성 페이지 이벤트 */

const postCreateForm = document.querySelector(
  ".post-create-form:not(.post-edit-form)",
);

if (postCreateForm) {
  const postTitleInput = document.querySelector("#postTitle");
  const postContentTextarea = document.querySelector("#postContent");
  const postImageInput = document.querySelector("#postImage");
  const postFileName = document.querySelector("#postFileName");
  const postCreateHelperText = document.querySelector("#postCreateHelperText");
  const postSubmitButton = document.querySelector(".post-submit-button");

  let selectedPostImage = null;
  let selectedPostImageDataUrl = "";
  let isPostSubmitting = false;

  const setHelperText = (message) => {
    postCreateHelperText.textContent = message;
  };

  const clearHelperText = () => {
    postCreateHelperText.textContent = "";
  };

  const isPostFormValid = () => {
    const title = postTitleInput.value.trim();
    const content = postContentTextarea.value.trim();

    return title && title.length <= 26 && content;
  };

  const validatePostForm = () => {
    const title = postTitleInput.value.trim();
    const content = postContentTextarea.value.trim();

    if (!title || !content) {
      setHelperText("*제목, 내용을 모두 작성해주세요");
      return false;
    }

    clearHelperText();
    return true;
  };

  const updatePostSubmitButtonState = () => {
    postSubmitButton.disabled = isPostSubmitting;

    if (isPostSubmitting) {
      postSubmitButton.style.backgroundColor = "#aca0eb";
      return;
    }

    if (isPostFormValid()) {
      postSubmitButton.style.backgroundColor = "#7f6aee";
      return;
    }

    postSubmitButton.style.backgroundColor = "#aca0eb";
  };

  const createPostApi = async () => {
    let imageUrl = "";

    if (selectedPostImage) {
      const imageResponse = await uploadImageApi(selectedPostImage);
      imageUrl = imageResponse.data.image_url;
    }

    const body = {
      title: postTitleInput.value.trim(),
      content: postContentTextarea.value.trim(),
      image: imageUrl,
    };

    return await request("/posts", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  postTitleInput.addEventListener("input", () => {
    clearHelperText();
    updatePostSubmitButtonState();
  });

  postContentTextarea.addEventListener("input", () => {
    clearHelperText();
    updatePostSubmitButtonState();
  });

  postImageInput.addEventListener("change", () => {
    const file = postImageInput.files[0];

    if (!file) {
      selectedPostImage = null;
      selectedPostImageDataUrl = "";
      postFileName.textContent = "파일을 선택해주세요.";
      return;
    }

    selectedPostImage = file;
    postFileName.textContent = file.name;

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      selectedPostImageDataUrl = reader.result;
    });

    reader.readAsDataURL(file);
  });

  postCreateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isPostSubmitting) {
      return;
    }

    const isValid = validatePostForm();

    if (!isValid) {
      postSubmitButton.style.backgroundColor = "#aca0eb";
      return;
    }

    isPostSubmitting = true;
    updatePostSubmitButtonState();

    try {
      await createPostApi();

      window.location.href = "./posts.html";
    } catch (error) {
      setHelperText(`*${error.message}`);
      postSubmitButton.style.backgroundColor = "#aca0eb";
    } finally {
      isPostSubmitting = false;
      updatePostSubmitButtonState();
    }
  });

  updatePostSubmitButtonState();
}

/* 게시글 수정 페이지 이벤트 */

const postEditForm = document.querySelector(".post-edit-form");

if (postEditForm) {
  const editPostTitleInput = document.querySelector("#editPostTitle");
  const editPostContentTextarea = document.querySelector("#editPostContent");
  const editPostImageInput = document.querySelector("#editPostImage");
  const editPostFileName = document.querySelector("#editPostFileName");
  const postEditHelperText = document.querySelector("#postEditHelperText");
  const editPostSubmitButton = postEditForm.querySelector(
    ".post-submit-button",
  );

  let selectedEditImage = null;
  let selectedEditImageDataUrl = "";
  let currentPostImageUrl = "";
  let isEditPostSubmitting = false;

  const setEditHelperText = (message) => {
    postEditHelperText.textContent = message;
  };

  const clearEditHelperText = () => {
    postEditHelperText.textContent = "";
  };

  const isPostEditFormValid = () => {
    const title = editPostTitleInput.value.trim();
    const content = editPostContentTextarea.value.trim();

    return title && content;
  };

  const validatePostEditForm = () => {
    const title = editPostTitleInput.value.trim();
    const content = editPostContentTextarea.value.trim();

    if (!title || !content) {
      setEditHelperText("*제목, 내용을 모두 작성해주세요");
      return false;
    }

    clearEditHelperText();
    return true;
  };

  const updateEditSubmitButtonState = () => {
    editPostSubmitButton.disabled = isEditPostSubmitting;

    if (isEditPostSubmitting) {
      editPostSubmitButton.style.backgroundColor = "#aca0eb";
      return;
    }

    if (isPostEditFormValid()) {
      editPostSubmitButton.style.backgroundColor = "#7f6aee";
      return;
    }

    editPostSubmitButton.style.backgroundColor = "#aca0eb";
  };

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post_id");

  const getPostDetailApi = async () => {
    return await request(`/posts/${postId}`);
  };

  const updatePostApi = async () => {
    let imageUrl = currentPostImageUrl;

    if (selectedEditImage) {
      const imageResponse = await uploadImageApi(selectedEditImage);
      imageUrl = imageResponse.data.image_url;
    }

    const body = {
      title: editPostTitleInput.value.trim(),
      content: editPostContentTextarea.value.trim(),
      image: imageUrl,
    };

    return await request(`/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  };

  const renderEditPost = (post) => {
    editPostTitleInput.value = post.title;
    editPostContentTextarea.value = post.content;
    currentPostImageUrl = post.image || "";

    if (post.image) {
      editPostFileName.textContent = "기존 이미지";
    } else {
      editPostFileName.textContent = "파일을 선택해주세요.";
    }

    updateEditSubmitButtonState();
  };

  const loadEditPost = async () => {
    if (!postId) {
      alert("게시글 정보를 찾을 수 없습니다.");
      window.location.href = "./posts.html";
      return;
    }

    try {
      const response = await getPostDetailApi();

      renderEditPost(response.data);
    } catch (error) {
      alert(error.message);
      window.location.href = "./posts.html";
    }
  };

  editPostTitleInput.addEventListener("input", () => {
    clearEditHelperText();
    updateEditSubmitButtonState();
  });

  editPostContentTextarea.addEventListener("input", () => {
    clearEditHelperText();
    updateEditSubmitButtonState();
  });

  editPostImageInput.addEventListener("change", () => {
    const file = editPostImageInput.files[0];

    if (!file) {
      selectedEditImage = null;
      selectedEditImageDataUrl = "";

      if (currentPostImageUrl) {
        editPostFileName.textContent = "기존 이미지";
      } else {
        editPostFileName.textContent = "파일을 선택해주세요.";
      }

      return;
    }

    selectedEditImage = file;
    editPostFileName.textContent = file.name;

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      selectedEditImageDataUrl = reader.result;
    });

    reader.readAsDataURL(file);
  });

  postEditForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isEditPostSubmitting) {
      return;
    }

    const isValid = validatePostEditForm();

    if (!isValid) {
      editPostSubmitButton.style.backgroundColor = "#aca0eb";
      return;
    }

    if (!postId) {
      alert("게시글 정보를 찾을 수 없습니다.");
      return;
    }

    isEditPostSubmitting = true;
    updateEditSubmitButtonState();

    try {
      await updatePostApi();

      alert("게시글이 수정되었습니다.");

      window.location.href = `./post-detail.html?post_id=${postId}`;
    } catch (error) {
      setEditHelperText(`*${error.message}`);
      editPostSubmitButton.style.backgroundColor = "#aca0eb";
    } finally {
      isEditPostSubmitting = false;
      updateEditSubmitButtonState();
    }
  });

  updateEditSubmitButtonState();
  loadEditPost();
}

/* 게시글 삭제 모달 이벤트 */

const postDeleteButton = document.querySelector(".post-delete-button");
const postDeleteModal = document.querySelector("#postDeleteModal");

if (postDeleteButton && postDeleteModal) {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post_id");

  const deletePostApi = async () => {
    return await request(`/posts/${postId}`, {
      method: "DELETE",
    });
  };

  const postDeleteCancelButton = postDeleteModal.querySelector(
    ".delete-modal-cancel-button",
  );
  const postDeleteConfirmButton = postDeleteModal.querySelector(
    ".delete-modal-confirm-button",
  );

  const openPostDeleteModal = () => {
    postDeleteModal.classList.add("show");
    document.body.style.overflow = "hidden";
  };

  const closePostDeleteModal = () => {
    postDeleteModal.classList.remove("show");
    document.body.style.overflow = "";
  };

  postDeleteButton.addEventListener("click", openPostDeleteModal);

  postDeleteCancelButton.addEventListener("click", closePostDeleteModal);

  postDeleteConfirmButton.addEventListener("click", async () => {
    if (!postId) {
      alert("게시글 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      await deletePostApi();

      alert("게시글이 삭제되었습니다.");

      closePostDeleteModal();

      window.location.href = "./posts.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

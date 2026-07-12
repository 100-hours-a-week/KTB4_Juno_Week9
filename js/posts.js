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
  const safeCount = Number(count ?? 0);

  if (safeCount >= 1000) {
    return `${Math.floor(safeCount / 1000)}k`;
  }

  return String(safeCount);
};

/* 게시글 목록 페이지 API 연동 */

const postList = document.querySelector("#postList");

if (postList) {
  const boardBackButton = document.querySelector("#boardBackButton");
  const topHeader = document.querySelector("#topHeader");

  let lastScrollPosition = 0;

  const getPostsApi = async () => {
    return await request("/posts");
  };

  const renderPosts = (posts) => {
    postList.innerHTML = "";

    if (!posts.length) {
      postList.innerHTML = `
        <p class="post-empty-message">
          아직 작성된 게시글이 없습니다.
        </p>
      `;
      return;
    }

    posts.forEach((post) => {
      const postCardLink = document.createElement("a");

      postCardLink.href = `./post-detail.html?post_id=${post.post_id}`;
      postCardLink.className = "post-card-link";

      postCardLink.innerHTML = `
        <article class="post-card">
          <div class="post-card-content">
            <div class="post-author-row">
              <div class="post-author-image"></div>

              <div class="post-author-info">
                <span class="post-author-name">
                  ${post.author_nickname}
                </span>

                <time class="post-date">
                  ${post.created_at}
                </time>
              </div>
            </div>

            <h3 class="post-title">${post.title}</h3>

            <p class="post-preview">
              ${post.content || ""}
            </p>

            <div class="post-stats">
              <span class="post-stat">
                <span
                  class="material-symbols-outlined post-stat-icon"
                  style="font-variation-settings: 'FILL' 1"
                >
                  favorite
                </span>

                <span>${formatCount(post.like_count)}</span>
              </span>

              <span class="post-stat">
                <span class="material-symbols-outlined post-stat-icon">
                  forum
                </span>

                <span>${formatCount(post.comment_count)}</span>
              </span>

              <span class="post-stat">
                <span class="material-symbols-outlined post-stat-icon">
                  visibility
                </span>

                <span>${formatCount(post.view_count)}</span>
              </span>
            </div>
          </div>

          <div class="post-thumbnail"></div>
        </article>
      `;

      const postAuthorImage = postCardLink.querySelector(".post-author-image");
      const postThumbnail = postCardLink.querySelector(".post-thumbnail");

      setBackgroundImage(postAuthorImage, post.author_profile_image);

      if (post.image) {
        setBackgroundImage(postThumbnail, post.image);
      } else {
        postThumbnail.classList.add("hidden");
      }

      postList.appendChild(postCardLink);
    });
  };

  const loadPosts = async () => {
    try {
      const response = await getPostsApi();

      renderPosts(response.data.posts || []);
    } catch (error) {
      alert(error.message);
    }
  };

  if (boardBackButton) {
    boardBackButton.addEventListener("click", () => {
      window.history.back();
    });
  }

  if (topHeader) {
    window.addEventListener("scroll", () => {
      const currentScrollPosition = window.scrollY;

      if (currentScrollPosition <= 0) {
        topHeader.classList.remove("hidden");
        topHeader.classList.remove("scrolled");
        lastScrollPosition = currentScrollPosition;
        return;
      }

      if (currentScrollPosition > lastScrollPosition) {
        topHeader.classList.add("hidden");
      } else {
        topHeader.classList.remove("hidden");
        topHeader.classList.add("scrolled");
      }

      lastScrollPosition = currentScrollPosition;
    });
  }

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
  const postDetailCommentCountBadge = document.querySelector(
    "#postDetailCommentCountBadge",
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
            <span class="comment-author-name">
              ${comment.author_nickname}
            </span>

            <time class="comment-date">
              ${comment.created_at}
            </time>
          </div>

          <p class="comment-content">${comment.content}</p>
        </div>
      </div>

      <div class="comment-actions">
        <button
          type="button"
          class="comment-action-button comment-edit-button"
          aria-label="댓글 수정"
        >
          <span class="material-symbols-outlined">edit</span>
        </button>

        <button
          type="button"
          class="comment-action-button comment-delete-button"
          aria-label="댓글 삭제"
        >
          <span class="material-symbols-outlined">delete</span>
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

    detailLikeStatCard.classList.toggle("liked", liked);
  };

  const reloadComments = async () => {
    const response = await getPostDetailApi();
    const comments = response.data.comments ?? [];
    const commentCount = response.data.comment_count ?? comments.length;

    updateComments(comments);

    postDetailCommentCount.textContent = formatCount(commentCount);

    if (postDetailCommentCountBadge) {
      postDetailCommentCountBadge.textContent = formatCount(commentCount);
    }
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
    const comments = post.comments ?? [];

    const likeCount = post.likeCount ?? 0;
    const viewCount = post.viewCount ?? 0;
    const commentCount = post.commentCount ?? comments.length;

    postDetailTitle.textContent = post.title ?? "";
    postDetailAuthorName.textContent = post.nickname ?? "";
    postDetailDate.textContent = post.createdAt ?? "";
    postDetailContent.textContent = post.content ?? "";

    postDetailViewCount.textContent = formatCount(viewCount);
    postDetailCommentCount.textContent = formatCount(commentCount);

    if (postDetailCommentCountBadge) {
      postDetailCommentCountBadge.textContent = formatCount(commentCount);
    }

    updateLikeState(likeCount, post.liked ?? false);

    postEditLink.href = `./post-edit.html?post_id=${post.postId}`;

    setBackgroundImage(postDetailAuthorImage, post.profileImage);

    if (post.image) {
      setPostDetailImage(postDetailImage, post.image);
      postDetailImage.style.display = "flex";
    } else {
      postDetailImage.style.display = "none";
    }

    updateComments(comments);
    updatePostActionVisibility(post.authorId);
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

      commentSubmitButton.disabled = isCommentSubmitting || !commentText;

      if (isCommentSubmitting || !commentText) {
        commentSubmitButton.style.backgroundColor = "#c8c6c6";
        return;
      }

      commentSubmitButton.style.backgroundColor = "#b71422";
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

  const postImageDropzone = document.querySelector("#postImageDropzone");
  const postUploadPlaceholder = document.querySelector(
    "#postUploadPlaceholder",
  );
  const postImagePreview = document.querySelector("#postImagePreview");
  const postPreviewImage = document.querySelector("#postPreviewImage");
  const postImageRemoveButton = document.querySelector(
    "#postImageRemoveButton",
  );

  let selectedPostImage = null;
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

    return Boolean(title && title.length <= 26 && content);
  };

  const validatePostForm = () => {
    const title = postTitleInput.value.trim();
    const content = postContentTextarea.value.trim();

    if (!title) {
      setHelperText("*제목을 입력해주세요.");
      return false;
    }

    if (title.length > 26) {
      setHelperText("*제목은 최대 26자까지 입력할 수 있습니다.");
      return false;
    }

    if (!content) {
      setHelperText("*내용을 입력해주세요.");
      return false;
    }

    clearHelperText();
    return true;
  };

  const updatePostSubmitButtonState = () => {
    const isValid = isPostFormValid();

    postSubmitButton.disabled = isPostSubmitting || !isValid;
  };

  const resetPostImage = () => {
    selectedPostImage = null;
    postImageInput.value = "";
    postPreviewImage.removeAttribute("src");

    postImagePreview.classList.remove("show");
    postUploadPlaceholder.style.display = "flex";
    postFileName.textContent = "선택된 이미지가 없습니다.";
  };

  const renderPostImagePreview = (file) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      postPreviewImage.src = reader.result;
      postImagePreview.classList.add("show");
      postUploadPlaceholder.style.display = "none";
    });

    reader.addEventListener("error", () => {
      alert("이미지를 불러오지 못했습니다.");
      resetPostImage();
    });

    reader.readAsDataURL(file);
  };

  const selectPostImage = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 선택할 수 있습니다.");
      resetPostImage();
      return;
    }

    selectedPostImage = file;
    postFileName.textContent = file.name;

    renderPostImagePreview(file);
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

  postImageDropzone.addEventListener("click", (event) => {
    if (event.target.closest("#postImageRemoveButton")) {
      return;
    }

    postImageInput.click();
  });

  postImageInput.addEventListener("change", () => {
    const file = postImageInput.files[0];

    selectPostImage(file);
  });

  postImageRemoveButton.addEventListener("click", (event) => {
    event.stopPropagation();
    resetPostImage();
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    postImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      postImageDropzone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    postImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      postImageDropzone.classList.remove("drag-over");
    });
  });

  postImageDropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];

    selectPostImage(file);
  });

  postCreateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isPostSubmitting) {
      return;
    }

    const isValid = validatePostForm();

    if (!isValid) {
      updatePostSubmitButtonState();
      return;
    }

    isPostSubmitting = true;
    updatePostSubmitButtonState();

    try {
      await createPostApi();

      window.location.href = "./posts.html";
    } catch (error) {
      setHelperText(`*${error.message}`);
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

  const editPostSubmitButton = document.querySelector(".post-submit-button");

  const editPostImageDropzone = document.querySelector(
    "#editPostImageDropzone",
  );
  const editPostUploadPlaceholder = document.querySelector(
    "#editPostUploadPlaceholder",
  );
  const editPostImagePreview = document.querySelector("#editPostImagePreview");
  const editPostPreviewImage = document.querySelector("#editPostPreviewImage");
  const editPostImageRemoveButton = document.querySelector(
    "#editPostImageRemoveButton",
  );

  const postEditBackLink = document.querySelector("#postEditBackLink");
  const postEditCancelLink = document.querySelector("#postEditCancelLink");

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post_id");

  let selectedEditImage = null;
  let currentPostImageUrl = "";
  let isImageRemoved = false;
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

    return Boolean(title && title.length <= 26 && content);
  };

  const validatePostEditForm = () => {
    const title = editPostTitleInput.value.trim();
    const content = editPostContentTextarea.value.trim();

    if (!title) {
      setEditHelperText("*제목을 입력해주세요.");
      return false;
    }

    if (title.length > 26) {
      setEditHelperText("*제목은 최대 26자까지 입력할 수 있습니다.");
      return false;
    }

    if (!content) {
      setEditHelperText("*내용을 입력해주세요.");
      return false;
    }

    clearEditHelperText();
    return true;
  };

  const updateEditSubmitButtonState = () => {
    editPostSubmitButton.disabled =
      isEditPostSubmitting || !isPostEditFormValid();
  };

  const showEditImagePreview = (imageUrl) => {
    editPostPreviewImage.src = imageUrl;
    editPostImagePreview.classList.add("show");
    editPostUploadPlaceholder.style.display = "none";
  };

  const hideEditImagePreview = () => {
    editPostPreviewImage.removeAttribute("src");
    editPostImagePreview.classList.remove("show");
    editPostUploadPlaceholder.style.display = "flex";
  };

  const resetEditImage = () => {
    selectedEditImage = null;
    currentPostImageUrl = "";
    isImageRemoved = true;

    editPostImageInput.value = "";
    editPostFileName.textContent = "선택된 이미지가 없습니다.";

    hideEditImagePreview();
  };

  const renderSelectedEditImage = (file) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      showEditImagePreview(reader.result);
    });

    reader.addEventListener("error", () => {
      alert("이미지를 불러오지 못했습니다.");
      resetEditImage();
    });

    reader.readAsDataURL(file);
  };

  const selectEditImage = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 선택할 수 있습니다.");
      editPostImageInput.value = "";
      return;
    }

    selectedEditImage = file;
    isImageRemoved = false;

    editPostFileName.textContent = file.name;
    renderSelectedEditImage(file);
  };

  const getPostDetailApi = async () => {
    return await request(`/posts/${postId}`);
  };

  const updatePostApi = async () => {
    let imageUrl = currentPostImageUrl;

    if (isImageRemoved) {
      imageUrl = "";
    }

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
    editPostTitleInput.value = post.title ?? "";
    editPostContentTextarea.value = post.content ?? "";
    currentPostImageUrl = post.image ?? "";

    if (currentPostImageUrl) {
      showEditImagePreview(getFullImageUrl(currentPostImageUrl));
      editPostFileName.textContent = "기존 이미지";
    } else {
      hideEditImagePreview();
      editPostFileName.textContent = "선택된 이미지가 없습니다.";
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

  if (postId) {
    const detailPageUrl = `./post-detail.html?post_id=${postId}`;

    postEditBackLink.href = detailPageUrl;
    postEditCancelLink.href = detailPageUrl;
  }

  editPostTitleInput.addEventListener("input", () => {
    if (editPostTitleInput.value.length > 26) {
      editPostTitleInput.value = editPostTitleInput.value.slice(0, 26);
    }

    clearEditHelperText();
    updateEditSubmitButtonState();
  });

  editPostContentTextarea.addEventListener("input", () => {
    clearEditHelperText();
    updateEditSubmitButtonState();
  });

  editPostImageDropzone.addEventListener("click", (event) => {
    if (event.target.closest("#editPostImageRemoveButton")) {
      return;
    }

    editPostImageInput.click();
  });

  editPostImageInput.addEventListener("change", () => {
    const file = editPostImageInput.files[0];

    selectEditImage(file);
  });

  editPostImageRemoveButton.addEventListener("click", (event) => {
    event.stopPropagation();
    resetEditImage();
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    editPostImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      editPostImageDropzone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    editPostImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      editPostImageDropzone.classList.remove("drag-over");
    });
  });

  editPostImageDropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];

    selectEditImage(file);
  });

  postEditForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isEditPostSubmitting) {
      return;
    }

    const isValid = validatePostEditForm();

    if (!isValid) {
      updateEditSubmitButtonState();
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

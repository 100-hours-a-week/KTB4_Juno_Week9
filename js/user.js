/* 회원정보 수정 페이지 이벤트 */

const profileEditForm = document.querySelector(".profile-edit-form");

if (profileEditForm) {
  const profileImageInput = document.querySelector("#profileImageInput");
  const profileImageEditButton = document.querySelector(
    ".profile-image-edit-button",
  );
  const profileEmail = document.querySelector("#profileEmail");
  const nicknameInput = document.querySelector("#nickname");
  const profileHelperText = document.querySelector("#profileHelperText");
  const profileSubmitButton = document.querySelector(".profile-submit-button");
  const profileToast = document.querySelector("#profileToast");

  const withdrawButton = document.querySelector(".withdraw-button");
  const withdrawModal = document.querySelector("#withdrawModal");
  const withdrawCancelButton = withdrawModal.querySelector(
    ".withdraw-modal-cancel-button",
  );
  const withdrawConfirmButton = withdrawModal.querySelector(
    ".withdraw-modal-confirm-button",
  );

  let selectedProfileImageFile = null;
  let uploadedProfileImageUrl = "";
  let isProfileSubmitting = false;

  const getFullProfileImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "";
    }

    return imageUrl.startsWith("http")
      ? imageUrl
      : `${API_BASE_URL}${imageUrl}`;
  };

  const getMyProfileApi = async () => {
    return await request("/users/me");
  };

  const updateMyProfileApi = async () => {
    let profileImageUrl = uploadedProfileImageUrl;

    if (selectedProfileImageFile) {
      const imageResponse = await uploadImageApi(selectedProfileImageFile);

      profileImageUrl =
        imageResponse.data.image_url ?? imageResponse.data.imageUrl ?? "";
    }

    const body = {
      nickname: nicknameInput.value.trim(),
      profile_image: profileImageUrl,
    };

    return await request("/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  };

  const deleteMyAccountApi = async () => {
    return await request("/users/me", {
      method: "DELETE",
    });
  };

  const showHelperText = (message) => {
    profileHelperText.textContent = message;
    profileHelperText.style.visibility = "visible";
  };

  const hideHelperText = () => {
    profileHelperText.textContent = "";
    profileHelperText.style.visibility = "hidden";
  };

  const validateNickname = () => {
    const nickname = nicknameInput.value.trim();

    if (!nickname) {
      showHelperText("*닉네임을 입력해주세요.");
      return false;
    }

    if (/\s/.test(nickname)) {
      showHelperText("*닉네임에는 공백을 사용할 수 없습니다.");
      return false;
    }

    if (nickname.length > 10) {
      showHelperText("*닉네임은 최대 10자까지 작성 가능합니다.");
      return false;
    }

    hideHelperText();
    return true;
  };

  const updateProfileSubmitButtonState = () => {
    const nickname = nicknameInput.value.trim();

    const isValid = nickname && !/\s/.test(nickname) && nickname.length <= 10;

    profileSubmitButton.disabled = isProfileSubmitting || !isValid;
  };

  const showProfileToast = (message) => {
    profileToast.textContent = message;
    profileToast.classList.add("show");

    setTimeout(() => {
      profileToast.classList.remove("show");
    }, 2000);
  };

  const renderProfileImage = (imageUrl) => {
    if (!imageUrl) {
      profileImageEditButton.style.backgroundImage = "";
      profileImageEditButton.classList.remove("has-image");
      return;
    }

    profileImageEditButton.style.backgroundImage = `url(${getFullProfileImageUrl(imageUrl)})`;

    profileImageEditButton.classList.add("has-image");
  };

  const renderMyProfile = (user) => {
    const profileImage = user.profileImage ?? user.profile_image ?? "";

    if (profileEmail) {
      profileEmail.textContent = user.email ?? "";
    }

    nicknameInput.value = user.nickname ?? "";
    uploadedProfileImageUrl = profileImage;

    renderProfileImage(profileImage);
    updateProfileSubmitButtonState();
  };

  const loadMyProfile = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      alert("로그인이 필요합니다.");
      window.location.href = "./index.html";
      return;
    }

    try {
      const response = await getMyProfileApi();

      renderMyProfile(response.data);
    } catch (error) {
      alert(error.message);
      window.location.href = "./posts.html";
    }
  };

  profileImageInput.addEventListener("change", () => {
    const file = profileImageInput.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 선택할 수 있습니다.");
      profileImageInput.value = "";
      return;
    }

    selectedProfileImageFile = file;

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      profileImageEditButton.style.backgroundImage = `url(${reader.result})`;

      profileImageEditButton.classList.add("has-image");
    });

    reader.addEventListener("error", () => {
      alert("이미지를 불러오지 못했습니다.");
      selectedProfileImageFile = null;
      profileImageInput.value = "";
    });

    reader.readAsDataURL(file);
  });

  nicknameInput.addEventListener("input", () => {
    if (nicknameInput.value.length > 10) {
      nicknameInput.value = nicknameInput.value.slice(0, 10);
    }

    hideHelperText();
    updateProfileSubmitButtonState();
  });

  /* 프로필 이미지와 닉네임만 수정 */

  profileEditForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isProfileSubmitting) {
      return;
    }

    if (!validateNickname()) {
      updateProfileSubmitButtonState();
      return;
    }

    isProfileSubmitting = true;
    updateProfileSubmitButtonState();

    try {
      const response = await updateMyProfileApi();

      const updatedProfileImage =
        response?.data?.profileImage ??
        response?.data?.profile_image ??
        uploadedProfileImageUrl;

      uploadedProfileImageUrl = updatedProfileImage;
      selectedProfileImageFile = null;

      renderProfileImage(updatedProfileImage);
      showProfileToast("프로필 정보가 수정되었습니다.");
    } catch (error) {
      showHelperText(`*${error.message}`);
    } finally {
      isProfileSubmitting = false;
      updateProfileSubmitButtonState();
    }
  });

  withdrawButton.addEventListener("click", () => {
    withdrawModal.classList.add("show");
    document.body.style.overflow = "hidden";
  });

  withdrawCancelButton.addEventListener("click", () => {
    withdrawModal.classList.remove("show");
    document.body.style.overflow = "";
  });

  withdrawConfirmButton.addEventListener("click", async () => {
    try {
      await deleteMyAccountApi();

      localStorage.removeItem("userId");
      localStorage.removeItem("accessToken");

      alert("회원 탈퇴가 완료되었습니다.");
      window.location.href = "./index.html";
    } catch (error) {
      alert(error.message);
    }
  });

  hideHelperText();
  updateProfileSubmitButtonState();
  loadMyProfile();
}

/* 회원정보 수정 페이지 내부 비밀번호 변경 */

const profilePasswordForm = document.querySelector(".profile-password-form");

if (profilePasswordForm) {
  const profilePasswordInput = document.querySelector("#profilePassword");
  const profilePasswordConfirmInput = document.querySelector(
    "#profilePasswordConfirm",
  );
  const profilePasswordHelperText = document.querySelector(
    "#profilePasswordHelperText",
  );
  const profilePasswordConfirmHelperText = document.querySelector(
    "#profilePasswordConfirmHelperText",
  );
  const profilePasswordSubmitButton = document.querySelector(
    ".profile-password-submit-button",
  );
  const passwordVisibilityButtons = document.querySelectorAll(
    ".password-visibility-button",
  );
  const profileToast = document.querySelector("#profileToast");

  let isPasswordSubmitting = false;

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]).{8,20}$/;

  const updateProfilePasswordApi = async () => {
    const body = {
      new_password: profilePasswordInput.value.trim(),
    };

    return await request("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  };

  const hidePasswordHelperTexts = () => {
    profilePasswordHelperText.textContent = "";
    profilePasswordConfirmHelperText.textContent = "";
  };

  const validatePasswordForm = () => {
    const password = profilePasswordInput.value.trim();
    const passwordConfirm = profilePasswordConfirmInput.value.trim();

    hidePasswordHelperTexts();

    if (!password) {
      profilePasswordHelperText.textContent = "*새 비밀번호를 입력해주세요.";
      return false;
    }

    if (!passwordRegex.test(password)) {
      profilePasswordHelperText.textContent =
        "*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
      return false;
    }

    if (!passwordConfirm) {
      profilePasswordConfirmHelperText.textContent =
        "*새 비밀번호를 한 번 더 입력해주세요.";
      return false;
    }

    if (password !== passwordConfirm) {
      profilePasswordConfirmHelperText.textContent =
        "*비밀번호가 일치하지 않습니다.";
      return false;
    }

    return true;
  };

  const isPasswordFormValid = () => {
    const password = profilePasswordInput.value.trim();
    const passwordConfirm = profilePasswordConfirmInput.value.trim();

    return Boolean(
      passwordRegex.test(password) &&
      passwordConfirm &&
      password === passwordConfirm,
    );
  };

  const updatePasswordButtonState = () => {
    profilePasswordSubmitButton.disabled =
      isPasswordSubmitting || !isPasswordFormValid();
  };

  const showPasswordToast = () => {
    profileToast.textContent = "비밀번호가 변경되었습니다.";
    profileToast.classList.add("show");

    setTimeout(() => {
      profileToast.classList.remove("show");
    }, 2000);
  };

  profilePasswordInput.addEventListener("input", () => {
    hidePasswordHelperTexts();
    updatePasswordButtonState();
  });

  profilePasswordConfirmInput.addEventListener("input", () => {
    hidePasswordHelperTexts();
    updatePasswordButtonState();
  });

  passwordVisibilityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetInput = document.querySelector(`#${button.dataset.target}`);
      const icon = button.querySelector(".material-symbols-outlined");

      if (!targetInput || !icon) {
        return;
      }

      const shouldShow = targetInput.type === "password";

      targetInput.type = shouldShow ? "text" : "password";
      icon.textContent = shouldShow ? "visibility_off" : "visibility";
    });
  });

  profilePasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isPasswordSubmitting) {
      return;
    }

    if (!validatePasswordForm()) {
      updatePasswordButtonState();
      return;
    }

    isPasswordSubmitting = true;
    updatePasswordButtonState();

    try {
      await updateProfilePasswordApi();

      profilePasswordInput.value = "";
      profilePasswordConfirmInput.value = "";

      hidePasswordHelperTexts();
      showPasswordToast();
    } catch (error) {
      profilePasswordHelperText.textContent = `*${error.message}`;
    } finally {
      isPasswordSubmitting = false;
      updatePasswordButtonState();
    }
  });

  hidePasswordHelperTexts();
  updatePasswordButtonState();
}

/* 공통 정규식 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]).{8,20}$/;

/* 로그인 페이지 이벤트 */

const loginForm = document.querySelector(".login-form");

if (loginForm) {
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const loginButton = document.querySelector(".login-button");
  const loginHelperText = document.querySelector("#loginHelperText");

  const getLoginErrorMessage = () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email) {
      return "* 이메일을 입력해주세요.";
    }

    if (!emailRegex.test(email)) {
      return "* 올바른 이메일 주소 형식을 입력해주세요. (예: example@adapterz.kr)";
    }

    if (!password) {
      return "* 비밀번호를 입력해주세요.";
    }

    if (!passwordRegex.test(password)) {
      return "* 비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
    }

    return "";
  };

  const signinApi = async () => {
    const body = {
      email: emailInput.value.trim(),
      password: passwordInput.value.trim(),
    };

    return await request("/users/signin", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  const updateLoginState = () => {
    const errorMessage = getLoginErrorMessage();

    loginHelperText.textContent = errorMessage;

    if (errorMessage) {
      loginButton.classList.remove("active");
      return false;
    }

    loginButton.classList.add("active");
    return true;
  };

  emailInput.addEventListener("input", updateLoginState);
  passwordInput.addEventListener("input", updateLoginState);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const isValid = updateLoginState();

    if (!isValid) {
      return;
    }

    try {
      const response = await signinApi();

      localStorage.setItem("userId", response.data.user_id);

      window.location.href = "./posts.html";
    } catch (error) {
      loginHelperText.textContent = `* ${error.message}`;
      loginButton.classList.remove("active");
    }
  });
}

/* 회원가입 페이지 이벤트 */

const signupForm = document.querySelector(".signup-form");

if (signupForm) {
  const profileImageInput = document.querySelector("#profileImageInput");
  const profileImageButton = document.querySelector(".profile-image-button");
  const plusIcon = document.querySelector(".plus-icon");

  const signupEmailInput = document.querySelector("#signupEmail");
  const signupPasswordInput = document.querySelector("#signupPassword");
  const signupPasswordConfirmInput = document.querySelector(
    "#signupPasswordConfirm",
  );
  const signupNicknameInput = document.querySelector("#signupNickname");

  const signupEmailHelper = document.querySelector("#signupEmailHelper");
  const signupPasswordHelper = document.querySelector("#signupPasswordHelper");
  const signupPasswordConfirmHelper = document.querySelector(
    "#signupPasswordConfirmHelper",
  );
  const signupNicknameHelper = document.querySelector("#signupNicknameHelper");

  const signupButton = document.querySelector(".signup-button");

  let selectedProfileImage = null;

  const signupEmailRegex = /^[A-Za-z0-9.]+@[A-Za-z0-9.]+\.[A-Za-z]+$/;

  const hasSpace = (value) => /\s/.test(value);

  const hideHelperText = (helperElement) => {
    if (!helperElement) {
      return;
    }

    helperElement.textContent = "";
    helperElement.style.visibility = "hidden";
  };

  const showHelperText = (helperElement, message) => {
    if (!helperElement) {
      return;
    }

    helperElement.textContent = message;
    helperElement.style.visibility = "visible";
  };

  /* 회원가입 페이지 최초 헬퍼 텍스트 숨김 */

  hideHelperText(signupEmailHelper);
  hideHelperText(signupPasswordHelper);
  hideHelperText(signupPasswordConfirmHelper);
  hideHelperText(signupNicknameHelper);

  const validateSignupEmail = () => {
    const email = signupEmailInput.value.trim();

    if (!email) {
      showHelperText(signupEmailHelper, "*이메일을 입력해주세요.");
      return false;
    }

    if (!signupEmailRegex.test(email)) {
      showHelperText(
        signupEmailHelper,
        "*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)",
      );
      return false;
    }

    hideHelperText(signupEmailHelper);
    return true;
  };

  const validateSignupPassword = () => {
    const password = signupPasswordInput.value.trim();

    if (!password) {
      showHelperText(signupPasswordHelper, "*비밀번호를 입력해주세요.");
      return false;
    }

    if (!passwordRegex.test(password)) {
      showHelperText(
        signupPasswordHelper,
        "*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.",
      );
      return false;
    }

    hideHelperText(signupPasswordHelper);
    return true;
  };

  const validateSignupPasswordConfirm = () => {
    const password = signupPasswordInput.value.trim();
    const passwordConfirm = signupPasswordConfirmInput.value.trim();

    if (!passwordConfirm) {
      showHelperText(
        signupPasswordConfirmHelper,
        "*비밀번호를 한 번 더 입력해주세요.",
      );
      return false;
    }

    if (password !== passwordConfirm) {
      showHelperText(signupPasswordConfirmHelper, "*비밀번호가 다릅니다.");
      return false;
    }

    hideHelperText(signupPasswordConfirmHelper);
    return true;
  };

  const validateSignupNickname = () => {
    const nickname = signupNicknameInput.value.trim();

    if (!nickname) {
      showHelperText(signupNicknameHelper, "*닉네임을 입력해주세요.");
      return false;
    }

    if (hasSpace(nickname)) {
      showHelperText(signupNicknameHelper, "*띄어쓰기를 없애주세요.");
      return false;
    }

    if (nickname.length > 10) {
      showHelperText(
        signupNicknameHelper,
        "*닉네임은 최대 10자까지 작성 가능합니다.",
      );
      return false;
    }

    hideHelperText(signupNicknameHelper);
    return true;
  };

  const isSignupFormValid = () => {
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value.trim();
    const passwordConfirm = signupPasswordConfirmInput.value.trim();
    const nickname = signupNicknameInput.value.trim();

    return Boolean(
      signupEmailRegex.test(email) &&
      passwordRegex.test(password) &&
      passwordConfirm &&
      password === passwordConfirm &&
      nickname &&
      !hasSpace(nickname) &&
      nickname.length <= 10,
    );
  };

  const updateSignupButtonState = () => {
    const isValid = isSignupFormValid();

    signupButton.classList.toggle("active", isValid);
  };

  const resetProfileImagePreview = () => {
    selectedProfileImage = null;
    profileImageInput.value = "";

    profileImageButton.style.backgroundImage = "";
    profileImageButton.style.backgroundSize = "";
    profileImageButton.style.backgroundPosition = "";
    profileImageButton.style.backgroundRepeat = "";

    if (plusIcon) {
      plusIcon.style.display = "flex";
    }
  };

  const renderProfileImagePreview = (imageDataUrl) => {
    profileImageButton.style.backgroundImage = `url(${imageDataUrl})`;
    profileImageButton.style.backgroundSize = "cover";
    profileImageButton.style.backgroundPosition = "center";
    profileImageButton.style.backgroundRepeat = "no-repeat";

    if (plusIcon) {
      plusIcon.style.display = "none";
    }
  };

  const signupApi = async () => {
    let profileImageUrl = "";

    if (selectedProfileImage) {
      const imageResponse = await uploadImageApi(selectedProfileImage);

      profileImageUrl = imageResponse.data.image_url;
    }

    const body = {
      email: signupEmailInput.value.trim(),
      password: signupPasswordInput.value.trim(),
      nickname: signupNicknameInput.value.trim(),
      profile_image: profileImageUrl,
    };

    return await request("/users/signup", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  /*
   * 프로필 이미지 영역을 누르면 파일 선택 창을 엽니다.
   * 기존처럼 이미지를 선택한 상태에서 다시 눌렀을 때
   * 즉시 이미지를 삭제하지 않고 다른 이미지로 변경할 수 있습니다.
   */

  profileImageButton.addEventListener("click", () => {
    profileImageInput.click();
  });

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

    selectedProfileImage = file;

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      profileImageButton.style.backgroundImage = `url(${reader.result})`;
      profileImageButton.style.backgroundSize = "cover";
      profileImageButton.style.backgroundPosition = "center";
      profileImageButton.style.backgroundRepeat = "no-repeat";

      if (plusIcon) {
        plusIcon.style.display = "none";
      }
    });

    reader.readAsDataURL(file);
  });

  signupEmailInput.addEventListener("input", () => {
    validateSignupEmail();
    updateSignupButtonState();
  });

  signupPasswordInput.addEventListener("input", () => {
    validateSignupPassword();

    if (signupPasswordConfirmInput.value.trim()) {
      validateSignupPasswordConfirm();
    }

    updateSignupButtonState();
  });

  signupPasswordConfirmInput.addEventListener("input", () => {
    validateSignupPasswordConfirm();
    updateSignupButtonState();
  });

  signupNicknameInput.addEventListener("input", () => {
    validateSignupNickname();
    updateSignupButtonState();
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const isEmailValid = validateSignupEmail();
    const isPasswordValid = validateSignupPassword();
    const isPasswordConfirmValid = validateSignupPasswordConfirm();
    const isNicknameValid = validateSignupNickname();

    if (
      !isEmailValid ||
      !isPasswordValid ||
      !isPasswordConfirmValid ||
      !isNicknameValid
    ) {
      signupButton.classList.remove("active");
      return;
    }

    try {
      await signupApi();

      window.location.href = "./index.html";
    } catch (error) {
      const message = error.message;

      if (message.includes("이메일")) {
        showHelperText(signupEmailHelper, `*${message}`);
        return;
      }

      if (message.includes("닉네임")) {
        showHelperText(signupNicknameHelper, `*${message}`);
        return;
      }

      alert(message);
    }
  });

  updateSignupButtonState();
}

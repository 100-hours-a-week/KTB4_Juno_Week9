/* 헤더 프로필 드롭다운 이벤트 */

const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return "";
  }

  return imageUrl.startsWith("http") ? imageUrl : `${API_BASE_URL}${imageUrl}`;
};

const headerProfileButton = document.querySelector(".header-profile-button");
const headerProfileMenu = document.querySelector(".header-profile-menu");
const logoutButton = document.querySelector(".logout-button");

if (headerProfileButton && headerProfileMenu) {
  headerProfileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    headerProfileMenu.classList.toggle("show");
  });

  headerProfileMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    headerProfileMenu.classList.remove("show");
  });
}

const getMyProfileApi = async () => {
  return await request("/users/me");
};

const renderHeaderProfileImage = (profileImageUrl) => {
  const headerProfileImage = document.querySelector(".header-profile-image");

  if (!headerProfileImage || !profileImageUrl) {
    return;
  }

  const fullProfileImageUrl = getFullImageUrl(profileImageUrl);
  headerProfileImage.style.backgroundImage = `url(${fullProfileImageUrl})`;
  headerProfileImage.style.backgroundSize = "cover";
  headerProfileImage.style.backgroundPosition = "center";
  headerProfileImage.style.backgroundRepeat = "no-repeat";
};

const getProfileImageFromUser = (user) => {
  return user?.profileImage ?? user?.profile_image ?? "";
};

const loadHeaderProfile = async () => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return;
  }

  try {
    const response = await getMyProfileApi();

    renderHeaderProfileImage(getProfileImageFromUser(response.data));
  } catch (error) {
    console.error(error.message);
  }
};

const signoutApi = async () => {
  return await request("/users/signout", {
    method: "POST",
  });
};

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await signoutApi();
    } catch (error) {
      console.error(error.message);
    } finally {
      localStorage.removeItem("userId");
      localStorage.removeItem("accessToken");
      window.location.href = "./index.html";
    }
  });
}

loadHeaderProfile();

/* 헤더 프로필 드롭다운 이벤트 */

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

  headerProfileImage.style.backgroundImage = `url(${API_BASE_URL}${profileImageUrl})`;
  headerProfileImage.style.backgroundSize = "cover";
  headerProfileImage.style.backgroundPosition = "center";
  headerProfileImage.style.backgroundRepeat = "no-repeat";
};

const loadHeaderProfile = async () => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    return;
  }

  try {
    const response = await getMyProfileApi();

    renderHeaderProfileImage(response.data.profile_image);
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
      window.location.href = "./index.html";
    }
  });
}

loadHeaderProfile();

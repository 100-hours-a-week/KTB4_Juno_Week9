const getAuthHeaders = () => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    return {};
  }

  return {
    user_id: userId,
  };
};

const request = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "요청 처리 중 오류가 발생했습니다.");
  }

  return data;
};

const uploadImageApi = async (file) => {
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/images`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "이미지 업로드 중 오류가 발생했습니다.");
  }

  return data;
};

import Cookies from "js-cookie";
export function getToken() {
  return Cookies.get("token");
}

export function getRefreshToken() {
  return Cookies.get("refreshToken");
}

export function getHeader(type) {
  const headers = {
    "Content-Type":
      type && type === "multipart"
        ? "multipart/form-data"
        : type === "blob"
        ? "blob"
        : "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
  return headers;
}

export function getUser() {
  const cookieValue = Cookies.get("user");
  if (!cookieValue) return null;
  return JSON.parse(cookieValue);
}

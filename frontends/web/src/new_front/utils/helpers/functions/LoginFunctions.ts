import decode from "jwt-decode";

export const isLogin = async () => {
  const token = localStorage.getItem("id_token");
  if (!token) {
    return false;
  } else if (isTokenExpired(token)) {
    return false;
  } else if (token) {
    return true;
  }
  return true;
};

export const sendUserToLogin = (login: boolean, history: any, url: string) => {
  if (!login) {
    history.push(
      "/login?msg=" +
        encodeURIComponent(
          "Please sign up or log in so that you can upload a model"
        ) +
        "&src=" +
        encodeURIComponent(url)
    );
  }
};

type DecodedToken = {
  exp: number;
};

const isTokenExpired = (token: string) => {
  const decoded = decode<DecodedToken>(token);
  const currentTime = Date.now() / 1000;
  if (decoded.exp < currentTime) {
    return true;
  }
  return false;
};

import jwtDecode from "jwt-decode";

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

type DecodedToken = {
  exp: number;
};

const isTokenExpired = (token: string) => {
  const decoded = jwtDecode<DecodedToken>(token);
  const currentTime = Date.now() / 1000;
  if (decoded.exp < currentTime) {
    return true;
  }
  return false;
};

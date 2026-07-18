// utils/auth.js

import { jwtDecode } from "jwt-decode";
import { getItem, removeItem,setItem } from "../local_storage";

const TOKEN_KEY = "token";

export const getToken = () => {
  try {
    const token = getItem(TOKEN_KEY);
    if (typeof token === "string" && token.split(".").length === 3) {
      return token;
    }
    return null;
  } catch (error) {
    console.error("getToken error:", error);
    removeToken();
    return null;
  }
};


export const setToken = (token) => {
  if (typeof token === "string") {
    setItem({ [TOKEN_KEY]: token });
  } else {
    console.error("setToken expects a string.");
  }
};


export const removeToken = () => {
  removeItem(TOKEN_KEY);
};

export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    console.error("Invalid token during validation:", error);
    return false;
  }
};

export const autoLogout = (logoutCallback) => {
  const token = getToken();
  if (!token) return;

  try {
    const decoded = jwtDecode(token);
    const expiresIn = decoded.exp * 1000 - Date.now();

    if (expiresIn > 0) {
      setTimeout(() => {
        removeToken();
        logoutCallback();
      }, expiresIn);
    } else {
      removeToken();
      logoutCallback();
    }
  } catch (error) {
    console.error("Token autoLogout error:", error);
    removeToken();
    logoutCallback();
  }
};

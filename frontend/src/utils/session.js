// Login session helpers: where the login lives, and one place that decides "your session is over".

export const SESSION_EXPIRED_EVENT = "session-expired";

const TOKEN_KEY = "token";

// "Remember me" ticked: the login and app data live in localStorage and survive
// closing the browser. Unticked: they live in sessionStorage, which the browser
// clears when the tab is closed.
export const appStorage = () => (sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage);

export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);

// Whether the current login was "remembered" (true when nobody is logged in)
export const isRemembered = () => !sessionStorage.getItem(TOKEN_KEY);

// Save a login token. Without `remember`, it stays where the current one is
// (used when the token is replaced, e.g. after changing the password).
export const saveToken = (token, remember = isRemembered()) => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
};

// Forget everything about the login on this device
export const clearSession = () => {
  localStorage.clear();
  sessionStorage.clear();
};

// Anything can call this (API 401, socket auth error, token timer)
export const expireSession = () => {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

// Expiry time of a JWT in ms, read from its payload (no verification needed client-side)
export const getTokenExpiry = (token) => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
};

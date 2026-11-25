// Login session helpers: one place that decides "your session is over".

export const SESSION_EXPIRED_EVENT = "session-expired";

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

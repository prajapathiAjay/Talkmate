// Name and password rules, shared by sign-up, Settings and the reset-password page.
// The backend checks the same rules (backend/src/utils/validation.js).

// Letters (any language), spaces, and ' . - between words, e.g. "Mary-Jane O'Neil"
export const NAME_PATTERN = /^\p{L}+(?:[ '.-]+\p{L}+)*\.?$/u;
export const NAME_PATTERN_MESSAGE = "Name can only contain letters, spaces, and ' . -";
export const countLetters = (text) => (String(text ?? "").match(/\p{L}/gu) || []).length;

export const nameProblem = (name) => {
  const value = String(name ?? "").trim();
  if (!value) return "Name is required";
  if (value.length > 50) return "Name cannot exceed 50 characters";
  if (!NAME_PATTERN.test(value)) return NAME_PATTERN_MESSAGE;
  if (countLetters(value) < 3) return "Name must have at least 3 letters";
  return null;
};

export const passwordProblem = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password cannot exceed 128 characters";
  if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Must contain at least one lowercase letter";
  if (!/\d/.test(password)) return "Must contain at least one number";
  return null;
};

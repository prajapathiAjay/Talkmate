// Shared input rules. The frontend checks the same things for instant feedback,
// but the server checks again because requests can be sent without the app.

// At least 8 characters with an uppercase letter, a lowercase letter and a number
export const passwordProblem = (password) => {
  if (typeof password !== "string" || !password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password cannot exceed 128 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/\d/.test(password)) return "Password must contain at least one number";
  return null;
};

// Letters (any language), spaces, and ' . - between words; at least 3 letters
export const nameProblem = (name) => {
  const value = typeof name === "string" ? name.trim() : "";
  if (!value) return "Name is required";
  if (value.length > 50) return "Name cannot exceed 50 characters";
  if (!/^\p{L}+(?:[ '.-]+\p{L}+)*\.?$/u.test(value)) {
    return "Name can only contain letters, spaces, and ' . -";
  }
  if ((value.match(/\p{L}/gu) || []).length < 3) return "Name must have at least 3 letters";
  return null;
};

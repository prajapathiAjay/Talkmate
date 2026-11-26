// Case-insensitive "name starts with" filter built from what the user typed.
// Special regex characters are escaped so they're matched literally: searching
// "(" looks for names starting with "(" instead of breaking the query.
export const startsWithRegex = (text) => {
  const escaped = String(text ?? "")
    .trim()
    .slice(0, 50)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { $regex: `^${escaped}`, $options: "i" };
};

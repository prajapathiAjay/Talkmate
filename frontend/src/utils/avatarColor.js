// A consistent colour per person, so people are easy to tell apart at a glance
const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-500",
  "from-cyan-400 to-blue-500",
  "from-fuchsia-500 to-pink-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-500 to-red-500",
  "from-sky-400 to-indigo-500",
  "from-lime-400 to-emerald-500",
];

export const avatarGradient = (seed = "") => {
  let hash = 0;
  for (const char of String(seed)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
};

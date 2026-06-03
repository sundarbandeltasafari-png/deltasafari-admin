export const generatePasswordCustom = (len = 8) => {
  const chars = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "0123456789", "@$!%*?&"];
  const all = chars.join("");

  // 1. Start with the required sequence
  let pass = chars.map(s => s[Math.floor(Math.random() * s.length)]).join("");

  // 2. Fill the rest randomly
  while (pass.length < len) pass += all[Math.floor(Math.random() * all.length)];

  return pass;
};


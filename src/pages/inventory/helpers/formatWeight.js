export const formatWeight = (weight, unit = "g") => {
  if (weight === null || weight === undefined || weight === "" || weight === false) return null;
  const str = String(weight).trim();
  if (!str || str === "0") return null;
  if (/([a-zA-Z]+)$/.test(str)) return str;
  const cleanUnit = (unit || "g").trim();
  return `${str}${cleanUnit}`;
};

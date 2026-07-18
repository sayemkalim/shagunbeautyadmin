export const singularize = (word) => {
  const irregularPlurals = {
    services: "service",
  };

  if (irregularPlurals[word.toLowerCase()]) {
    return irregularPlurals[word.toLowerCase()];
  }

  if (word.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  } else if (word.endsWith("es")) {
    return word.slice(0, -2);
  } else if (word.endsWith("s")) {
    return word.slice(0, -1);
  }

  return word;
};

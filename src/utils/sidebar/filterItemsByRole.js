export const filterItemsByRole = (items, role) => {
    return items.filter((item) => !item.roles || item.roles.includes(role));
  };
  
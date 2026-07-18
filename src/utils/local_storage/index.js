
import { EncryptStorage } from "encrypt-storage";
export const encryptStorage = new EncryptStorage("your-secret-key", {
  storageType: "localStorage",
});

export const setItem = (payload) => {
  if (typeof payload !== "object" || payload === null) return;

  try {
    const keys = Object.keys(payload);
    keys.forEach((key) => {
      const value = payload[key];
      encryptStorage.setItem(key, value);
    });
  } catch (error) {
    console.error("Error setting encrypted items:", error);
  }
};

export const getItem = (key) => {
  try {
    return encryptStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting encrypted item '${key}':`, error);
    encryptStorage.removeItem(key); 
    return null;
  }
};

export const removeItem = (key) => {
  try {
    encryptStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing encrypted item '${key}':`, error);
  }
};

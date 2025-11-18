// utils/tools.js
export const formatResponse = (success, data, message = '') => {
  return {
    success,
    data,
    message
  };
};

export const nowDate = () => {
  return Math.floor(Date.now() / 1000);
};

export const uuid = () => {
  return Date.now().toString(16).slice(0, 6) + '-' + Math.random().toString(16).slice(2, 8);
};



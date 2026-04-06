export const normalizeText = (text: string): string => {
  return text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase();
};

export const generateTempId = () => Math.random().toString(36).slice(2, 10);

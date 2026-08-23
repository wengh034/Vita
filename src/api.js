const api = async (path, options = {}) => {
  const response = await fetch(path, options);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

export default api;
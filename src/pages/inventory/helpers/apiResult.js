// apiService never throws on API errors — it resolves with an
// error-shaped object instead, so success must be checked explicitly.
export const isApiError = (res) => Boolean(res?.error || res?.response?.success === false);

export const getApiErrorMessage = (res, fallback = "Something went wrong. Please try again.") => {
  return (
    res?.response?.data?.message ||
    res?.response?.message ||
    res?.message ||
    fallback
  );
};

export const getApiData = (res) => res?.response?.data;

export const getApiMessage = (res) => res?.response?.message;

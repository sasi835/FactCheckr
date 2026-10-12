export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(sessionStorage.getItem("factcheckr-token")
        ? {
            Authorization: `Bearer ${sessionStorage.getItem("factcheckr-token")}`,
          }
        : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Unable to complete request");
  return data;
}

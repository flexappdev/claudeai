export const fetcher = async <T = unknown>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.error || res.statusText), {
      status: res.status,
      code: body?.code,
    });
  }
  return res.json() as Promise<T>;
};

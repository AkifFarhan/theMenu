// https://vite.dev/guide/env-and-mode.html
export const secrets = {
  backendEndpoint:
    import.meta.env.VITE_BACKEND_ENDPOINT ||
    (import.meta.env.DEV
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : window.location.origin),
};

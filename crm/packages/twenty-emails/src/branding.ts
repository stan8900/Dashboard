export const BOLD_PUBLIC_URL = (
  process.env.FRONTEND_URL ??
  process.env.SERVER_URL ??
  'http://localhost:3000'
).replace(/\/$/, '');

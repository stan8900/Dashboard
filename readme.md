Residence Operations Dashboard
==============================

A single-page dashboard for residence forms and backend checks.

Run `npm install`, then `npm start`, and open `http://127.0.0.1:5500`.

Current workflows:

- Replacement keys: record issued and returned dates, then flag anything not returned within 7 days.
- Lockouts: record each time security or residence staff let a student into their room, then flag second and later lockouts as a £15 charge.
- Shortcuts: configure real form/backend links in `dist/config.js`.
- Login page: default access gate; saved staff initials persist until a refresh is requested.

Backend Excel sync:

- Set `REPLACEMENT_BACKEND_FILE_PATH` in `.env` to the synced workbook path on the laptop.
- Set `BACKEND_INITIALS=SJ` or the initials to filter by.
- The local server reads the latest file whenever the dashboard loads or refreshes.
![alt text](image.png)

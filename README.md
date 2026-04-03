# Orbit Tasks Frontend

A lightweight frontend for user authentication and task management.

This project includes:
- Registration page
- Login page
- Task dashboard (create, list, update status, delete)

## Project Structure

- `register.html` - Account creation UI
- `login.html` - Sign-in UI
- `task.html` - Task dashboard UI
- `script.js` - App logic (auth, API calls, task actions, routing)
- `config.js` - Frontend config (API base URL)

## Tech Stack

- HTML5
- Bootstrap 5.3 (CDN)
- Vanilla JavaScript
- LocalStorage (auth session storage)

## Prerequisites

- A running backend API (default expected at `http://localhost:8080`)
- Browser with JavaScript enabled

## Configuration

Edit `config.js` if your backend URL is different:

```js
window.APP_CONFIG = {
    API_BASE_URL: "http://localhost:8080"
};
```

## Run Locally

Because this is static frontend code, you can run it with any static server.

### Option 1: VS Code Live Server

1. Open the folder in VS Code.
2. Start a Live Server session from `login.html` or `register.html`.

### Option 2: Python HTTP Server

From the project folder:

```bash
python -m http.server 5500
```

Then open:
- `http://localhost:5500/login.html`
- or `http://localhost:5500/register.html`

## User Flow

1. Create an account on `register.html`.
2. Login on `login.html`.
3. After login, user is redirected to `task.html`.
4. Add tasks, mark complete/incomplete, and delete tasks.
5. Logout clears local auth session and returns to login page.

## API Endpoints Expected

The frontend tries both direct and `/api`-prefixed routes for compatibility.

### Auth
- `POST /auth/register` or `POST /api/auth/register`
- `POST /auth/login` or `POST /api/auth/login`

### Tasks
- `GET /tasks` or `GET /api/tasks`
- `POST /tasks` or `POST /api/tasks`
- `PATCH /tasks/{id}` or `PATCH /api/tasks/{id}`
- `DELETE /tasks/{id}` or `DELETE /api/tasks/{id}`

### Auth Header

For protected endpoints, frontend sends:

```http
Authorization: Bearer <token>
```

## Notes

- Session is stored in localStorage under key `orbit_auth_session`.
- If backend is unreachable, the UI shows a connection error message.
- If unauthorized during task loading, user is signed out and redirected to login.

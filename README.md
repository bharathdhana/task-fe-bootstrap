# Orbit Tasks - Simple Task Manager

A simple web app for managing your daily tasks. Sign up, log in, and keep track of what you need to do.

## Features

- Sign up with your name, email, and password
- Log in with your email and password
- Create new tasks with a title and description
- Mark tasks as Pending, In Progress, or Completed
- Delete tasks you no longer need
- Log out when you're done
- Works on phones, tablets, and computers

## Project Structure

```
Frontend/
├── README.md (this file)
├── config.js (backend address)
├── script.js (app logic)
├── style.css (styling)
├── login.html (login page)
├── register.html (signup page)
├── task.html (task page)
└── SPRING_BOOT_API_CONTRACT.md (backend specs)
```

## Setup
Getting Started

### Step 1: Start the Frontend

You need a local web server to run the app.

**Easiest Way: Use VS Code Live Server**
1. Install the "Live Server" extension in VS Code
2. Right-click any HTML file
3. Select "Open with Live Server"
4. Your app will open automatically

**Other Ways:**
- Use Python: Run `python -m http.server 5500`
- Use Node.js: Use `http-server -p 5500`

The app will open at `http://localhost:5500`

### Step 2: Set Backend Address

Open the file `config.js` and update the backend address to match where your backend is running.

Examples:
- Local: `http://localhost:8080`
- Cloud: `https://your-backend.com`
- Different port: `http://localhost:9000`
## Backend Connection

This frontend expects a Spring Boot REST API with these endpoints:

### Authentication

- **POST /auth/register** - Register new user
  - Body: `{ "name": "John", "email": "john@example.com", "password": "pass1234" }`
  - Response: `{ "id": 1, "name": "John", "email": "john@example.com", "token": "jwt-token" }`

- *What Your Backend Needs

Your backend must have these features:

### User Registration
When someone creates an account, accept their name, email, and password. Return a user ID and optional token.

### User Login
When someone logs in, accept their email and password. Return a user ID, name, email, and a token.

### Task List
Show all tasks for the logged-in user. Each task has a title, description, and status.

### Create Task
Accept new tasks with a title, description, and status.

### Update Task Status
When a user clicks the checkbox, update the task's status between "Pending" and "Completed".

### Delete Task
Remove a task when the user clicks the delete button. Login
1. Enter email and password
2. Click "Login"
3. You'll be redirected to the task page

### Manage Tasks
1. **Add Task**: Enter title, description, select status, click "Add Task"
2. **Toggle Status**: Click checkbox to mark task complete/incomplete
3. **Delete Task**: Click "Delete" button
4. **Logout**: Click "Logout" button in header

## Frontend DTOs

The frontend sends and receives data in these formats:

### UserDTO
```javascript
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "pass1234"  // Only sent during register/login
}
```

### TaskDTO
```javascript
{
  "id": 1,
  "title": "Complete project",
  "description": "Finish backend API",
  "status": "PENDING"  // Values: PENDING, IN_PROGRESS, COMPLETED
}
```

## Error Messages

The fing the App

### Register
1. Click "Create one" link on the login page
2. Type your name, email, password (8+ characters with numbers and letters)
3. Confirm your password by typing it again
4. Click "Create Account"
5. You'll be taken to the task page
Common Issues & Solutions

### Blank page or nothing loading
- Make sure you're using a web server (not just opening the file)
- Open your browser's developer tools (press F12)
- Look at the Console tab to see if there are errors

### Can't log in or register
- Check that your backend is running on the right port
- Make sure config.js has the correct backend address
- Check that the backend allows requests from your frontend

### Tasks won't show up
- Make sure you're logged in
- Refresh the page
- Check your backend is returning tasks

### Getting 403 errors
- Your backend might be blocking requests
- Check that your backend allows requests from `http://localhost:5500`
- Make sure your backend has CORS enabled

## Browser Support

Works on Chrome, Firefox, Safari, Edge, and mobile browsers.

## Need More Technical Details?

See `SPRING_BOOT_API_CONTRACT.md` for detailed backend specifications.

## License

MIT
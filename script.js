(function () {
	const AUTH_KEY = "orbit_auth_session";
	const API_BASE_URL_RAW = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "http://localhost:8080";
	const API_BASE_URL = String(API_BASE_URL_RAW).replace(/\/+$/, "");

	function normalizePath(path) {
		const raw = String(path || "");
		return raw.startsWith("/") ? raw : "/" + raw;
	}

	function readJSON(key, fallbackValue) {
		try {
			const raw = localStorage.getItem(key);
			return raw ? JSON.parse(raw) : fallbackValue;
		} catch {
			return fallbackValue;
		}
	}

	function showStatus(element, message, mode) {
		if (!element) return;
		element.textContent = message;
		element.className = "small mt-2";
		if (mode === "success") {
			element.classList.add("text-success");
			return;
		}
		if (mode === "error") {
			element.classList.add("text-danger");
			return;
		}
		element.classList.add("text-muted");
	}

	const getAuth = function () {
		return readJSON(AUTH_KEY, null);
	};

	const setAuth = function (value) {
		localStorage.setItem(AUTH_KEY, JSON.stringify(value));
	};

	function isStrongPassword(password) {
		return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
	}

	const clearAuth = function () {
		localStorage.removeItem(AUTH_KEY);
	};

	function authHeaders(extraHeaders) {
		const auth = getAuth();
		const headers = Object.assign({}, extraHeaders || {});
		if (auth && auth.token) headers.Authorization = "Bearer " + auth.token;
		return headers;
	}

	async function api(path, options) {
		try {
 			const requestOptions = Object.assign({}, options || {});
			const normalizedPath = normalizePath(path);

			const response = await fetch(API_BASE_URL + normalizedPath, requestOptions);
			const contentType = response.headers.get("content-type") || "";
			let payload = null;
			let rawBody = "";

			if (contentType.includes("application/json")) {
				try {
					payload = await response.json();
				} catch {
					payload = null;
				}
			} else {
				try {
					rawBody = await response.text();
				} catch {
					rawBody = "";
				}
			}

			if (!response.ok) {
				const serverMessage = payload && (payload.message || payload.error) ? payload.message || payload.error : rawBody;
				const message = serverMessage || ("HTTP " + response.status + " " + response.statusText + " at " + API_BASE_URL + normalizedPath);
				const requestError = new Error(message);
				requestError.status = response.status;
				throw requestError;
			}

			if (payload !== null) return payload;
			if (rawBody) return { message: rawBody };
			return null;
		} catch (error) {
			if (error instanceof TypeError) {
				throw new Error("Cannot reach backend at " + API_BASE_URL + ". Check if Spring Boot is running and CORS is enabled.");
			}
			throw error;
		}
	}

	async function apiWithFallback(paths, options) {
		let lastError = new Error("Request failed");
		const uniquePaths = Array.from(new Set((paths || []).map(normalizePath)));
		if (!uniquePaths.length) {
			throw lastError;
		}
		for (let i = 0; i < uniquePaths.length; i += 1) {
			try {
				return await api(uniquePaths[i], options);
			} catch (error) {
				lastError = error;
				const statusCode = error && typeof error.status === "number" ? error.status : 0;
				const tryNext = statusCode === 403 || statusCode === 404 || statusCode === 405;
				if (!tryNext || i === uniquePaths.length - 1) {
					throw lastError;
				}
			}
		}
		throw lastError;
	}

	function normalizeTask(task) {
		const status = (task.status || "PENDING").toUpperCase();
		return {
			id: task.id,
			title: task.title || "Untitled task",
			description: task.description || "",
			status: status,
			done: status === "COMPLETED",
			createdAt: task.createdAt ? new Date(task.createdAt).getTime() : Date.now()
		};
	}

	function toUser(payload) {
		const user = payload.user || payload;
		return {
			id: user.id,
			name: user.name || "User",
			email: user.email || ""
		};
	}

	function statusToClass(status) {
		return String(status || "PENDING").toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
	}

	function statusToBadgeClass(status) {
		if (status === "COMPLETED") return "text-bg-success";
		if (status === "IN_PROGRESS") return "text-bg-warning";
		return "text-bg-secondary";
	}

	function initRegisterPage() {
		const form = document.getElementById("registerForm");
		if (!form) return;

		const message = document.getElementById("registerMessage");

		form.addEventListener("submit", async function (event) {
			event.preventDefault();

			const name = form.name.value.trim();
			const email = form.email.value.trim().toLowerCase();
			const password = form.password.value;
			const confirmPassword = form.confirmPassword.value;

			if (!name || !email || !password || !confirmPassword) {
				showStatus(message, "Please complete all fields.", "error");
				return;
			}
			if (!isStrongPassword(password)) {
				showStatus(message, "Password must be 8+ chars and include letters and numbers.", "error");
				return;
			}
			if (password !== confirmPassword) {
				showStatus(message, "Passwords do not match.", "error");
				return;
			}

			try {
				const payload = await apiWithFallback(["/auth/register", "/api/auth/register"], {
					method: "POST",
					headers: authHeaders({ "Content-Type": "application/json" }),
					body: JSON.stringify({ name: name, email: email, password: password })
				});
				setAuth({ token: payload && payload.token ? payload.token : null, user: toUser(payload || {}) });
				showStatus(message, "Account created. Redirecting...", "success");
				setTimeout(function () {
					window.location.href = "task.html";
				}, 700);
			} catch (error) {
				showStatus(message, error.message || "Registration failed.", "error");
			}
		});
	}

	function initLoginPage() {
		const form = document.getElementById("loginForm");
		if (!form) return;

		const authState = getAuth();
		if (authState && (authState.token || authState.user)) {
			window.location.href = "task.html";
			return;
		}

		const message = document.getElementById("loginMessage");

		form.addEventListener("submit", async function (event) {
			event.preventDefault();

			const email = form.email.value.trim().toLowerCase();
			const password = form.password.value;

			try {
				const payload = await apiWithFallback(["/auth/login", "/api/auth/login"], {
					method: "POST",
					headers: authHeaders({ "Content-Type": "application/json" }),
					body: JSON.stringify({ email: email, password: password })
				});

				if (!payload) {
					showStatus(message, "Invalid login response from backend.", "error");
					return;
				}

				setAuth({ token: payload.token || null, user: toUser(payload) });
				showStatus(message, "Login successful. Redirecting...", "success");
				setTimeout(function () {
					window.location.href = "task.html";
				}, 500);
			} catch (error) {
				showStatus(message, error.message || "Invalid email or password.", "error");
			}
		});
	}

	function initTaskPage() {
		const form = document.getElementById("taskForm");
		if (!form) return;

		const authState = getAuth();
		if (!authState || !authState.user) {
			window.location.href = "login.html";
			return;
		}

		const welcome = document.getElementById("welcomeUser");
		const list = document.getElementById("taskList");
		const message = document.getElementById("taskMessage");
		const counter = document.getElementById("taskCounter");
		const logoutBtn = document.getElementById("logoutBtn");

		let activeTasks = [];

		if (welcome) {
			welcome.textContent = "Signed in as " + authState.user.name;
		}

		function renderTasks() {
			const tasks = activeTasks.slice();
			list.innerHTML = "";
			const doneCount = tasks.filter(function (task) {
				return task.done;
			}).length;
			counter.textContent = doneCount + " / " + tasks.length + " completed";

			if (!tasks.length) {
				const empty = document.createElement("li");
				empty.className = "list-group-item text-center py-4";
				empty.innerHTML = "<div><strong>No tasks yet</strong><p class=\"text-muted small mb-0\">Add one above to begin.</p></div>";
				list.appendChild(empty);
				return;
			}

			tasks
				.sort(function (a, b) {
					return b.createdAt - a.createdAt;
				})
				.forEach(function (task) {
					const item = document.createElement("li");
					item.className = "list-group-item d-flex align-items-start gap-3";
					if (task.done) {
						item.classList.add("list-group-item-success");
					}

					const descriptionText = task.description || "No description";
					const checkbox = document.createElement("input");
					checkbox.type = "checkbox";
					checkbox.checked = task.done;
					checkbox.className = "form-check-input mt-1";
					checkbox.setAttribute("aria-label", "Complete task");
					checkbox.dataset.action = "toggle";
					checkbox.dataset.id = String(task.id);

					const textWrap = document.createElement("div");
					textWrap.className = "flex-grow-1";
					const title = document.createElement("strong");
					title.textContent = task.title;
					title.className = "d-block";
					if (task.done) {
						title.classList.add("text-decoration-line-through");
					}
					const meta = document.createElement("p");
					meta.className = "text-muted small mb-0";
					meta.textContent = descriptionText;
					textWrap.appendChild(title);
					textWrap.appendChild(meta);

					const pill = document.createElement("span");
					pill.className = "badge rounded-pill " + statusToBadgeClass(task.status);
					if (task.status === "IN_PROGRESS") {
						pill.classList.add("text-dark");
					}
					pill.textContent = task.status;

					const deleteBtn = document.createElement("button");
					deleteBtn.className = "btn btn-sm btn-outline-danger";
					deleteBtn.type = "button";
					deleteBtn.dataset.action = "delete";
					deleteBtn.dataset.id = String(task.id);
					deleteBtn.textContent = "Delete";

					item.appendChild(checkbox);
					item.appendChild(textWrap);
					item.appendChild(pill);
					item.appendChild(deleteBtn);

					list.appendChild(item);
				});
		}

		async function loadTasks() {
			try {
				const payload = await apiWithFallback(["/tasks", "/api/tasks"], {
					method: "GET",
					headers: authHeaders()
				});
				const listPayload = Array.isArray(payload) ? payload : Array.isArray(payload && payload.tasks) ? payload.tasks : [];
				activeTasks = listPayload.map(normalizeTask);
				renderTasks();
			} catch (error) {
				if ((error.message || "").toLowerCase().includes("401") || (error.message || "").toLowerCase().includes("unauthorized")) {
					clearAuth();
					window.location.href = "login.html";
					return;
				}
				showStatus(message, error.message || "Unable to load tasks.", "error");
			}
		}

		form.addEventListener("submit", async function (event) {
			event.preventDefault();

			const title = form.title.value.trim();
			const description = form.description.value.trim();
			const status = form.status.value;

			if (!title || !description || !status) {
				showStatus(message, "Title, description, and status are required.", "error");
				return;
			}

			try {
				await apiWithFallback(["/tasks", "/api/tasks"], {
					method: "POST",
					headers: authHeaders({ "Content-Type": "application/json" }),
					body: JSON.stringify({ title: title, description: description, status: status })
				});

				form.reset();
				form.status.value = "PENDING";
				showStatus(message, "Task added.", "success");
				await loadTasks();
			} catch (error) {
				showStatus(message, error.message || "Could not create task.", "error");
			}
		});

		list.addEventListener("click", async function (event) {
			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				return;
			}

			const taskId = Number(target.dataset.id);
			const action = target.dataset.action;
			if (!taskId || !action) {
				return;
			}

			const task = activeTasks.find(function (entry) {
				return entry.id === taskId;
			});
			if (!task) {
				return;
			}

			if (action === "delete") {
				try {
					await apiWithFallback(["/tasks/" + taskId, "/api/tasks/" + taskId], {
						method: "DELETE",
						headers: authHeaders()
					});
					await loadTasks();
				} catch (error) {
					showStatus(message, error.message || "Could not delete task.", "error");
				}
				return;
			}

			if (action === "toggle") {
				const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
				try {
					await apiWithFallback(["/tasks/" + taskId, "/api/tasks/" + taskId], {
						method: "PATCH",
						headers: authHeaders({ "Content-Type": "application/json" }),
						body: JSON.stringify({ status: nextStatus })
					});
					await loadTasks();
				} catch (error) {
					showStatus(message, error.message || "Could not update task.", "error");
				}
			}
		});

		logoutBtn.addEventListener("click", function () {
			clearAuth();
			window.location.href = "login.html";
		});

		loadTasks();
	}

	initRegisterPage();
	initLoginPage();
	initTaskPage();
})();

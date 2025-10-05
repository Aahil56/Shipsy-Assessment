const apiBase = '';

// Theme Management
function initTheme() {
	const savedTheme = localStorage.getItem('theme') || 'dark';
	document.documentElement.setAttribute('data-theme', savedTheme);
	updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
	const icon = document.getElementById('themeIcon');
	const text = document.getElementById('themeText');
	if (icon && text) {
		if (theme === 'dark') {
			icon.textContent = '☀️';
			text.textContent = 'Light';
		} else {
			icon.textContent = '🌙';
			text.textContent = 'Dark';
		}
	}
}

function toggleTheme() {
	const current = document.documentElement.getAttribute('data-theme') || 'dark';
	const next = current === 'light' ? 'dark' : 'light';
	document.documentElement.setAttribute('data-theme', next);
	localStorage.setItem('theme', next);
	updateThemeButton(next);
}

// Initialize theme on load
initTheme();

// Add theme toggle listener
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
	themeToggle.addEventListener('click', toggleTheme);
}

function getAuthHeaders() {
	const token = localStorage.getItem('token');
	return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function api(path, options = {}) {
	const res = await fetch(apiBase + path, { ...options, headers: { ...getAuthHeaders(), ...(options.headers || {}) } });
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.message || 'Request failed');
	return data;
}

function showMessage(element, text, type = 'error') {
	element.textContent = text;
	element.className = `message ${type}`;
	element.style.display = text ? 'block' : 'none';
}

// Auth page logic
if (document.getElementById('loginForm')) {
	const loginForm = document.getElementById('loginForm');
	const registerForm = document.getElementById('registerForm');
	const message = document.getElementById('authMessage');

	loginForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const btn = e.target.querySelector('button[type="submit"]');
		btn.disabled = true;
		btn.textContent = 'Logging in...';
		message.textContent = '';
		message.style.display = 'none';
		
		try {
			const email = document.getElementById('loginEmail').value.trim();
			const password = document.getElementById('loginPassword').value;
			const { token } = await api('/api/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email, password }),
			});
			localStorage.setItem('token', token);
			showMessage(message, 'Login successful! Redirecting...', 'success');
			setTimeout(() => window.location.href = '/tasks', 500);
		} catch (err) {
			showMessage(message, err.message, 'error');
			btn.disabled = false;
			btn.textContent = 'Login';
		}
	});

	registerForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const btn = e.target.querySelector('button[type="submit"]');
		btn.disabled = true;
		btn.textContent = 'Creating Account...';
		message.textContent = '';
		message.style.display = 'none';
		
		try {
			const name = document.getElementById('registerName').value.trim();
			const email = document.getElementById('registerEmail').value.trim();
			const password = document.getElementById('registerPassword').value;
			const { token } = await api('/api/auth/register', {
				method: 'POST',
				body: JSON.stringify({ name, email, password }),
			});
			localStorage.setItem('token', token);
			showMessage(message, 'Account created! Redirecting...', 'success');
			setTimeout(() => window.location.href = '/tasks', 500);
		} catch (err) {
			showMessage(message, err.message, 'error');
			btn.disabled = false;
			btn.textContent = 'Create Account';
		}
	});
}

// Tasks page logic
if (document.getElementById('taskForm')) {
	let currentPage = 1;
	let currentStatus = '';
	let currentSearch = '';
	const tasksBody = document.getElementById('tasksBody');
	const pagination = document.getElementById('pagination');
	const message = document.getElementById('tasksMessage');
	const emptyState = document.getElementById('emptyState');
	const addTaskSection = document.getElementById('addTaskSection');
	const taskCount = document.getElementById('taskCount');

	// Toggle Add Task Form
	document.getElementById('showAddTaskBtn')?.addEventListener('click', () => {
		addTaskSection.style.display = 'block';
		addTaskSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	});

	document.getElementById('closeAddTaskBtn')?.addEventListener('click', () => {
		addTaskSection.style.display = 'none';
	});

	document.getElementById('cancelAddTaskBtn')?.addEventListener('click', () => {
		addTaskSection.style.display = 'none';
		document.getElementById('taskForm').reset();
	});

	document.getElementById('logoutBtn').addEventListener('click', () => {
		localStorage.removeItem('token');
		window.location.href = '/';
	});

	document.getElementById('clearFilters')?.addEventListener('click', () => {
		document.getElementById('filterStatus').value = '';
		document.getElementById('search').value = '';
		currentStatus = '';
		currentSearch = '';
		currentPage = 1;
		loadTasks();
	});

	// Enable Enter key for search
	document.getElementById('search')?.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			document.getElementById('applyFilters').click();
		}
	});

	async function loadTasks() {
		message.textContent = '';
		message.style.display = 'none';
		try {
			const params = new URLSearchParams({ page: String(currentPage), limit: '5' });
			if (currentStatus) params.append('status', currentStatus);
			if (currentSearch) params.append('search', currentSearch);
			const { tasks, total, page, limit } = await api(`/api/tasks?${params.toString()}`);
			renderTasks(tasks);
			renderPagination(total, page, limit);
			
			// Update task count
			if (taskCount) {
				const filterText = currentStatus || currentSearch ? ' (filtered)' : '';
				taskCount.textContent = `${total} task${total !== 1 ? 's' : ''}${filterText}`;
			}
			
			// Show/hide empty state
			if (tasks.length === 0) {
				tasksBody.parentElement.style.display = 'none';
				emptyState.style.display = 'block';
			} else {
				tasksBody.parentElement.style.display = 'table';
				emptyState.style.display = 'none';
			}
		} catch (err) {
			showMessage(message, err.message, 'error');
		}
	}

	function renderTasks(tasks) {
		tasksBody.innerHTML = '';
		tasks.forEach((t) => {
			const tr = document.createElement('tr');
			const efficiencyValue = t.efficiency?.toFixed ? t.efficiency.toFixed(2) : t.efficiency;
			const efficiencyClass = efficiencyValue >= 100 ? 'success' : efficiencyValue >= 80 ? 'warning' : 'danger';
			
			tr.innerHTML = `
				<td><input data-id="${t._id}" class="edit-title" value="${escapeHtml(t.title)}"/></td>
				<td>
					<select data-id="${t._id}" class="edit-status">
						<option ${t.status==='Pending'?'selected':''}>Pending</option>
						<option ${t.status==='In Progress'?'selected':''}>In Progress</option>
						<option ${t.status==='Done'?'selected':''}>Done</option>
					</select>
				</td>
				<td><input type="checkbox" data-id="${t._id}" class="edit-completed" ${t.isCompleted?'checked':''}/></td>
				<td><input type="number" data-id="${t._id}" class="edit-est" value="${t.estimatedHours}" min="0" step="0.1"/></td>
				<td><input type="number" data-id="${t._id}" class="edit-act" value="${t.actualHours}" min="0" step="0.1"/></td>
				<td><span style="font-weight: 600; color: var(--${efficiencyClass})">${efficiencyValue}%</span></td>
				<td>
					<button data-id="${t._id}" class="save-btn btn-success">💾 Save</button>
					<button data-id="${t._id}" class="delete-btn btn-danger">🗑️ Delete</button>
				</td>`;
			tasksBody.appendChild(tr);
		});
	}

	function renderPagination(total, page, limit) {
		pagination.innerHTML = '';
		const pages = Math.max(1, Math.ceil(total / limit));
		for (let p = 1; p <= pages; p++) {
			const btn = document.createElement('button');
			btn.textContent = String(p);
			if (p === page) btn.disabled = true;
			btn.addEventListener('click', () => { currentPage = p; loadTasks(); });
			pagination.appendChild(btn);
		}
	}

	document.getElementById('applyFilters').addEventListener('click', () => {
		currentStatus = document.getElementById('filterStatus').value;
		currentSearch = document.getElementById('search').value.trim();
		currentPage = 1;
		loadTasks();
	});

	document.getElementById('taskForm').addEventListener('submit', async (e) => {
		e.preventDefault();
		const btn = e.target.querySelector('button[type="submit"]');
		const originalText = btn.textContent;
		btn.disabled = true;
		btn.textContent = '⏳ Adding...';
		
		try {
			const payload = {
				title: document.getElementById('title').value.trim(),
				estimatedHours: Number(document.getElementById('estimatedHours').value),
				actualHours: Number(document.getElementById('actualHours').value),
				status: document.getElementById('status').value,
				isCompleted: document.getElementById('status').value === 'Done',
			};
			await api('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
			(e.target).reset();
			addTaskSection.style.display = 'none';
			showMessage(message, '✅ Task added successfully!', 'success');
			setTimeout(() => { message.style.display = 'none'; }, 3000);
			loadTasks();
		} catch (err) {
			showMessage(message, err.message, 'error');
		} finally {
			btn.disabled = false;
			btn.textContent = originalText;
		}
	});

	tasksBody.addEventListener('click', async (e) => {
		const target = e.target;
		if (target.classList.contains('delete-btn')) {
			if (!confirm('Are you sure you want to delete this task?')) return;
			const id = target.getAttribute('data-id');
			target.disabled = true;
			target.textContent = '⏳';
			try { 
				await api(`/api/tasks/${id}`, { method: 'DELETE' }); 
				showMessage(message, 'Task deleted successfully!', 'success');
				setTimeout(() => { message.style.display = 'none'; }, 3000);
				loadTasks(); 
			} catch (err) { 
				showMessage(message, err.message, 'error');
				target.disabled = false;
				target.textContent = '🗑️ Delete';
			}
		}
		if (target.classList.contains('save-btn')) {
			const id = target.getAttribute('data-id');
			const row = target.closest('tr');
			target.disabled = true;
			target.textContent = '⏳ Saving...';
			try {
				const payload = {
					title: row.querySelector('.edit-title').value.trim(),
					status: row.querySelector('.edit-status').value,
					isCompleted: row.querySelector('.edit-completed').checked,
					estimatedHours: Number(row.querySelector('.edit-est').value),
					actualHours: Number(row.querySelector('.edit-act').value),
				};
				await api(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
				showMessage(message, 'Task updated successfully!', 'success');
				setTimeout(() => { message.style.display = 'none'; }, 3000);
				loadTasks();
			} catch (err) {
				showMessage(message, err.message, 'error');
				target.disabled = false;
				target.textContent = '💾 Save';
			}
		}
	});

	function escapeHtml(s) {
		return s.replace(/[&<>"]+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
	}

	loadTasks();
}



/**
 * auth.js — Login and Registration logic
 */

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}

// Toggle between login and register forms
function showRegister() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('registerSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
}

// Login handler
document.getElementById('loginForm').addEventListener('submit', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errorDiv.classList.add('hidden');

    try {
        const data = await apiPost('/api/auth/login', { email, password });

        // Store auth data
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('fullName', data.fullName);
        localStorage.setItem('userId', data.userId);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (err) {
        errorDiv.textContent = err.message || 'Login failed. Please check your credentials.';
        errorDiv.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
});

// Register handler
document.getElementById('registerForm').addEventListener('submit', async () => {
    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const errorDiv = document.getElementById('registerError');
    const btn = document.getElementById('registerBtn');

    if (!fullName || !username || !email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.remove('hidden');
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating account...';
    errorDiv.classList.add('hidden');

    try {
        const data = await apiPost('/api/auth/register', { fullName, username, email, password });

        // Store auth data
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('fullName', data.fullName);
        localStorage.setItem('userId', data.userId);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (err) {
        errorDiv.textContent = err.message || 'Registration failed. Please try again.';
        errorDiv.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
});

/**
 * api.js — Central API wrapper with JWT authentication
 * All HTTP requests go through these functions.
 */

const API_BASE = '';  // Same origin (Spring Boot serves frontend)

/**
 * GET request with JWT token
 */
async function apiGet(endpoint) {
    const token = localStorage.getItem('token');
    const response = await fetch(API_BASE + endpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * POST request with JWT token
 */
async function apiPost(endpoint, body) {
    const token = localStorage.getItem('token');
    const response = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { info: 'ℹ️', warning: '⚠️', error: '🚨', success: '✅' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;

    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

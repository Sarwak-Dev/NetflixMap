"use strict";
// frontend/src/app.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// --- Elementos del DOM ---
const mapElement = document.getElementById('map');
const authSection = document.getElementById('auth-section');
const userInfoSection = document.getElementById('user-info-section');
const authForm = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const loginForm = document.getElementById('login-form');
const submitBtn = document.getElementById('submit-btn');
const authMessage = document.getElementById('auth-message');
const showLoginBtn = document.getElementById('show-login-btn');
const showRegisterBtn = document.getElementById('show-register-btn');
const logoutBtn = document.getElementById('logout-btn');
const welcomeMessage = document.getElementById('welcome-message');
const favoritesList = document.getElementById('favorites-list');
const favoritesSection = document.getElementById('favorites-section');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
// --- Variables globales ---
let token = null;
let username = null;
let map = null;
// --- Funciones de la API ---
function apiCall(endpoint_1, method_1) {
    return __awaiter(this, arguments, void 0, function* (endpoint, method, body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const options = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = yield fetch(`http://localhost:4000${endpoint}`, options);
        return response;
    });
}
function fetchShows() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!map)
            return;
        try {
            const response = yield apiCall('/api/shows', 'GET');
            const shows = yield response.json();
            shows.forEach((show) => {
                if (show.country) {
                    L.marker([0, 0]).addTo(map).bindPopup(show.title);
                }
            });
        }
        catch (error) {
            console.error('Error fetching shows:', error);
        }
    });
}
function fetchFavorites() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token || !favoritesList)
            return;
        try {
            const response = yield apiCall('/api/favorites', 'GET');
            const favorites = yield response.json();
            favoritesList.innerHTML = '';
            favorites.forEach((fav) => {
                const li = document.createElement('li');
                li.textContent = fav.movie_title;
                favoritesList.appendChild(li);
            });
        }
        catch (error) {
            console.error('Error fetching favorites:', error);
        }
    });
}
function addFavorite(title) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token)
            return;
        try {
            yield apiCall('/api/favorites', 'POST', { movieTitle: title });
            yield fetchFavorites();
        }
        catch (error) {
            console.error('Error adding favorite:', error);
        }
    });
}
// --- Lógica de UI y eventos ---
function updateUI() {
    // Validar que los elementos existen antes de usarlos
    if (!authSection || !userInfoSection || !authForm || !welcomeMessage || !favoritesSection) {
        console.error("No se encontraron todos los elementos del DOM.");
        return;
    }
    if (token) {
        authSection.style.display = 'none';
        userInfoSection.style.display = 'block';
        authForm.style.display = 'none';
        favoritesSection.style.display = 'block';
        welcomeMessage.textContent = `Welcome, ${username}!`;
        fetchFavorites();
    }
    else {
        authSection.style.display = 'block';
        userInfoSection.style.display = 'none';
        favoritesSection.style.display = 'none';
    }
}
if (showLoginBtn && authForm && formTitle && submitBtn && loginForm) {
    showLoginBtn.addEventListener('click', () => {
        authForm.style.display = 'block';
        formTitle.textContent = 'Log in';
        submitBtn.textContent = 'Log in';
        loginForm.dataset.mode = 'login';
    });
}
if (showRegisterBtn && authForm && formTitle && submitBtn && loginForm) {
    showRegisterBtn.addEventListener('click', () => {
        authForm.style.display = 'block';
        formTitle.textContent = 'Sign up';
        submitBtn.textContent = 'Sign up';
        loginForm.dataset.mode = 'register';
    });
}
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        token = null;
        username = null;
        updateUI();
    });
}
if (loginForm && usernameInput && passwordInput && authMessage) {
    loginForm.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const mode = loginForm.dataset.mode;
        const endpoint = mode === 'login' ? '/api/login' : '/api/register';
        try {
            const response = yield apiCall(endpoint, 'POST', {
                username: usernameInput.value,
                password: passwordInput.value
            });
            if (mode === 'login' && response.ok) {
                const data = yield response.json();
                token = data.token;
                username = usernameInput.value;
                // Asegúrate de que los valores no sean nulos antes de guardarlos.
                if (token && username) {
                    localStorage.setItem('token', token);
                    localStorage.setItem('username', username);
                }
                updateUI();
            }
            else if (mode === 'register' && response.ok) {
                authMessage.textContent = 'Registration successful! You can now log in.';
                authMessage.style.color = 'green';
            }
            else {
                const message = yield response.text();
                authMessage.textContent = `Error: ${message}`;
                authMessage.style.color = 'red';
            }
        }
        catch (error) {
            authMessage.textContent = 'An error occurred. Please try again.';
            authMessage.style.color = 'red';
        }
    }));
}
// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Validar que el elemento del mapa existe
    if (mapElement) {
        map = L.map(mapElement).setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
    else {
        console.error("No se encontró el elemento del mapa.");
    }
    token = localStorage.getItem('token');
    username = localStorage.getItem('username');
    updateUI();
    fetchShows();
});

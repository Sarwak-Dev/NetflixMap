// frontend/src/app.ts


// --- Elementos del DOM ---
const mapElement = document.getElementById('map');
const authSection = document.getElementById('auth-section');
const userInfoSection = document.getElementById('user-info-section');
const authForm = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const loginForm = document.getElementById('login-form') as HTMLFormElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const authMessage = document.getElementById('auth-message');
const showLoginBtn = document.getElementById('show-login-btn');
const showRegisterBtn = document.getElementById('show-register-btn');
const logoutBtn = document.getElementById('logout-btn');
const welcomeMessage = document.getElementById('welcome-message');
const favoritesList = document.getElementById('favorites-list');
const favoritesSection = document.getElementById('favorites-section');
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;

// --- Variables globales ---
let token: string | null = null;
let username: string | null = null;
let map: L.Map | null = null;

// --- Funciones de la API ---
async function apiCall(endpoint: string, method: string, body: any = null) {
    const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`http://localhost:4000${endpoint}`, options);
    return response;
}

async function fetchShows() {
    if (!map) return;
    try {
        const response = await apiCall('/api/shows', 'GET');
        const shows = await response.json();
        shows.forEach((show: any) => {
            if (show.country) {
                L.marker([0, 0]).addTo(map!).bindPopup(show.title);
            }
        });
    } catch (error) {
        console.error('Error fetching shows:', error);
    }
}

async function fetchFavorites() {
    if (!token || !favoritesList) return;
    try {
        const response = await apiCall('/api/favorites', 'GET');
        const favorites = await response.json();
        favoritesList.innerHTML = '';
        favorites.forEach((fav: any) => {
            const li = document.createElement('li');
            li.textContent = fav.movie_title;
            favoritesList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
    }
}

async function addFavorite(title: string) {
    if (!token) return;
    try {
        await apiCall('/api/favorites', 'POST', { movieTitle: title });
        await fetchFavorites();
    } catch (error) {
        console.error('Error adding favorite:', error);
    }
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
    } else {
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
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = loginForm.dataset.mode;
        
        const endpoint = mode === 'login' ? '/api/login' : '/api/register';
        
        try {
            const response = await apiCall(endpoint, 'POST', { 
                username: usernameInput.value, 
                password: passwordInput.value 
            });

            if (mode === 'login' && response.ok) {
                const data = await response.json();
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
            } else {
                const message = await response.text();
                authMessage.textContent = `Error: ${message}`;
                authMessage.style.color = 'red';
            }
        } catch (error) {
            authMessage.textContent = 'An error occurred. Please try again.';
            authMessage.style.color = 'red';
        }
    });
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Validar que el elemento del mapa existe
    if (mapElement) {
        map = L.map(mapElement).setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } else {
        console.error("No se encontró el elemento del mapa.");
    }
    
    token = localStorage.getItem('token');
    username = localStorage.getItem('username');
    updateUI();
    fetchShows();
});
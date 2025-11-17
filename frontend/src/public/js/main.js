// URL base de tu API (backend)
const API_URL = 'http://127.0.0.1:5000/api';

// Referencias a elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerMessage = document.getElementById('registerMessage');
const authButtons = document.getElementById('auth-buttons');
const logoutButton = document.getElementById('logout-button');
const welcomeMessage = document.getElementById('welcome-message');
const mapButton = document.getElementById('map-button');
const graficoButton = document.getElementById('grafico-button');

// --- Función para cambiar a Login desde Registro ---
function switchToLogin(event) {
    event.preventDefault();
    const loginTabButton = document.getElementById('login-tab');
    if(loginTabButton) {
        // Necesitamos una instancia de la pestaña de Bootstrap para mostrarla
        new bootstrap.Tab(loginTabButton).show();
    }
}

// --- 1. LÓGICA DE REGISTRO ---
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault(); 
      
      const username = document.getElementById('registerUsername').value;
      const password = document.getElementById('registerPassword').value;
      registerMessage.style.display = 'none';

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();

        if (response.ok) {
          registerMessage.textContent = data.message + ". Ahora puedes iniciar sesión.";
          registerMessage.className = 'text-success mb-3';
          registerMessage.style.display = 'block';
          registerForm.reset(); 
        } else {
          registerMessage.style.display = 'block';
          
          if (data.error === "El nombre de usuario ya existe") {
              registerMessage.innerHTML = `${data.error}. 
                  <a href="#" class="text-white" onclick="switchToLogin(event)">
                      ¿Iniciar sesión?
                  </a>`;
              document.getElementById('loginUsername').value = username;

          } else {
              registerMessage.textContent = data.error;
          }
          registerMessage.className = 'text-danger mb-3';
        }
      } catch (error) {
        registerMessage.textContent = 'Error de conexión con el servidor.';
        registerMessage.className = 'text-danger mb-3';
        registerMessage.style.display = 'block';
      }
    });
}

// --- 2. LÓGICA DE LOGIN ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;
      loginError.style.display = 'none';

      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('netflix_token', data.access_token);
          localStorage.setItem('netflix_user', username);
          
          const modalInst = bootstrap.Modal.getInstance(document.getElementById('authModal'));
          if (modalInst) {
            modalInst.hide();
          }

          updateUI(username); 
        
        } else {
          loginError.textContent = data.error;
          loginError.style.display = 'block';
        }
      } catch (error) {
        loginError.textContent = 'Error de conexión con el servidor.';
        loginError.style.display = 'block';
      }
    });
}

// --- 3. LÓGICA DE NAVEGACIÓN PROTEGIDA ---
if (mapButton) {
    mapButton.addEventListener('click', () => {
      navigateTo('pages/map.html');
    });
}
if (graficoButton) {
    graficoButton.addEventListener('click', () => {
      navigateTo('pages/grafico.html');
    });
}

function navigateTo(page) {
  const token = localStorage.getItem('netflix_token');
  if (token) {
    window.location.href = page;
  } else {
    // Asegúrate de que loginError exista antes de usarlo
    if(loginError) {
        loginError.textContent = 'Debes iniciar sesión para ver esta página.';
        loginError.style.display = 'block';
    }
    
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    const loginTabButton = document.getElementById('login-tab');
    
    if (loginTabButton) {
        new bootstrap.Tab(loginTabButton).show(); 
    }
    authModal.show(); 
  }
}

// --- 4. LÓGICA DE LOGOUT ---
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('netflix_token');
      localStorage.removeItem('netflix_user');
      updateUI(null);
    });
}

// --- 5. FUNCIÓN DE ACTUALIZAR UI ---
function updateUI(username) {
  // Asegurarse de que los elementos existan antes de manipularlos
  if (authButtons && logoutButton && welcomeMessage) {
      if (username) {
        // Estado "Conectado"
        authButtons.classList.remove('d-flex');
        authButtons.classList.add('d-none');
        
        logoutButton.classList.remove('d-none');
        welcomeMessage.classList.remove('d-none');
        
        welcomeMessage.textContent = `Bienvenido, ${username}`;
      } else {
        // Estado "Desconectado"
        authButtons.classList.add('d-flex');
        authButtons.classList.remove('d-none');
        
        logoutButton.classList.add('d-none');
        welcomeMessage.classList.add('d-none');
      }
  }
}

// --- 6. CHEQUEAR ESTADO AL CARGAR LA PÁGINA ---
// Usamos DOMContentLoaded para asegurarnos de que todo el HTML esté listo
document.addEventListener('DOMContentLoaded', () => {
  const storedUser = localStorage.getItem('netflix_user');
  const storedToken = localStorage.getItem('netflix_token');
  
  if (storedUser && storedToken) {
    updateUI(storedUser); 
  } else {
    localStorage.removeItem('netflix_token');
    localStorage.removeItem('netflix_user');
    updateUI(null); 
  }

  // --- SCRIPT PARA CONTROLAR PESTAÑAS DEL MODAL ---
  // Debe estar dentro de DOMContentLoaded para encontrar el modal
  const authModal = document.getElementById('authModal');
  if (authModal) {
      authModal.addEventListener('show.bs.modal', event => {
          const button = event.relatedTarget;
          const tabToActivate = button.getAttribute('data-auth-tab'); 
          
          if (tabToActivate) {
              const tabButton = document.getElementById(`${tabToActivate}-tab`);
              if (tabButton) {
                  new bootstrap.Tab(tabButton).show();
              }
          }
      });
  }
});
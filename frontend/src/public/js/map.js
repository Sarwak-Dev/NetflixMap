// URL base de tu API (backend)
const BACKEND_URL = 'http://127.0.0.1:5000/api';

/**
 * Función Ayudante: Realiza un fetch a un endpoint protegido.
 */
async function fetchProtectedData(endpoint) {
  const token = localStorage.getItem('netflix_token');

  if (!token) {
    throw new Error('No hay token de autenticación. Inicia sesión.');
  }

  const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401 || response.status === 422) {
    throw new Error('Token inválido o expirado. Por favor, inicia sesión de nuevo.');
  }
  
  if (!response.ok) {
    let errorJson = {};
    try {
        errorJson = await response.json();
    } catch (e) {
        throw new Error(`HTTP error! Estado: ${response.status}. Respuesta no es JSON.`);
    }
    const errorMsg = errorJson.error || JSON.stringify(errorJson);
    throw new Error(`HTTP error! Estado: ${response.status}. Respuesta: ${errorMsg}`);
  }
  
  return await response.json();
}

// --- ¡MAPA DE TRADUCCIÓN DE NOMBRES PRE-LLENADO! ---
// (Nombre del Mapa GeoJSON : Nombre en tu CSV)
const countryNameMap = {
    "United States of America": "United States",
    "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
    "Russian Federation": "Russia",
    "Republic of Korea": "South Korea", // Mapa GeoJSON usa el nombre formal
    "Korea, Republic of": "South Korea", // Otra variante común
    "Dem. Rep. Korea": "North Korea", // Nombre del mapa para Corea del Norte
    "Lao People's Democratic Republic": "Laos",
    "Syrian Arab Republic": "Syria",
    "Iran (Islamic Republic of)": "Iran",
    "Czech Rep.": "Czechia", // El mapa puede usar 'Czech Rep.'
    "Czechia": "Czech Republic", // O el CSV puede usar 'Czech Republic' (ajusta según tu CSV)
    "Taiwan, Province of China": "Taiwan",
    "Viet Nam": "Vietnam",
    "Dem. Rep. Congo": "Democratic Republic of the Congo",
    "Congo": "Republic of the Congo", // Asegúrate de diferenciar los dos Congos
    "Tanzania, United Republic of": "Tanzania"
    // Añade más aquí si los descubres con el console.log
};

/**
 * ¡NUEVA! Función que "traduce" el nombre del mapa.
 * @param {string} mapName El nombre del país que viene del GeoJSON
 * @returns {string} El nombre corregido que espera el CSV/API
 */
function normalizeCountryName(mapName) {
    // Si el nombre del mapa existe en nuestro mapa de traducción,
    // devuelve la traducción.
    if (countryNameMap[mapName]) {
        return countryNameMap[mapName];
    }
    // Si no, devuelve el nombre original (asumimos que coincide).
    return mapName;
}

// --- FAVORITOS EN LOCALSTORAGE ---

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('netflix_favorites') || '[]');
  } catch (e) {
    return [];
  }
}

function saveFavorites(favs) {
  localStorage.setItem('netflix_favorites', JSON.stringify(favs));
}

function isFavorite(favs, favId) {
  return favs.some(f => f.id === favId);
}

// Esperamos a que todo el HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Inicializar Mapa ---
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 6,
      minZoom: 1,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const infoPanel = document.getElementById('country-info');
    let geoLayer; 

        // --- Mostrar TODOS los favoritos del usuario actual ---
    function showAllFavorites() {
        const favs = getFavoritesForCurrentUser();

        let html = `<h2>Mis favoritos</h2>`;

        if (!favs || favs.length === 0) {
            html += `<p>No tienes títulos marcados como favoritos todavía.</p>`;
            infoPanel.innerHTML = html;
            return;
        }

        html += `<div class="info-row"><strong>Total de favoritos:</strong> ${favs.length}</div>`;

        // Agrupar por país
        const byCountry = {};
        favs.forEach(f => {
            const c = f.country || 'Sin país';
            if (!byCountry[c]) byCountry[c] = [];
            byCountry[c].push(f);
        });

        html += `<div class="favorites-list">`;
        Object.keys(byCountry).sort().forEach(country => {
            html += `<h3 style="margin-top:0.8rem;">${country}</h3>`;
            html += `<ul class="title-list">`;
            byCountry[country].forEach(f => {
                const parts = [];
                if (f.year) parts.push(f.year);
                if (f.type) parts.push(f.type);
                if (f.rating) parts.push(f.rating);
                const extra = parts.length ? ` (${parts.join(', ')})` : '';
                html += `<li>${f.title || 'Sin título'}${extra}</li>`;
            });
            html += `</ul>`;
        });
        html += `</div>`;

        infoPanel.innerHTML = html;
    }


// --- 2. Lógica de Clic en País ---
async function handleCountryClick(countryName) {
    // Da feedback inmediato al usuario
    infoPanel.innerHTML = `<h2>Cargando datos para ${countryName}...</h2>`;
    
    try {
        const encodedCountry = encodeURIComponent(countryName);
        const data = await fetchProtectedData(`titles-by-country?country=${encodedCountry}`);

        if (!data || data.length === 0) {
          infoPanel.innerHTML = `
            <h2>${countryName}</h2>
            <p>No hay títulos en el dataset para este país.</p>
          `;
          return;
        }

        const rows = data; 
        const years = rows
          .map(r => parseInt(r['release_year'], 10))
          .filter(y => !isNaN(y));

        const minYear = years.length ? Math.min(...years) : null;
        const maxYear = years.length ? Math.max(...years) : null;

        const typeCounts = rows.reduce(
          (acc, r) => {
            const t = (r['type'] || '').trim();
            if (!t) return acc;
            acc[t] = (acc[t] || 0) + 1;
            return acc;
          },
          {}
        );

        const allTitles = rows;

        const uniqueTypes = [...new Set(
          allTitles
            .map(r => (r['type'] || '').trim())
            .filter(Boolean)
        )];

        // 🟡 Favoritos del usuario actual (localStorage)
        let userFavs = getFavoritesForCurrentUser();

        function isFavId(favId) {
          return isFavoriteForCurrentUser(userFavs, favId);
        }

        // --- HTML base ---
        let html = `
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h2 class="mb-0">${countryName}</h2>
            <button type="button" id="showAllFavoritesBtn" class="btn btn-outline-light btn-sm">
              Ver todos mis favoritos
            </button>
          </div>
        `;
        html += `<div class="info-row"><strong>Títulos encontrados:</strong> ${allTitles.length}</div>`;


        if (minYear && maxYear) {
          html += `<div class="info-row"><strong>Rango de años:</strong> ${minYear} – ${maxYear}</div>`;
        }

        if (Object.keys(typeCounts).length > 0) {
          html += `<div class="info-row"><strong>Por tipo:</strong> `;
          html += Object.entries(typeCounts)
            .map(([t, c]) => `${t}: ${c}`)
            .join(' | ');
          html += `</div>`;
        }

        // --- Controles de filtro ---
        let typeOptions = `<option value="">Todos</option>`;
        typeOptions += `<option value="__favorites__">Favoritos</option>`;
        uniqueTypes.forEach(t => {
          typeOptions += `<option value="${t}">${t}</option>`;
        });

        html += `
          <div class="info-row" style="margin-top:0.8rem;">
            <label for="titleFilter"><strong>Filtrar por título:</strong></label>
            <input type="text" id="titleFilter" class="form-control form-control-sm" placeholder="Escribe parte del título...">
          </div>
          <div class="info-row" style="margin-top:0.4rem;">
            <label for="typeFilter"><strong>Mostrar:</strong></label>
            <select id="typeFilter" class="form-select form-select-sm">
              ${typeOptions}
            </select>
          </div>
        `;

        // --- Lista de títulos + botón de favoritos ---
        html += `<h3 style="margin-top:0.8rem;">Títulos</h3>`;
        html += `<ul class="title-list" id="titlesList">`;

        allTitles.forEach(r => {
          const title = r['title'] || 'Sin título';
          const type = (r['type'] || '').trim();
          const year = r['release_year'] || '';
          const rating = r['rating'] || '';

          // ID estable del favorito
          const favId = encodeURIComponent(
            `${countryName}|${title}|${type}|${year}`
          );

          const isFav = isFavId(favId);
          const star = isFav ? '★' : '☆';

          html += `
            <li 
              data-title="${(title || '').toLowerCase()}" 
              data-type="${type}"
              data-fav-id="${favId}"
              data-country="${countryName}"
              data-year="${year}"
              data-rating="${rating}"
              data-raw-title="${title}"
              data-is-fav="${isFav ? 'true' : 'false'}"
            >
              <button type="button" class="fav-btn btn btn-sm ${isFav ? 'btn-warning' : 'btn-outline-warning'}" style="margin-right:0.4rem;">
                ${star}
              </button>
              ${title} ${year ? `(${year}` : ''}${type ? `${year ? ', ' : '('}${type}` : ''}${rating ? `, ${rating}` : ''}${(year || type || rating) ? ')' : ''}
            </li>`;
        });

        html += `</ul>`;

        infoPanel.innerHTML = html;

        // Botón para ver todos los favoritos de todos los países
        const allFavsBtn = document.getElementById('showAllFavoritesBtn');
        if (allFavsBtn) {
          allFavsBtn.addEventListener('click', showAllFavorites);
        }

        // --- Lógica de filtros (incluye opción "Favoritos") ---
        const titleFilterInput = document.getElementById('titleFilter');
        const typeFilterSelect = document.getElementById('typeFilter');
        const listItems = infoPanel.querySelectorAll('#titlesList li');

        function applyFilters() {
          const text = (titleFilterInput.value || '').toLowerCase();
          const selectedType = typeFilterSelect.value;

          listItems.forEach(li => {
            const liTitle = li.getAttribute('data-title') || '';
            const liType = li.getAttribute('data-type') || '';
            const liIsFav = li.getAttribute('data-is-fav') === 'true';

            const matchesText = !text || liTitle.includes(text);

            let matchesType = true;
            if (selectedType === '__favorites__') {
              matchesType = liIsFav;
            } else if (selectedType) {
              matchesType = liType === selectedType;
            }

            li.style.display = (matchesText && matchesType) ? '' : 'none';
          });
        }

        titleFilterInput.addEventListener('input', applyFilters);
        typeFilterSelect.addEventListener('change', applyFilters);

        // --- Lógica de favoritos (localStorage por usuario) ---
        const favButtons = infoPanel.querySelectorAll('.fav-btn');

        favButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const li = btn.closest('li');
            const favId = li.getAttribute('data-fav-id');
            const country = li.getAttribute('data-country');
            const year = li.getAttribute('data-year');
            const rating = li.getAttribute('data-rating');
            const rawTitle = li.getAttribute('data-raw-title');
            const type = li.getAttribute('data-type');
            const isFavNow = li.getAttribute('data-is-fav') === 'true';

            // Cargamos de nuevo por si algo cambió
            let favs = getFavoritesForCurrentUser();

            if (isFavNow) {
              // Quitar de favoritos
              favs = favs.filter(f => f.id !== favId);
              li.setAttribute('data-is-fav', 'false');
              btn.textContent = '☆';
              btn.classList.remove('btn-warning');
              btn.classList.add('btn-outline-warning');
            } else {
              // Agregar a favoritos
              const newFav = {
                id: favId,
                country,
                title: rawTitle,
                type,
                year,
                rating
              };
              favs.push(newFav);
              li.setAttribute('data-is-fav', 'true');
              btn.textContent = '★';
              btn.classList.remove('btn-outline-warning');
              btn.classList.add('btn-warning');
            }

            saveFavoritesForCurrentUser(favs);
            userFavs = favs; // actualizar cache
            applyFilters();  // por si estás en el filtro "Favoritos"
          });
        });

    } catch (error) {
        console.error('Error fetching country data:', error);
        
        let errorMessage = error.message;
        let redirect = false;

        if (error.message.includes('Token inválido') || error.message.includes('No hay token')) {
            errorMessage = `<strong>Error de Autenticación:</strong> ${error.message}<br>
                          Verifica que hayas iniciado sesión. Serás redirigido a la página de inicio en 5 segundos.`;
            redirect = true;
        } else {
            errorMessage = `<strong>Error del Servidor:</strong> ${error.message}<br>
                          Revisa la consola del servidor de Flask.`;
        }

        infoPanel.innerHTML = `<div class="alert alert-danger m-2">${errorMessage}</div>`;

        if (redirect) {
            localStorage.removeItem('netflix_token');
            localStorage.removeItem('netflix_user');
            setTimeout(() => { window.location.href = '../index.html'; }, 5000);
        }
    }
}




    // --- 3. Cargar Mapa GeoJSON ---
    async function loadWorldLayer() {
      try {
        const response = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json');
        if (!response.ok) {
          throw new Error('No se pudo cargar el GeoJSON de países');
        }
        const geojson = await response.json();

        function style(feature) {
          return {
            weight: 1,
            color: '#888',
            fillColor: '#555',
            fillOpacity: 0.4
          };
        }

        function highlightStyle(feature) {
          return {
            weight: 2,
            color: '#E50914', // Color de acento
            fillColor: '#E50914',
            fillOpacity: 0.5
          };
        }

        function resetHighlight(e) {
          geoLayer.resetStyle(e.target);
        }

        function onEachFeature(feature, layer) {
          const name = feature.properties && feature.properties.name
            ? feature.properties.name
            : 'País';

          layer.on({
            mouseover: function (e) {
              const l = e.target;
              l.setStyle(highlightStyle(feature));
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                l.bringToFront();
              }
            },
            mouseout: resetHighlight,
            click: function (e) {
              
              const countryNameFromMap = e.target.feature.properties.name;
              
              // --- ¡NUEVO! LÍNEA DE DEBUG ---
              // (La dejamos por si necesitas añadir más países al mapa)
              console.log("Clickeaste el país del mapa:", countryNameFromMap);
              
              // --- ¡LÓGICA MEJORADA! ---
              // Llama a la función de traducción/normalización
              const countryNameForAPI = normalizeCountryName(countryNameFromMap);
              
              // Llama al manejador con el nombre CORREGIDO
              handleCountryClick(countryNameForAPI);
            }
          });
        }

        geoLayer = L.geoJSON(geojson, {
          style: style,
          onEachFeature: onEachFeature
        }).addTo(map);

      } catch (err) {
        console.error(err);
        infoPanel.innerHTML += `
          <p style="margin-top:1rem;color:#ff8080;">
            No se pudo cargar el mapa de países. Revisa tu conexión a internet.
          </p>
        `;
      }
    }

    // --- 4. Flujo Principal ---
    
    // Carga el mapa
    loadWorldLayer();
    
// --- FAVORITOS POR USUARIO (LOCALSTORAGE) ---

function getCurrentUserKey() {
  // Supongo que en el login guardas algo así:
  // localStorage.setItem('netflix_user', JSON.stringify({ email, username, id, ... }))
  try {
    const raw = localStorage.getItem('netflix_user');
    if (!raw) return 'anon';

    const user = JSON.parse(raw);
    return (
      user.email ||
      user.username ||
      user.id ||
      'anon'
    );
  } catch (e) {
    return 'anon';
  }
}

function getFavoritesForCurrentUser() {
  const userKey = getCurrentUserKey();
  const storageKey = `netflix_favorites_${userKey}`;
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch (e) {
    return [];
  }
}

function saveFavoritesForCurrentUser(favs) {
  const userKey = getCurrentUserKey();
  const storageKey = `netflix_favorites_${userKey}`;
  localStorage.setItem(storageKey, JSON.stringify(favs));
}

function isFavoriteForCurrentUser(favs, favId) {
  return favs.some(f => f.id === favId);
}


    // Asigna el evento al botón de logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('netflix_token');
        localStorage.removeItem('netflix_user');
        // Asumiendo que map.html está en 'pages/', subimos un nivel
        window.location.href = '../index.html'; 
    });
    
}); // <-- Fin del 'DOMContentLoaded'
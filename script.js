// URLs de Google Sheets (CSV)
const MEDALS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Pri9HhHGipD08e847iUKruXPLzG9tWki3N5rQPu2cMw/export?format=csv&gid=0';

let allMedals = []; // cache para filtros en index

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('medallasList')) {
        loadMedals();
        setupSearch();      // autocompletado de usuarios
        setupMedalFilters(); // buscador + checkboxes de rareza
    }
    if (document.getElementById('userMedals')) {
        loadUserProfile();
    }
});

// --- Utilidades ---
function norm(s) {
    return (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quitar acentos
        .trim();
}

// Parser robusto CSV (comillas, comas internas)
function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            currentValue += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentValue);
            currentValue = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentValue || currentRow.length > 0) {
                currentRow.push(currentValue);
                rows.push(currentRow);
                currentRow = [];
                currentValue = '';
            }
        } else {
            currentValue += char;
        }
    }
    if (currentValue || currentRow.length > 0) {
        currentRow.push(currentValue);
        rows.push(currentRow);
    }

    // limpiar headers/valores (trim)
    const headers = rows.shift().map(h => h.trim());
    return rows.map(row => {
        const obj = {};
        row.forEach((val, i) => {
            const key = headers[i] || `col${i}`;
            obj[key] = (val ?? '').trim();
        });
        return obj;
    });
}

// --- Index: cargar y renderizar medallas ---
function loadMedals() {
    fetch(MEDALS_SHEET_URL)
        .then(res => res.text())
        .then(csv => {
            allMedals = parseCSV(csv);
            renderMedals();
        })
        .catch(err => console.error("Error cargando medallas:", err));
}

function setupMedalFilters() {
    const medalInput = document.getElementById('searchMedal');
    const rarityCbs = document.querySelectorAll('.rareza-filter input');

    if (medalInput) medalInput.addEventListener('input', renderMedals);
    rarityCbs.forEach(cb => cb.addEventListener('change', renderMedals));
}

function renderMedals() {
    const container = document.getElementById('medallasList');
    if (!container) return;

    const searchTerm = norm(document.getElementById('searchMedal')?.value || '');
    const selectedRarities = Array.from(document.querySelectorAll('.rareza-filter input:checked'))
        .map(cb => cb.value.toUpperCase().trim());

    container.innerHTML = "";

    allMedals
        .filter(m => {
            // filtro por texto: que el nombre EMPIECE por lo escrito (insensible a acentos/mayúsculas)
            const name = norm(m.Nombre);
            return searchTerm === '' || name.startsWith(searchTerm);
        })
        .filter(m => {
            // filtro por rareza (limpia espacios)
            const r = (m.Rareza || '').toUpperCase().trim();
            return selectedRarities.length === 0 || selectedRarities.includes(r);
        })
        .forEach(medalla => {
            const div = document.createElement('div');
            div.className = `medalla ${medalla.Rareza.trim()}`;
            div.innerHTML = `
                <img src="${medalla.ImagenURL}" alt="${medalla.Nombre}">
                <div>
                    <h2>${medalla.Nombre}</h2>
                    <p>${medalla.Descripción}</p>
                </div>
            `;
            container.appendChild(div);
        });
}

// --- Index: autocompletado de usuarios ---
function setupSearch() {
    const input = document.getElementById('searchUser');
    const listContainer = document.getElementById('autocompleteList');
    if (!input || !listContainer) return;

    fetch(USERS_SHEET_URL)
        .then(res => res.text())
        .then(csv => {
            const users = parseCSV(csv);

            input.addEventListener('input', () => {
                const term = norm(input.value);
                listContainer.innerHTML = "";
                if (!term) return;

                const matches = users.filter(u => norm(u.NombreUsuario).includes(term));
                matches.forEach(user => {
                    const div = document.createElement('div');
                    div.textContent = user.NombreUsuario;
                    div.addEventListener('click', () => {
                        window.location.href = `perfil.html?user=${encodeURIComponent(user.NombreUsuario)}`;
                    });
                    listContainer.appendChild(div);
                });
            });

            input.addEventListener('keypress', e => {
                if (e.key === 'Enter') {
                    const term = norm(input.value);
                    const found = users.find(u => norm(u.NombreUsuario) === term);
                    if (found) {
                        window.location.href = `perfil.html?user=${encodeURIComponent(found.NombreUsuario)}`;
                    } else if (input.value.trim()) {
                        // si no es match exacto, navega con lo escrito (perfil hace match insensible)
                        window.location.href = `perfil.html?user=${encodeURIComponent(input.value.trim())}`;
                    }
                }
            });
        })
        .catch(err => console.error("Error cargando usuarios:", err));
}

// --- Perfil de usuario ---
function loadUserProfile() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');

    fetch(USERS_SHEET_URL)
        .then(res => res.text())
        .then(csv => {
            const users = parseCSV(csv);
            const currentUser = users.find(u => norm(u.NombreUsuario) === norm(user));

            if (!currentUser) {
                document.getElementById('username').textContent = "Usuario no encontrado";
                return;
            }

            document.getElementById('username').textContent = currentUser.NombreUsuario;
            const avatarEl = document.getElementById('avatar');
            if (avatarEl) avatarEl.src = currentUser.AvatarURL;

            fetch(MEDALS_SHEET_URL)
                .then(res => res.text())
                .then(medalCsv => {
                    const medals = parseCSV(medalCsv);
                    const container = document.getElementById('userMedals');
                    container.innerHTML = "";

                    const obtainedIds = (currentUser.MedallasObtenidas || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);

                    const obtainedMedals = medals.filter(m => obtainedIds.includes(m.ID));

                    // Total de medallas
                    const totalEl = document.getElementById('totalMedals');
                    if (totalEl) totalEl.textContent = `MEDALLAS TOTALES: ${obtainedMedals.length}`;

                    // Conteo por rareza
                    const rarityOrder = ["S", "R", "SR", "SSR", "UR"];
                    const rarityCount = { S: 0, R: 0, SR: 0, SSR: 0, UR: 0 };

                    obtainedMedals.forEach(m => {
                        const r = (m.Rareza || '').toUpperCase().trim();
                        if (rarityCount[r] !== undefined) rarityCount[r]++;
                    });

                    const rarityEl = document.getElementById('rarityCount');
                    if (rarityEl) {
                        rarityEl.textContent = rarityOrder.map(r => `${r}: ${rarityCount[r] || 0}`).join("  ");
                    }

                    // Lista de medallas (grid en 3 columnas gracias al CSS)
                    obtainedMedals.forEach(medalla => {
                        const div = document.createElement('div');
                        div.className = `medalla ${medalla.Rareza.trim()}`;
                        div.innerHTML = `
                            <img src="${medalla.ImagenURL}" alt="${medalla.Nombre}">
                            <div>
                                <h2>${medalla.Nombre}</h2>
                                <p>${medalla.Descripción}</p>
                            </div>
                        `;
                        container.appendChild(div);
                    });
                })
                .catch(err => console.error("Error cargando medallas del usuario:", err));
        })
        .catch(err => console.error("Error cargando usuario:", err));
}

// URLs de tus hojas de Google Sheets (CSV)
const MEDALS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Pri9HhHGipD08e847iUKruXPLzG9tWki3N5rQPu2cMw/export?format=csv&gid=0';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('medallasList')) {
        loadMedals();
        setupSearch();
    }
    if (document.getElementById('userMedals')) {
        loadUserProfile();
    }
});

// Función para convertir CSV en array de objetos
function parseCSV(text) {
    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows.shift();
    return rows.map(row => {
        const obj = {};
        row.forEach((val, i) => {
            obj[headers[i]] = val;
        });
        return obj;
    });
}

// Cargar todas las medallas
function loadMedals() {
    fetch(MEDALS_SHEET_URL)
        .then(res => res.text())
        .then(csv => {
            const medals = parseCSV(csv);
            const container = document.getElementById('medallasList');
            container.innerHTML = "";

            medals.forEach(medalla => {
                const div = document.createElement('div');
                div.className = `medalla ${medalla.Rareza}`;
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
        .catch(err => console.error("Error cargando medallas:", err));
}

// Buscador de usuarios
function setupSearch() {
    const searchInput = document.getElementById('searchUser');
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const user = searchInput.value.trim();
            if (user) {
                window.location.href = `perfil.html?user=${encodeURIComponent(user)}`;
            }
        }
    });
}

// Cargar perfil de un usuario
function loadUserProfile() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');

    fetch(USERS_SHEET_URL)
        .then(res => res.text())
        .then(csv => {
            const users = parseCSV(csv);
            const currentUser = users.find(u => u.NombreUsuario === user);

            if (!currentUser) {
                document.getElementById('username').textContent = "Usuario no encontrado";
                return;
            }

            document.getElementById('username').textContent = currentUser.NombreUsuario;

            fetch(MEDALS_SHEET_URL)
                .then(res => res.text())
                .then(medalCsv => {
                    const medals = parseCSV(medalCsv);
                    const container = document.getElementById('userMedals');
                    container.innerHTML = "";

                    const obtainedIds = currentUser.MedallasObtenidas.split(",");

                    medals
                        .filter(m => obtainedIds.includes(m.ID))
                        .forEach(medalla => {
                            const div = document.createElement('div');
                            div.className = `medalla ${medalla.Rareza}`;
                            div.innerHTML = `
                                <img src="${medalla.ImagenURL}" alt="${medalla.Nombre}">
                                <div>
                                    <h2>${medalla.Nombre}</h2>
                                    <p>${medalla.Descripción}</p>
                                </div>
                            `;
                            container.appendChild(div);
                        });
                });
        })
        .catch(err => console.error("Error cargando usuario:", err));
}

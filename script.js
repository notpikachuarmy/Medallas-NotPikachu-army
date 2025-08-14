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

function parseCSV(text) {
    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows.shift();
    return rows.map(row => {
        const obj = {};
        row.forEach((val, i) => obj[headers[i]] = val);
        return obj;
    });
}

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
        });
}

function setupSearch() {
    fetch(USERS_SHEET_URL)
        .then(res => res.text())
        .then(csv => {
            const users = parseCSV(csv);
            const searchInput = document.getElementById('searchUser');
            const listContainer = document.getElementById('autocompleteList');

            searchInput.addEventListener('input', () => {
                const term = searchInput.value.toLowerCase();
                listContainer.innerHTML = "";

                if (!term) return;

                const matches = users.filter(u => u.NombreUsuario.toLowerCase().includes(term));

                matches.forEach(user => {
                    const div = document.createElement('div');
                    div.textContent = user.NombreUsuario;
                    div.addEventListener('click', () => {
                        window.location.href = `perfil.html?user=${encodeURIComponent(user.NombreUsuario)}`;
                    });
                    listContainer.appendChild(div);
                });
            });

            searchInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') {
                    const user = searchInput.value.trim();
                    if (user) {
                        window.location.href = `perfil.html?user=${encodeURIComponent(user)}`;
                    }
                }
            });
        });
}

function loadUserProfile() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');

    fetch(USERS_SHEET_URL)
        .then(res => res.text())
        .then(csv => {
            const users = parseCSV(csv);
            const currentUser = users.find(u => u.NombreUsuario.toLowerCase() === user?.toLowerCase());

            if (!currentUser) {
                document.getElementById('username').textContent = "Usuario no encontrado";
                return;
            }

            document.getElementById('username').textContent = currentUser.NombreUsuario;
            document.getElementById('avatar').src = currentUser.AvatarURL;

            fetch(MEDALS_SHEET_URL)
                .then(res => res.text())
                .then(medalCsv => {
                    const medals = parseCSV(medalCsv);
                    const container = document.getElementById('userMedals');
                    container.innerHTML = "";

                    const obtainedIds = currentUser.MedallasObtenidas.split(",");
                    const obtainedMedals = medals.filter(m => obtainedIds.includes(m.ID));

                    // Mostrar total y rarezas
                    document.getElementById('totalMedals').textContent = `MEDALLAS TOTALES: ${obtainedMedals.length}`;

                    const rarityOrder = ["S", "R", "SR", "SSR", "UR"];
                    const rarityCount = { S: 0, R: 0, SR: 0, SSR: 0, UR: 0 };

                    obtainedMedals.forEach(m => {
                        rarityCount[m.Rareza] = (rarityCount[m.Rareza] || 0) + 1;
                    });

                    document.getElementById('rarityCount').textContent =
                        rarityOrder.map(r => `${r}: ${rarityCount[r] || 0}`).join("  ");

                    // Mostrar medallas
                    obtainedMedals.forEach(medalla => {
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
        });
}

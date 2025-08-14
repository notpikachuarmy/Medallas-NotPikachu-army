// 🔹 Enlaces a Google Sheets CSV
const MEDALS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_SHEET_URL  = 'https://docs.google.com/spreadsheets/d/1Pri9HhHGipD08e847iUKruXPLzG9tWki3N5rQPu2cMw/export?format=csv&gid=0';

let medals = [];
let users = [];

document.addEventListener('DOMContentLoaded', () => {
    Promise.all([fetchCSV(MEDALS_SHEET_URL), fetchCSV(USERS_SHEET_URL)])
        .then(([medalsData, usersData]) => {
            medals = medalsData;
            users = usersData;

            if (document.getElementById('medallasList')) initIndex();
            if (document.getElementById('userMedals')) initProfile();
        });
});

// ==== UTILIDAD: leer CSV ====
async function fetchCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim() !== '');
    const headers = lines.shift().split(',');
    return lines.map(line => {
        const values = parseCSVLine(line);
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i].trim());
        return obj;
    });
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else current += char;
    }
    result.push(current);
    return result;
}

// ==== INDEX.HTML ====
function initIndex() {
    const searchUserInput = document.getElementById('searchUser');
    const searchMedalInput = document.getElementById('searchMedal');
    const medallasList = document.getElementById('medallasList');
    const rarezaCheckboxes = document.querySelectorAll('.rareza-filter input');
    const autocompleteList = document.getElementById('autocompleteList');

    // --- Top 3 usuarios por medallas ---
    const topUsersContainer = document.createElement('div');
    topUsersContainer.id = 'topUsers';
    topUsersContainer.style.margin = '20px auto';
    topUsersContainer.style.maxWidth = '1200px';
    topUsersContainer.style.textAlign = 'center';
    document.body.insertBefore(topUsersContainer, medallasList);

    renderTopUsers();

    function renderTopUsers() {
        // Calcular cantidad total de medallas de cada usuario
        const usersWithCount = users.map(u => {
            const medCount = u.MedallasObtenidas ? u.MedallasObtenidas.split(',').length : 0;
            return {...u, medCount};
        });

        // Ordenar de mayor a menor
        usersWithCount.sort((a, b) => b.medCount - a.medCount);

        const top3 = usersWithCount.slice(0, 3);
        topUsersContainer.innerHTML = '<h2>Top 3 Usuarios con más medallas</h2>' +
            '<div style="display:flex; justify-content:center; gap:20px;">' +
            top3.map((u, i) => `
                <div style="background:#1e1e1e; padding:10px; border-radius:10px; width:150px;">
                    <p>#${i+1}</p>
                    <img src="${u.AvatarURL}" alt="${u.NombreUsuario}" style="width:80px; height:80px; border-radius:50%; margin-bottom:5px;">
                    <p>${u.NombreUsuario}</p>
                    <p>Medallas: ${u.medCount}</p>
                </div>
            `).join('') +
            '</div>';
    }

    // --- Autocomplete de usuarios ---
    searchUserInput.addEventListener('input', () => {
        const query = searchUserInput.value.toLowerCase().trim();
        autocompleteList.innerHTML = '';
        if (!query) return;

        const matches = users.filter(u => u.NombreUsuario.toLowerCase().includes(query));
        matches.forEach(u => {
            const div = document.createElement('div');
            div.textContent = u.NombreUsuario;
            div.addEventListener('click', () => {
                window.location.href = `perfil.html?user=${encodeURIComponent(u.NombreUsuario)}`;
            });
            autocompleteList.appendChild(div);
        });
    });

    searchUserInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const user = users.find(u => u.NombreUsuario.toLowerCase() === searchUserInput.value.toLowerCase());
            if (user) window.location.href = `perfil.html?user=${encodeURIComponent(user.NombreUsuario)}`;
        }
    });

    document.addEventListener('click', e => {
        if (!searchUserInput.contains(e.target)) autocompleteList.innerHTML = '';
    });

    // --- Renderizar medallas filtradas ---
    function renderFiltered() {
        const userQuery = searchUserInput.value.trim().toLowerCase();
        const medalQuery = searchMedalInput.value.trim().toLowerCase();
        const checkedRarezas = Array.from(rarezaCheckboxes)
                                    .filter(c => c.checked).map(c => c.value);

        let filteredMedals = medals.filter(m => {
            const matchesMedal = m.Nombre.toLowerCase().includes(medalQuery);
            const matchesRareza = checkedRarezas.includes(m.Rareza);
            return matchesMedal && matchesRareza;
        });

        if (userQuery) {
            const user = users.find(u => u.NombreUsuario.toLowerCase() === userQuery);
            if (user) {
                const userMedals = user.MedallasObtenidas ? user.MedallasObtenidas.split(',') : [];
                filteredMedals = filteredMedals.filter(m => userMedals.includes(m.ID));
            }
        }

        medallasList.innerHTML = '';
        filteredMedals.forEach(m => {
            const div = document.createElement('div');
            div.classList.add('medalla', m.Rareza);

            // Contador de usuarios que tienen la medalla
            const usuariosConMedalla = users.filter(u => {
                const userMedals = u.MedallasObtenidas ? u.MedallasObtenidas.split(',') : [];
                return userMedals.includes(m.ID);
            });

            div.innerHTML = `
                <img src="${m.ImagenURL}" alt="${m.Nombre}">
                <div>
                    <h2>${m.Nombre}</h2>
                    <p>${m.Descripción}</p>
                    <p>Usuarios con esta medalla: ${usuariosConMedalla.length}</p>
                </div>
            `;
            medallasList.appendChild(div);
        });
    }

    searchUserInput.addEventListener('input', renderFiltered);
    searchMedalInput.addEventListener('input', renderFiltered);
    rarezaCheckboxes.forEach(cb => cb.addEventListener('change', renderFiltered));

    renderFiltered();
}

// ==== PERFIL.HTML ====
function initProfile() {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user') || '';
    const user = users.find(u => u.NombreUsuario.toLowerCase() === userParam.toLowerCase());
    const usernameElem = document.getElementById('username');
    const userMedalsElem = document.getElementById('userMedals');

    if (!user) {
        usernameElem.textContent = 'Usuario no encontrado';
        return;
    }

    usernameElem.textContent = user.NombreUsuario;

    const avatar = document.getElementById('avatar');
    avatar.src = user.AvatarURL;
    avatar.alt = user.NombreUsuario;

    const medalsList = user.MedallasObtenidas ? user.MedallasObtenidas.split(',') : [];
    const rarityCount = {S:0,R:0,SR:0,SSR:0,UR:0};

    medalsList.forEach(mid => {
        const med = medals.find(m => m.ID === mid);
        if(med) rarityCount[med.Rareza]++;
    });

    document.getElementById('totalMedals').textContent = `Medallas totales: ${medalsList.length}`;
    document.getElementById('rarityCount').innerHTML = `
        <span class="rarity-S">S: ${rarityCount.S}</span> | 
        <span class="rarity-R">R: ${rarityCount.R}</span> | 
        <span class="rarity-SR">SR: ${rarityCount.SR}</span> | 
        <span class="rarity-SSR">SSR: ${rarityCount.SSR}</span> | 
        <span class="rarity-UR">UR: ${rarityCount.UR}</span>
    `;

    userMedalsElem.innerHTML = '';
    medalsList.forEach(mid => {
        const med = medals.find(m => m.ID === mid);
        if(med) {
            const div = document.createElement('div');
            div.classList.add('medalla', med.Rareza);
            div.innerHTML = `
                <img src="${med.ImagenURL}" alt="${med.Nombre}">
                <div>
                    <h2>${med.Nombre}</h2>
                    <p>${med.Descripción}</p>
                </div>
            `;
            userMedalsElem.appendChild(div);
        }
    });
}

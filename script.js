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

    // Autocomplete de usuarios
    const autocompleteList = document.getElementById('autocompleteList');
    searchUserInput.addEventListener('input', () => {
        const query = searchUserInput.value.toLowerCase().trim();
        autocompleteList.innerHTML = '';
        if (!query) return;

        const matches = users.filter(u => u.NombreUsuario.toLowerCase().includes(query));
        matches.forEach(u => {
            const div = document.createElement('div');
            div.textContent = u.NombreUsuario;
            div.addEventListener('click', () => {
                searchUserInput.value = u.NombreUsuario;
                autocompleteList.innerHTML = '';
                renderFiltered();
            });
            autocompleteList.appendChild(div);
        });
    });

    document.addEventListener('click', e => {
        if (!searchUserInput.contains(e.target)) autocompleteList.innerHTML = '';
    });

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

        // Si hay usuario, filtrar solo medallas que tenga
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
            div.innerHTML = `
                <img src="${m.ImagenURL}" alt="${m.Nombre}">
                <div>
                    <h2>${m.Nombre}</h2>
                    <p>${m.Descripción}</p>
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

    // Header perfil con avatar y stats
    const profileHeader = document.createElement('div');
    profileHeader.id = 'profileHeader';
    const avatar = document.createElement('img');
    avatar.src = user.AvatarURL;
    avatar.alt = user.NombreUsuario;

    const medalsList = user.MedallasObtenidas ? user.MedallasObtenidas.split(',') : [];

    const statsDiv = document.createElement('div');
    statsDiv.classList.add('stats');
    statsDiv.innerHTML = `
        <span>Medallas totales: ${medalsList.length}</span>
        <span>S: 0</span>
        <span>R: 0</span>
        <span>SR: 0</span>
        <span>SSR: 0</span>
        <span>UR: 0</span>
    `;

    profileHeader.appendChild(avatar);
    profileHeader.appendChild(statsDiv);
    userMedalsElem.parentNode.insertBefore(profileHeader, userMedalsElem);

    // Contar rarezas
    const rarezaCount = {S:0,R:0,SR:0,SSR:0,UR:0};
    medalsList.forEach(mid => {
        const med = medals.find(m => m.ID === mid);
        if(med) rarezaCount[med.Rareza]++;
    });

    statsDiv.querySelectorAll('span').forEach(span => {
        const text = span.textContent;
        if(text.startsWith('S:')) span.textContent = `S: ${rarezaCount.S}`;
        if(text.startsWith('R:')) span.textContent = `R: ${rarezaCount.R}`;
        if(text.startsWith('SR:')) span.textContent = `SR: ${rarezaCount.SR}`;
        if(text.startsWith('SSR:')) span.textContent = `SSR: ${rarezaCount.SSR}`;
        if(text.startsWith('UR:')) span.textContent = `UR: ${rarezaCount.UR}`;
    });

    // Renderizar medallas del usuario
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


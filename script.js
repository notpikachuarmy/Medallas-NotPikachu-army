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

async function fetchCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim() !== '');
    const headers = lines.shift().split(',');
    return lines.map(line => {
        const values = parseCSVLine(line);
        let obj = {};
        headers.forEach((h,i) => obj[h.trim()] = values[i].trim());
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

// ===== INDEX =====
function initIndex() {
    const searchUserInput = document.getElementById('searchUser');
    const searchMedalInput = document.getElementById('searchMedal');
    const medallasList = document.getElementById('medallasList');
    const rarezaCheckboxes = document.querySelectorAll('.rareza-filter-container input');
    const autocompleteList = document.getElementById('autocompleteList');
    const topUsersContainer = document.getElementById('topUsers');

    const top3 = users.map(u => ({ ...u, medCount: u.MedallasObtenidas ? u.MedallasObtenidas.split(',').length : 0 }))
                     .sort((a,b)=>b.medCount-a.medCount)
                     .slice(0,3);

    topUsersContainer.innerHTML = '<h2>Top 3 Usuarios con más medallas</h2>' +
        '<div class="top3-container">' +
        top3.map((u,i)=>`
            <div class="top-user">
                <p class="rank">#${i+1}</p>
                <img src="${u.AvatarURL}" alt="${u.NombreUsuario}">
                <p class="username">${u.NombreUsuario}</p>
                <p class="medcount">Medallas: ${u.medCount}</p>
            </div>
        `).join('') +
        '</div>';

    function renderMedals() {
        const searchUser = searchUserInput.value.toLowerCase();
        const searchMedal = searchMedalInput.value.toLowerCase();
        const selectedRarezas = Array.from(rarezaCheckboxes).filter(cb=>cb.checked).map(cb=>cb.value);

        let filtered = medals.filter(m => 
            m.NombreMedalla.toLowerCase().includes(searchMedal) &&
            selectedRarezas.includes(m.Rareza)
        );

        medallasList.innerHTML = filtered.map(m => `
            <div class="medalla ${m.Rareza}">
                <img src="${m.Imagen}" alt="${m.NombreMedalla}">
                <div>
                    <h2>${m.NombreMedalla}</h2>
                    <p>${m.Descripcion}</p>
                    <p>Rareza: ${m.Rareza}</p>
                </div>
            </div>
        `).join('');
    }

    searchUserInput.addEventListener('input', () => {
        autocompleteList.innerHTML = '';
        const val = searchUserInput.value.toLowerCase();
        if (!val) return;
        const matches = users.filter(u => u.NombreUsuario.toLowerCase().includes(val));
        matches.forEach(u => {
            const div = document.createElement('div');
            div.textContent = u.NombreUsuario;
            div.className = 'autocomplete-item';
            div.addEventListener('click', ()=> window.location.href = `perfil.html?user=${u.NombreUsuario}`);
            autocompleteList.appendChild(div);
        });
    });

    searchMedalInput.addEventListener('input', renderMedals);
    rarezaCheckboxes.forEach(cb => cb.addEventListener('change', renderMedals));

    renderMedals();
}

// ===== PERFIL =====
function initProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    const user = users.find(u=>u.NombreUsuario===username);
    if (!user) return;

    document.getElementById('avatar').src = user.AvatarURL;
    document.getElementById('username').textContent = user.NombreUsuario;

    const userMedalsList = user.MedallasObtenidas ? user.MedallasObtenidas.split(',') : [];
    document.getElementById('totalMedals').textContent = `Total Medallas: ${userMedalsList.length}`;

    const rarityCount = {S:0,R:0,SR:0,SSR:0,UR:0};
    userMedalsList.forEach(medName => {
        const med = medals.find(m => m.NombreMedalla===medName);
        if (med) rarityCount[med.Rareza]++;
    });

    const rcDiv = document.getElementById('rarityCount');
    rcDiv.innerHTML = Object.keys(rarityCount).map(r => `<span class="rarity-${r}">${r}: ${rarityCount[r]}</span>`).join('');

    const userMedalsDiv = document.getElementById('userMedals');
    userMedalsDiv.innerHTML = userMedalsList.map(mName=>{
        const m = medals.find(med => med.NombreMedalla===mName);
        if (!m) return '';
        return `
            <div class="medalla ${m.Rareza}">
                <img src="${m.Imagen}" alt="${m.NombreMedalla}">
                <div>
                    <h2>${m.NombreMedalla}</h2>
                    <p>${m.Descripcion}</p>
                    <p>Rareza: ${m.Rareza}</p>
                </div>
            </div>
        `;
    }).join('');
}



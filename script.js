const MEDALS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Pri9HhHGipD08e847iUKruXPLzG9tWki3N5rQPu2cMw/export?format=csv&gid=0';

let allMedals = [];
let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('medallasList')) loadMedals();
    if (document.getElementById('userMedals')) loadUserProfile();
});

// --- Parse CSV robusto ---
function parseCSV(data) {
    const pattern = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,\n]+)|)(?:,|$)/g;
    const rows = [];
    let row = [];
    let match;
    while ((match = pattern.exec(data))) {
        let value = match[1] ? match[1].replace(/""/g, '"') : (match[2] || '');
        row.push(value.trim());
        if (data[pattern.lastIndex - 1] === '\n' || pattern.lastIndex === data.length) {
            rows.push(row);
            row = [];
        }
    }
    return rows;
}

// --- Cargar medallas y usuarios ---
async function loadMedals() {
    const container = document.getElementById('medallasList');
    container.innerHTML = '<p>Cargando medallas...</p>';

    try {
        const [medalsCSV, usersCSV] = await Promise.all([fetch(MEDALS_SHEET_URL).then(r=>r.text()), fetch(USERS_SHEET_URL).then(r=>r.text())]);
        const medalRows = parseCSV(medalsCSV);
        const userRows = parseCSV(usersCSV);

        allMedals = medalRows.slice(1).map(r => ({
            id: r[0]?.trim(),
            nombre: r[1]?.trim(),
            rareza: r[2]?.trim().toUpperCase(), // S, C, R, SR, SSR, UR
            imagenURL: r[3]?.trim(),
            descripcion: r[4]?.trim()
        }));

        allUsers = userRows.slice(1).map(r => ({
            id: r[0]?.trim(),
            nombre: r[1]?.trim(),
            avatar: r[2]?.trim(),
            medallas: r[3]?.trim() ? r[3].split(',').map(x=>x.trim()) : []
        }));

        renderMedals(allMedals);
        renderTopUsers();
        setupFilters();
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Error cargando medallas</p>';
    }
}

// --- Render medallas ---
function renderMedals(medals) {
    const container = document.getElementById('medallasList');
    container.innerHTML = '';
    if (!medals.length) {
        container.innerHTML = '<p>No se encontraron medallas.</p>';
        return;
    }
    medals.forEach(m => {
        const div = document.createElement('div');
        div.className = `medalla ${m.rareza}`;
        div.innerHTML = `
            <img src="${m.imagenURL}" alt="${m.nombre}" class="medalla-img">
            <div>
                <strong>${m.nombre}</strong>
                <p>${m.descripcion}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// --- Filtros ---
function setupFilters() {
    const searchInput = document.getElementById('searchMedal');
    const raritySelect = document.getElementById('medalRarity');

    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const rarity = raritySelect.value;

        const filtered = allMedals.filter(m =>
            (!rarity || m.rareza === rarity) &&
            (!search || m.nombre.toLowerCase().includes(search))
        );

        renderMedals(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    raritySelect.addEventListener('change', applyFilters);
}

// --- Top 3 usuarios ---
function renderTopUsers() {
    const topContainer = document.getElementById('topUsersList');
    if (!topContainer) return;

    const top = allUsers.sort((a,b) => b.medallas.length - a.medallas.length).slice(0,3);
    topContainer.innerHTML = '';
    top.forEach(u => {
        const div = document.createElement('div');
        div.className = 'top-user';
        div.innerHTML = `<strong>${u.nombre}</strong> - Total: ${u.medallas.length}`;
        topContainer.appendChild(div);
    });
}

// --- Perfil de usuario ---
async function loadUserProfile() {
    const params = new URLSearchParams(window.location.search);
    const userName = params.get('user');
    if (!userName) return;

    try {
        const [medalsCSV, usersCSV] = await Promise.all([fetch(MEDALS_SHEET_URL).then(r=>r.text()), fetch(USERS_SHEET_URL).then(r=>r.text())]);
        const medalRows = parseCSV(medalsCSV);
        const userRows = parseCSV(usersCSV);

        allMedals = medalRows.slice(1).map(r => ({
            id: r[0]?.trim(),
            nombre: r[1]?.trim(),
            rareza: r[2]?.trim().toUpperCase(),
            imagenURL: r[3]?.trim(),
            descripcion: r[4]?.trim()
        }));

        allUsers = userRows.slice(1).map(r => ({
            id: r[0]?.trim(),
            nombre: r[1]?.trim(),
            avatar: r[2]?.trim(),
            medallas: r[3]?.trim() ? r[3].split(',').map(x=>x.trim()) : []
        }));

        const user = allUsers.find(u => u.nombre.toLowerCase() === userName.toLowerCase());
        if (!user) return;

        document.getElementById('username').textContent = user.nombre;
        document.getElementById('avatar').src = user.avatar;

        const container = document.getElementById('userMedals');
        container.innerHTML = '';

        const rarityOrder = ['UR','SSR','SR','R','C','S']; // de más rara a menos
        const userMedalsSorted = user.medallas
            .map(mid => allMedals.find(m=>m.id===mid))
            .filter(Boolean)
            .sort((a,b)=> rarityOrder.indexOf(a.rareza) - rarityOrder.indexOf(b.rareza));

        userMedalsSorted.forEach(m => {
            const div = document.createElement('div');
            div.className = `medalla ${m.rareza}`;
            div.innerHTML = `<img src="${m.imagenURL}" alt="${m.nombre}" class="medalla-img"><div><strong>${m.nombre}</strong></div>`;
            container.appendChild(div);
        });

    } catch(err) {
        console.error(err);
    }
}

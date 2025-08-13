const MEDALS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Pri9HhHGipD08e847iUKruXPLzG9tWki3N5rQPu2cMw/export?format=csv&gid=0';

let allMedals = [];
let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    loadMedalsAndUsers();
});

async function loadMedalsAndUsers() {
    try {
        const [medalsRes, usersRes] = await Promise.all([fetch(MEDALS_SHEET_URL), fetch(USERS_SHEET_URL)]);
        const medalsText = await medalsRes.text();
        const usersText = await usersRes.text();

        // Parse medallas
        const medalRows = medalsText.split('\n').map(r => r.split(','));
        allMedals = medalRows.slice(1).map(r => ({
            id: r[0]?.trim(),
            nombre: r[1]?.trim(),
            rareza: r[2]?.trim(),
            imagenURL: r[3]?.trim(),
            descripcion: r[4]?.trim()
        })).filter(m => m.id && m.nombre && m.imagenURL);

        // Parse usuarios
        const userRows = usersText.split('\n').map(r => r.split(','));
        allUsers = userRows.slice(1).map(r => ({
            id: r[0]?.trim(),
            nombre: r[1]?.trim(),
            avatar: r[2]?.trim(),
            medallas: r[3]?.trim().split(';').map(x => x.trim()).filter(Boolean)
        })).filter(u => u.id && u.nombre);

        if (document.getElementById('medallasList')) {
            renderMedals(allMedals);
            populateRarityFilter();
            setupFilters();
            renderTopUsers();
        }

        if (document.getElementById('userMedals')) {
            loadUserProfile();
        }

    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

// -------------------- Renderizar medallas --------------------
function renderMedals(medals) {
    const container = document.getElementById('medallasList');
    container.innerHTML = '';
    if (!medals.length) {
        container.innerHTML = '<p>No se encontraron medallas.</p>';
        return;
    }

    medals.forEach(m => {
        const div = document.createElement('div');
        div.classList.add('medalla', m.rareza);

        div.innerHTML = `
            <img src="${m.imagenURL}" alt="${m.nombre}" class="medalla-img">
            <div>
                <strong>${m.nombre}</strong>
                <p>${m.descripcion || ''}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// -------------------- Filtros --------------------
function populateRarityFilter() {
    const raritySelect = document.getElementById('medalRarity');
    const rarezas = [...new Set(allMedals.map(m => m.rareza))].sort();
    rarezas.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        raritySelect.appendChild(opt);
    });
}

function setupFilters() {
    document.getElementById('medalSearch').addEventListener('input', applyFilters);
    document.getElementById('medalRarity').addEventListener('change', applyFilters);
}

function applyFilters() {
    const search = document.getElementById('medalSearch').value.toLowerCase();
    const rarity = document.getElementById('medalRarity').value;

    const filtered = allMedals.filter(m =>
        (!rarity || m.rareza === rarity) &&
        (!search || m.nombre.toLowerCase().includes(search))
    );
    renderMedals(filtered);
}

// -------------------- Top 3 usuarios --------------------
function renderTopUsers() {
    const container = document.getElementById('topUsers');
    container.innerHTML = '';

    const sorted = allUsers.sort((a,b) => b.medallas.length - a.medallas.length).slice(0,3);
    sorted.forEach(u => {
        const div = document.createElement('div');
        div.classList.add('medalla');
        div.innerHTML = `
            <img src="${u.avatar}" alt="${u.nombre}" class="medalla-img">
            <div>
                <strong>${u.nombre}</strong>
                <p>Total medallas: ${u.medallas.length}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// -------------------- Perfil de usuario --------------------
function loadUserProfile() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user') || '';
    const user = allUsers.find(u => u.nombre.toLowerCase() === username.toLowerCase());

    if (!user) {
        document.getElementById('username').textContent = 'Usuario no encontrado';
        document.getElementById('userMedals').innerHTML = '';
        return;
    }

    document.getElementById('username').textContent = user.nombre;
    document.getElementById('userAvatar').src = user.avatar;

    const medals = user.medallas
        .map(id => allMedals.find(m => m.id === id))
        .filter(Boolean)
        .sort((a,b) => rarityValue(b.rareza) - rarityValue(a.rareza));

    const container = document.getElementById('userMedals');
    container.innerHTML = '';

    if (!medals.length) {
        container.innerHTML = '<p>Este usuario no tiene medallas.</p>';
        return;
    }

    medals.forEach(m => {
        const div = document.createElement('div');
        div.classList.add('medalla', m.rareza);
        div.innerHTML = `
            <img src="${m.imagenURL}" alt="${m.nombre}" class="medalla-img">
            <div>
                <strong>${m.nombre}</strong>
                <p>${m.descripcion || ''}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// -------------------- Helpers --------------------
function rarityValue(r) {
    const order = ['S', 'R', 'SR', 'SSR', 'UR'];
    return order.indexOf(r) !== -1 ? order.indexOf(r) : 999;
}

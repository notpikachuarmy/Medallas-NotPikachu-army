// 🔹 Enlaces a tus Google Sheets en formato CSV
const MEDALS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Pri9HhHGipD08e847iUKruXPLzG9tWki3N5rQPu2cMw/export?format=csv&gid=0';

let allMedals = [];

// 🔹 Carga inicial
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('medalsContainer')) {
        loadMedals();
    }
    if (document.getElementById('userMedals')) {
        loadUserProfile();
    }
});

// 🔹 Función para arreglar enlaces de Imgur
function fixImgurLink(url) {
    url = url.trim();
    if (!url) return '';
    if (url.includes("imgur.com/a/") || url.includes("imgur.com/gallery/")) {
        let id = url.split("/").pop();
        return `https://i.imgur.com/${id}.png`;
    }
    if (url.includes("imgur.com") && !url.includes("i.imgur.com")) {
        let id = url.split("/").pop().split(".")[0];
        return `https://i.imgur.com/${id}.png`;
    }
    return url;
}

// 🔹 Cargar todas las medallas
function loadMedals() {
    const container = document.getElementById('medalsContainer');
    container.innerHTML = '<p>Cargando medallas...</p>';

    fetch(MEDALS_SHEET_URL)
        .then(res => res.text())
        .then(data => {
            const rows = data.split('\n').map(r => r.split(','));
            allMedals = rows.slice(1).map(r => ({
                id: r[0]?.trim(),
                nombre: r[1]?.trim(),
                rareza: r[2]?.trim(),
                imagenURL: fixImgurLink(r[3]?.trim()),
                descripcion: r[4]?.trim()
            })).filter(m => m.nombre && m.imagenURL);

            container.innerHTML = '';
            createFilterControls();
            renderMedals(allMedals, container);
        })
        .catch(err => {
            console.error('Error cargando medallas:', err);
            container.innerHTML = '<p>Error cargando medallas</p>';
        });
}

// 🔹 Crear filtros y buscador
function createFilterControls() {
    if (document.getElementById('filterControls')) return;

    const container = document.getElementById('medalsContainer');

    const filterDiv = document.createElement('div');
    filterDiv.id = 'filterControls';
    filterDiv.style.marginBottom = '1rem';
    filterDiv.style.display = 'flex';
    filterDiv.style.justifyContent = 'center';
    filterDiv.style.alignItems = 'center';
    filterDiv.style.gap = '1rem';
    filterDiv.innerHTML = `
        <input type="text" id="medalSearch" placeholder="Buscar medalla...">
        <select id="medalRarity">
            <option value="">Todas las rarezas</option>
        </select>
    `;
    container.parentNode.insertBefore(filterDiv, container);

    const raritySet = new Set(allMedals.map(m => m.rareza).filter(Boolean));
    const raritySelect = filterDiv.querySelector('#medalRarity');
    raritySet.forEach(r => {
        const option = document.createElement('option');
        option.value = r;
        option.textContent = r;
        raritySelect.appendChild(option);
    });

    document.getElementById('medalSearch').addEventListener('input', applyFilters);
    document.getElementById('medalRarity').addEventListener('change', applyFilters);
}

// 🔹 Aplicar filtros
function applyFilters() {
    const search = document.getElementById('medalSearch')?.value.toLowerCase() || '';
    const rarity = document.getElementById('medalRarity')?.value || '';

    const filtered = allMedals.filter(m =>
        (!rarity || m.rareza === rarity) &&
        (!search || m.nombre.toLowerCase().includes(search))
    );

    renderMedals(filtered, document.getElementById('medalsContainer'));
}

// 🔹 Renderizar medallas
function renderMedals(medals, container) {
    container.innerHTML = '';
    if (medals.length === 0) {
        container.innerHTML = '<p>No se encontraron medallas.</p>';
        return;
    }

    medals.forEach(({nombre, rareza, imagenURL, descripcion}) => {
        const item = document.createElement('div');
        item.className = 'medalla';

        const img = document.createElement('img');
        img.src = imagenURL;
        img.alt = nombre;

        const title = document.createElement('strong');
        title.textContent = nombre;

        const desc = document.createElement('p');
        desc.textContent = descripcion || '';

        item.appendChild(img);
        item.appendChild(title);
        item.appendChild(desc);
        container.appendChild(item);
    });
}

// 🔹 Cargar perfil de usuario
function loadUserProfile() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    document.getElementById('username').textContent = user || 'Usuario';

    const container = document.getElementById('userMedals');
    container.innerHTML = '<p>Cargando medallas...</p>';

    Promise.all([
        fetch(MEDALS_SHEET_URL).then(res => res.text()),
        fetch(USERS_SHEET_URL).then(res => res.text())
    ]).then(([medalsData, usersData]) => {
        const medalRows = medalsData.split('\n').map(r => r.split(','));
        const userRows = usersData.split('\n').map(r => r.split(','));

        allMedals = medalRows.slice(1).map(r => ({
            id: r[0]?.trim(),
            nombre: r[1]?.trim(),
            rareza: r[2]?.trim(),
            imagenURL: fixImgurLink(r[3]?.trim()),
            descripcion: r[4]?.trim()
        })).filter(m => m.nombre && m.imagenURL);

        let userMedalsIDs = [];
        let userAvatar = '';

        for (let i = 1; i < userRows.length; i++) {
            const [discordID, username, avatarURL, medalsStr] = userRows[i];
            if (!username || !medalsStr) continue;
            if (username.trim().toLowerCase() === (user || '').toLowerCase()) {
                userAvatar = avatarURL?.trim() || '';
                medalsStr.split(',').forEach(medalID => userMedalsIDs.push(medalID.trim()));
            }
        }

        container.innerHTML = '';

        if (userAvatar) {
            const avatarImg = document.createElement('img');
            avatarImg.src = userAvatar;
            avatarImg.alt = user;
            avatarImg.className = 'avatar';
            container.appendChild(avatarImg);
        }

        const userMedalsList = allMedals.filter(m => userMedalsIDs.includes(m.id));
        renderMedals(userMedalsList, container);

        // Rareza select
        const raritySelect = document.getElementById('medalRarity');
        if (raritySelect) {
            const raritySet = new Set(userMedalsList.map(m => m.rareza).filter(Boolean));
            raritySelect.innerHTML = '<option value="">Todas</option>';
            raritySet.forEach(r => {
                const option = document.createElement('option');
                option.value = r;
                option.textContent = r;
                raritySelect.appendChild(option);
            });

            raritySelect.addEventListener('change', () => {
                const selectedRarity = raritySelect.value;
                const filtered = userMedalsList.filter(m => !selectedRarity || m.rareza === selectedRarity);
                renderMedals(filtered, container);
            });
        }

    }).catch(err => {
        console.error(err);
        container.innerHTML = '<p>Error cargando perfil</p>';
    });
}


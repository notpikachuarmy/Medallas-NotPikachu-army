// 🔹 Pega aquí tus enlaces de Google Sheets en formato CSV
const MEDALS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Pri9HhHGipD08e847iUKruXPLzG9tWki3N5rQPu2cMw/export?format=csv&gid=0';

let allMedals = []; // Para almacenar todas las medallas cargadas

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('medallasList')) {
        loadMedals();
    }
    if (document.getElementById('userMedals')) {
        loadUserProfile();
    }
});

// 🔹 Función para corregir enlaces de Imgur (álbumes y galerías)
function fixImgurLink(url) {
    url = url.trim();
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
    const container = document.getElementById('medallasList');
    container.innerHTML = '<p>Cargando medallas...</p>';

    fetch(MEDALS_SHEET_URL)
        .then(response => response.text())
        .then(data => {
            const rows = data.split('\n').map(row => row.split(','));
            allMedals = rows.slice(1).map(r => ({
                id: r[0]?.trim(),
                nombre: r[1]?.trim(),
                rareza: r[2]?.trim(),
                imagenURL: fixImgurLink(r[3]?.trim()),
                descripcion: r[4]?.trim()
            })).filter(m => m.nombre && m.imagenURL);

            container.innerHTML = '';

            // Crear buscador y filtro de rareza
            createFilterControls();

            renderMedals(allMedals);
        })
        .catch(error => {
            console.error('Error cargando medallas:', error);
            container.innerHTML = '<p>Error cargando medallas</p>';
        });
}

// 🔹 Crear controles de búsqueda y filtro (centrados)
function createFilterControls() {
    if (document.getElementById('filterControls')) return;

    const container = document.getElementById('medallasList');

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

// 🔹 Aplicar filtros y renderizar
function applyFilters() {
    const search = document.getElementById('medalSearch').value.toLowerCase();
    const rarity = document.getElementById('medalRarity').value;

    const filtered = allMedals.filter(m => 
        (!rarity || m.rareza === rarity) &&
        (!search || m.nombre.toLowerCase().includes(search))
    );

    renderMedals(filtered);
}

// 🔹 Renderizar medallas
function renderMedals(medals) {
    const container = document.getElementById('medallasList');
    container.innerHTML = '';
    if (medals.length === 0) {
        container.innerHTML = '<p>No se encontraron medallas.</p>';
        return;
    }

    medals.forEach(({id, nombre, rareza, imagenURL, descripcion}) => {
        const item = document.createElement('div');
        item.classList.add('medalla');
        if (rareza) item.classList.add(rareza);

        const img = document.createElement('img');
        img.src = imagenURL;
        img.alt = nombre;
        img.classList.add('medalla-img');

        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = nombre;
        const desc = document.createElement('p');
        desc.textContent = descripcion || '';

        info.appendChild(title);
        info.appendChild(desc);

        item.appendChild(img);
        item.appendChild(info);
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

        const userMedalsIDs = [];
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

        // Mostrar avatar si existe
        if (userAvatar) {
            const avatarImg = document.createElement('img');
            avatarImg.src = userAvatar;
            avatarImg.alt = user || 'Usuario';
            avatarImg.style.width = '100px';
            avatarImg.style.height = '100px';
            avatarImg.style.borderRadius = '50%';
            avatarImg.style.display = 'block';
            avatarImg.style.margin = '0 auto 1rem auto';
            container.appendChild(avatarImg);
        }

        for (let i = 1; i < medalRows.length; i++) {
            const [id, nombre, rareza, imagenURL, descripcion] = medalRows[i];
            if (!nombre || !imagenURL || !id) continue;

            if (userMedalsIDs.includes(id.trim())) {
                const item = document.createElement('div');
                item.classList.add('medalla');
                if (rareza) item.classList.add(rareza.trim());

                const img = document.createElement('img');
                img.src = fixImgurLink(imagenURL);
                img.alt = nombre;
                img.classList.add('medalla-img');

                const info = document.createElement('div');
                const title = document.createElement('strong');
                title.textContent = nombre;
                const desc = document.createElement('p');
                desc.textContent = descripcion || '';

                info.appendChild(title);
                info.appendChild(desc);

                item.appendChild(img);
                item.appendChild(info);
                container.appendChild(item);
            }
        }

        if (container.innerHTML.trim() === '') {
            container.innerHTML = '<p>Este usuario no tiene medallas.</p>';
        }
    }).catch(error => {
        console.error('Error cargando perfil:', error);
        container.innerHTML = '<p>Error cargando medallas</p>';
    });
}

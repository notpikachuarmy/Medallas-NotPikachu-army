const MEDALS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Pri9HhHGipD08e847iUKruXPLzG9tWki3N5rQPu2cMw/export?format=csv&gid=0';

let allMedals = [];
let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('topUsersList')) loadTopUsers();
    if (document.getElementById('userMedals')) loadUserProfile();
});

// 🔹 Función para arreglar enlaces de Imgur
function fixImgurLink(url) {
    url = url?.trim();
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

// 🔹 Cargar usuarios y medallas
function fetchSheets() {
    return Promise.all([
        fetch(MEDALS_SHEET_URL).then(r => r.text()),
        fetch(USERS_SHEET_URL).then(r => r.text())
    ]).then(([medalsCSV, usersCSV]) => {
        const medalRows = medalsCSV.split('\n').map(r => r.split(','));
        const userRows = usersCSV.split('\n').map(r => r.split(','));

        allMedals = medalRows.slice(1).map(r => ({
            id: r[0]?.trim(),
            nombre: r[1]?.trim(),
            rareza: r[2]?.trim(),
            imagenURL: fixImgurLink(r[3]?.trim()),
            descripcion: r[4]?.trim()
        })).filter(m => m.nombre && m.imagenURL);

        allUsers = userRows.slice(1).map(r => ({
            id: r[0]?.trim(),
            username: r[1]?.trim(),
            avatar: r[2]?.trim(),
            medals: r[3]?.split(',').map(x => x.trim()).filter(Boolean)
        }));
    });
}

// 🔹 Top 3 usuarios
function loadTopUsers() {
    fetchSheets().then(() => {
        const sorted = [...allUsers].sort((a,b) => b.medals.length - a.medals.length).slice(0,3);
        const container = document.getElementById('topUsersList');
        container.innerHTML = '';
        if (sorted.length === 0) {
            container.textContent = 'No hay usuarios.';
            return;
        }
        sorted.forEach(u => {
            const div = document.createElement('div');
            div.className = 'userCard';
            const img = document.createElement('img');
            img.src = u.avatar || '';
            img.alt = u.username;
            const name = document.createElement('p');
            name.textContent = `${u.username} (${u.medals.length})`;
            div.appendChild(img);
            div.appendChild(name);
            container.appendChild(div);
        });
    }).catch(console.error);

    document.getElementById('searchBtn').addEventListener('click', () => {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const container = document.getElementById('topUsersList');
        container.innerHTML = '';
        const found = allUsers.filter(u => u.username.toLowerCase().includes(search));
        if (found.length === 0) {
            container.textContent = 'Usuario no encontrado.';
            return;
        }
        found.forEach(u => {
            const div = document.createElement('div');
            div.className = 'userCard';
            const img = document.createElement('img');
            img.src = u.avatar || '';
            img.alt = u.username;
            const name = document.createElement('p');
            name.textContent = `${u.username} (${u.medals.length})`;
            div.appendChild(img);
            div.appendChild(name);
            container.appendChild(div);
        });
    });
}

// 🔹 Perfil de usuario
function loadUserProfile() {
    fetchSheets().then(() => {
        const params = new URLSearchParams(window.location.search);
        const username = params.get('user')?.toLowerCase();
        const user = allUsers.find(u => u.username.toLowerCase() === username);

        const container = document.getElementById('userMedals');
        const nameEl = document.getElementById('username');
        if (!user) {
            container.innerHTML = '<p>Usuario no encontrado.</p>';
            return;
        }
        nameEl.textContent = user.username;

        // Avatar
        if (user.avatar) {
            const img = document.createElement('img');
            img.src = user.avatar;
            img.className = 'avatar';
            container.parentNode.insertBefore(img, container);
        }

        // Rareza para filtro
        const rarities = [...new Set(allMedals.map(m => m.rareza).filter(Boolean))];
        const select = document.getElementById('medalRarity');
        rarities.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = r;
            select.appendChild(opt);
        });

        function renderMedals(filterRarity = '') {
            container.innerHTML = '';
            const userMedals = allMedals.filter(m => user.medals.includes(m.id) && (!filterRarity || m.rareza === filterRarity));
            if (userMedals.length === 0) container.textContent = 'No tiene medallas.';
            userMedals.forEach(m => {
                const div = document.createElement('div');
                div.className = 'medalla';
                div.innerHTML = `<img src="${m.imagenURL}" alt="${m.nombre}"><p>${m.nombre}</p>`;
                container.appendChild(div);
            });
        }

        renderMedals();
        select.addEventListener('change', e => renderMedals(e.target.value));
    }).catch(console.error);
}

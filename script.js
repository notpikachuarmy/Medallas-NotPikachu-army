// 🔹 Pega aquí tus enlaces de Google Sheets en formato CSV
const MEDALS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Pri9HhHGipD08e847iUKruXPLzG9tWki3N5rQPu2cMw/export?format=csv&gid=0';

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

    // Si es un álbum o galería
    if (url.includes("imgur.com/a/") || url.includes("imgur.com/gallery/")) {
        let id = url.split("/").pop();
        return `https://i.imgur.com/${id}.png`; // Primer imagen directa
    }

    // Si es enlace normal de imgur
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
            container.innerHTML = ''; // Limpiar

            for (let i = 1; i < rows.length; i++) {
                const [id, nombre, rareza, imagenURL, descripcion] = rows[i];
                if (!nombre || !imagenURL) continue;

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
        })
        .catch(error => {
            console.error('Error cargando medallas:', error);
            container.innerHTML = '<p>Error cargando medallas</p>';
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
        for (let i = 1; i < userRows.length; i++) {
            const [username, medalID] = userRows[i];
            if (username && medalID && username.trim().toLowerCase() === (user || '').toLowerCase()) {
                userMedalsIDs.push(medalID.trim());
            }
        }

        container.innerHTML = ''; // Limpiar

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

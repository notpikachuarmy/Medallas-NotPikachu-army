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

// 🔹 Función para arreglar enlaces de Imgur
async function fixImgurLink(url) {
    url = url.trim();

    // Si es un álbum o galería
    if ((url.includes("/a/") || url.includes("/gallery/")) && !url.includes("i.imgur.com")) {
        try {
            // Obtener el ID del álbum
            let albumId = url.split("/").pop();
            // Usamos la API pública de Imgur para obtener la primera imagen
            // Esto no requiere autenticación para la mayoría de los casos
            let apiUrl = `https://api.imgur.com/3/album/${albumId}/images`;
            // Client-ID público de ejemplo (puedes registrar uno para tu app si quieres)
            let response = await fetch(apiUrl, {
                headers: { 'Authorization': 'Client-ID 546a5a7eae564d0' }
            });
            let data = await response.json();
            if (data && data.data && data.data.length > 0) {
                return data.data[0].link; // Primera imagen del álbum
            }
        } catch (e) {
            console.error("Error cargando álbum de Imgur:", e);
            return ''; // fallback a nada
        }
    }

    // Si ya es enlace directo
    if (url.includes("imgur.com") && !url.includes("i.imgur.com")) {
        let id = url.split("/").pop().split(".")[0];
        return `https://i.imgur.com/${id}.png`;
    }

    return url;
}

// 🔹 Cargar todas las medallas
async function loadMedals() {
    const container = document.getElementById('medallasList');
    container.innerHTML = '<p>Cargando medallas...</p>';

    try {
        const data = await fetch(MEDALS_SHEET_URL).then(res => res.text());
        const rows = data.split('\n').map(row => row.split(','));
        container.innerHTML = ''; // Limpiar

        for (let i = 1; i < rows.length; i++) {
            const [id, nombre, rareza, imagenURL, descripcion] = rows[i];
            if (!nombre || !imagenURL) continue;

            const item = document.createElement('div');
            item.classList.add('medalla');
            if (rareza) item.classList.add(rareza.trim());

            const img = document.createElement('img');
            img.src = await fixImgurLink(imagenURL);
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
    } catch (error) {
        console.error('Error cargando medallas:', error);
        container.innerHTML = '<p>Error cargando medallas</p>';
    }
}

// 🔹 Cargar perfil de usuario
async function loadUserProfile() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    document.getElementById('username').textContent = user || 'Usuario';

    const container = document.getElementById('userMedals');
    container.innerHTML = '<p>Cargando medallas...</p>';

    try {
        const [medalsData, usersData] = await Promise.all([
            fetch(MEDALS_SHEET_URL).then(res => res.text()),
            fetch(USERS_SHEET_URL).then(res => res.text())
        ]);

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
                img.src = await fixImgurLink(imagenURL);
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
    } catch (error) {
        console.error('Error cargando perfil:', error);
        container.innerHTML = '<p>Error cargando medallas</p>';
    }
}

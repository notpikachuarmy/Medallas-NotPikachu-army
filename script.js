// 🔹 URLs de datos
const MEDALS_URL = 'https://docs.google.com/spreadsheets/d/1uxeXCUyWi2kLAWEGJjZ91zutr18sr7_QjHqxfPVzgCA/export?format=csv&gid=0';
const USERS_URL = 'https://docs.google.com/spreadsheets/d/TU_ID_HOJA/export?format=csv';

// 🔹 Variables globales
let allMedals = [];
let allUsers = [];
const rarityOrder = ['UR','SSR','SR','R','S'];

// 🔹 Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('userProfile')) loadUserProfile();
});

// 🔹 Parse CSV simple
function parseCSV(data) {
    const rows = [];
    const lines = data.trim().split('\n');
    for (let line of lines) {
        const cells = [];
        let current='', inQuotes=false;
        for (let char of line) {
            if (char === '"' && !inQuotes) { inQuotes=true; continue; }
            if (char === '"' && inQuotes) { inQuotes=false; continue; }
            if (char === ',' && !inQuotes) { cells.push(current); current=''; continue; }
            current+=char;
        }
        cells.push(current);
        rows.push(cells);
    }
    return rows;
}

// 🔹 Cargar perfil de usuario
async function loadUserProfile() {
    const params = new URLSearchParams(window.location.search);
    const usernameParam = params.get('user'); // nombre de usuario buscado
    const container = document.getElementById('userProfile');
    container.innerHTML = '<p>Cargando perfil...</p>';

    try {
        const [medRes, userRes] = await Promise.all([fetch(MEDALS_URL), fetch(USERS_URL)]);
        const medData = parseCSV(await medRes.text());
        const userData = parseCSV(await userRes.text());

        // Medallas
        allMedals = medData.slice(1).map(r=>({
            id: r[0]?.trim(),
            nombre: r[1]?.trim(),
            rareza: r[2]?.trim(),
            imagenURL: r[3]?.trim(),
            descripcion: r[4]?.trim()
        }));

        // Usuarios
        allUsers = userData.slice(1).map(r=>({
            DiscordID: r[0]?.trim(),
            NombreUsuario: r[1]?.trim(),
            AvatarURL: r[2]?.trim(),
            MedallasObtenidas: r[3]?.trim()
        }));

        // Buscar usuario
        const user = allUsers.find(u=>u.NombreUsuario.toLowerCase() === (usernameParam||'').toLowerCase());
        if(!user){ container.innerHTML = '<p>Usuario no encontrado.</p>'; return; }

        // Mostrar foto y nombre
        container.innerHTML = `
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
                <img src="${user.AvatarURL}" alt="${user.NombreUsuario}" width="80" height="80" style="border-radius:50%;">
                <h2>${user.NombreUsuario}</h2>
            </div>
            <h3>Medallas obtenidas:</h3>
            <div id="userMedalsContainer" style="display:flex;flex-wrap:wrap;gap:1rem;"></div>
        `;

        // Medallas del usuario
        const medalIDs = user.MedallasObtenidas.split(',').map(m=>m.trim()).filter(Boolean);
        const userMedals = allMedals.filter(m => medalIDs.includes(m.id))
                                    .sort((a,b)=>rarityOrder.indexOf(a.rareza)-rarityOrder.indexOf(b.rareza));

        const medalsContainer = document.getElementById('userMedalsContainer');
        if(userMedals.length===0){ medalsContainer.innerHTML='<p>No tiene medallas.</p>'; return; }

        userMedals.forEach(m=>{
            const div = document.createElement('div');
            div.style.textAlign = 'center';
            div.style.width = '120px';
            div.innerHTML = `
                <img src="${m.imagenURL}" alt="${m.nombre}" style="width:100px;height:100px;">
                <p style="margin:0.5rem 0 0 0;"><strong>${m.nombre}</strong></p>
            `;
            medalsContainer.appendChild(div);
        });

    } catch(err){
        console.error(err);
        container.innerHTML = '<p>Error cargando perfil.</p>';
    }
}

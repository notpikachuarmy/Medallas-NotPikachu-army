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
            generarRanking();
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
        headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : '');
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

// ==== GENERAR RANKING ====
function generarRanking() {
    const rankingElem = document.getElementById('rankingList');
    if(!rankingElem) return;

    const rarezaPuntos = {N:1, R:2, SR:3, SSR:4, UR:5};

    const ranking = users.map(u => {
        const medallasIds = u.MedallasObtenidas ? u.MedallasObtenidas.split(',').map(id => id.trim()) : [];
        const conteo = {N:0, R:0, SR:0, SSR:0, UR:0};
        let totalMedallas = 0;
        let totalPuntos = 0;

        medallasIds.forEach(mid => {
            const med = medals.find(m => m.ID === mid);
            if(med){
                const rareza = med.Rareza.trim().toUpperCase();
                if(conteo.hasOwnProperty(rareza)){
                    conteo[rareza]++;
                    totalMedallas++;
                    totalPuntos += rarezaPuntos[rareza];
                }
            }
        });

        return {...u, totalMedallas, conteo, totalPuntos};
    });

    // Ordenar por puntos y luego nombre
    ranking.sort((a, b) => b.totalPuntos - a.totalPuntos || a.NombreUsuario.localeCompare(b.NombreUsuario));

    rankingElem.innerHTML = '';
    ranking.forEach((u, index) => {
        const rarityHtml = ['N','R','SR','SSR','UR']
            .map(r => `<span class="rarity-${r}">${r}: ${u.conteo[r]}</span>`)
            .join(' ');

        const div = document.createElement('div');
        div.classList.add('ranking-item');
        div.innerHTML = `
            <div class="ranking-pos">${index + 1}</div>
            <div class="ranking-avatar">
                <img src="${u.AvatarURL}" alt="${u.NombreUsuario}">
                <a class="ranking-username" href="perfil.html?user=${encodeURIComponent(u.NombreUsuario)}">${u.NombreUsuario}</a>
            </div>
            <div class="ranking-info">
                <strong>Total medallas: ${u.totalMedallas}</strong>
                <div class="ranking-rarities">${rarityHtml}</div>
            </div>
        `;
        rankingElem.appendChild(div);
    });
}



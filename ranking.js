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

    // Procesar usuarios con conteo de rarezas
    const ranking = users.map(u => {
        const medallasIds = u.MedallasObtenidas ? u.MedallasObtenidas.split(',').map(id=>id.trim()) : [];
        const conteo = {S:0,R:0,SR:0,SSR:0,UR:0};
        let total = 0;

        medallasIds.forEach(mid => {
            const med = medals.find(m => m.ID === mid);
            if(med){
                const rareza = med.Rareza.trim().toUpperCase();
                if(conteo.hasOwnProperty(rareza)){
                    conteo[rareza]++;
                    total++;
                }
            }
        });

        return {...u, total, conteo};
    });

    // Ordenar por total de medallas (desc) y nombre
    ranking.sort((a,b) => b.total - a.total || a.NombreUsuario.localeCompare(b.NombreUsuario));

    // Renderizar
    rankingElem.innerHTML = '';
    ranking.forEach((u, index) => {
        // Aplicar color a todo el "S: 0 | R: 0" completo
        const rarityHtml = ['S','R','SR','SSR','UR'].map(r => 
            `<span class="rarity-${r}">${r}: ${u.conteo[r]}</span>`).join(' | ');

        const div = document.createElement('div');
        div.classList.add('ranking-item');
        div.innerHTML = `
            <h3>${index+1} - ${u.NombreUsuario}</h3>
            <strong>Total medallas: ${u.total}</strong><br>
            ${rarityHtml}
        `;
        rankingElem.appendChild(div);
    });
}


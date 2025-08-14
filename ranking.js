async function cargarCSV(url) {
    const resp = await fetch(url);
    const texto = await resp.text();
    const filas = texto.trim().split("\n").map(f => f.split(","));
    const headers = filas.shift();
    return filas.map(f => Object.fromEntries(headers.map((h, i) => [h.trim(), f[i] ? f[i].trim() : ""])));
}

async function generarRanking() {
    // URLs de tus CSV
    const urlMedallas = "https://docs.google.com/spreadsheets/d/e/TU_GOOGLE_SEEDS_ID/pub?gid=0&single=true&output=csv";
    const urlUsuarios = "https://docs.google.com/spreadsheets/d/e/TU_GOOGLE_SEEDS_ID/pub?gid=0&single=true&output=csv";

    const medallas = await cargarCSV(urlMedallas);
    const usuarios = await cargarCSV(urlUsuarios);

    // Rareza -> puntos
    const puntosPorRareza = { "S": 1, "R": 2, "SR": 3, "SSR": 4, "UR": 5 };

    // Calcular datos de ranking
    let ranking = usuarios.map(usuario => {
        let medallasIds = usuario.MedallasObtenidas ? usuario.MedallasObtenidas.split(",") : [];
        let conteoRarezas = { S: 0, R: 0, SR: 0, SSR: 0, UR: 0 };
        let puntos = 0;

        medallasIds.forEach(id => {
            let medalla = medallas.find(m => m.ID === id.trim());
            if (medalla) {
                conteoRarezas[medalla.Rareza] = (conteoRarezas[medalla.Rareza] || 0) + 1;
                puntos += puntosPorRareza[medalla.Rareza] || 0;
            }
        });

        return {
            nombre: usuario.NombreUsuario,
            avatar: usuario.AvatarURL,
            conteo: conteoRarezas,
            total: medallasIds.length,
            puntos: puntos
        };
    });

    // Ordenar por puntos, luego alfabético
    ranking.sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        return a.nombre.localeCompare(b.nombre);
    });

    // Renderizar
    const contenedor = document.getElementById("rankingList");
    ranking.forEach((usuario, index) => {
        let div = document.createElement("div");
        div.className = "ranking-item";
        div.innerHTML = `
            <div class="ranking-pos">${index + 1}</div>
            <div class="ranking-avatar">
                <img src="${usuario.avatar}" alt="${usuario.nombre}">
                <a href="perfil.html?usuario=${encodeURIComponent(usuario.nombre)}">${usuario.nombre}</a>
            </div>
            <div class="ranking-info">
                <strong>Total medallas: ${usuario.total}</strong>
                <span>S: ${usuario.conteo.S} | R: ${usuario.conteo.R} | SR: ${usuario.conteo.SR} | SSR: ${usuario.conteo.SSR} | UR: ${usuario.conteo.UR}</span>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

generarRanking();

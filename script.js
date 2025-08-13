// 🔹 Pega aquí tus enlaces de Google Sheets en formato CSV
const MEDALS_SHEET_URL = 'https://example.com/medals.csv';
const USERS_SHEET_URL = 'https://example.com/users.csv';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('medallasList')) {
        loadMedals();
    }
    if (document.getElementById('userMedals')) {
        loadUserProfile();
    }
});

function loadMedals() {
    // Aquí iría la carga de medallas desde Google Sheets
    const container = document.getElementById('medallasList');
    container.innerHTML = '<p>(Ejemplo) Medalla de Prueba</p>';
}

function loadUserProfile() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    document.getElementById('username').textContent = user || 'Usuario';
    const container = document.getElementById('userMedals');
    container.innerHTML = '<p>(Ejemplo) Medalla del Usuario</p>';
}

const tg = window.Telegram.WebApp;
tg.expand(); // Розгорнути на весь екран

// Перевірка на адміна
const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

if (access === 'admin_king') {
    document.getElementById('admin-menu-btn').classList.remove('hidden');
    document.getElementById('welcome-text').innerText = "ПРИВІТ, МАКСИМЕ 🦾";
}

function toggleAdminPanel() {
    document.getElementById('admin-panel').classList.toggle('hidden');
}

function closeApp() {
    tg.close();
}

function sendAdminCmd() {
    const cmd = document.getElementById('admin-input').value;
    if (cmd.toLowerCase() === 'кабінет') {
        alert("Доступ дозволено. Завантаження кабінету...");
        // Тут ми потім змінимо фон на бика за ноутом
        document.body.style.backgroundImage = "url('assets/admin_bull.jpg')";
        toggleAdminPanel();
    }
}

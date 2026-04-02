const tg = window.Telegram.WebApp;
tg.expand();

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// Перевірка: якщо Максим — показуємо Milka Bot, інакше — текст про розробку
if (access === 'admin_king') {
    document.getElementById('admin-view').classList.remove('hidden');
    document.getElementById('user-view').classList.add('hidden');
}

// ФУНКЦІЯ МЕНЮ (Тепер точно працює)
function toggleMenu() {
    const menu = document.getElementById('side-menu');
    menu.classList.toggle('active');
}

function closeApp() { tg.close(); }

// ЧАТ
function openChat() {
    toggleMenu();
    document.getElementById('chat-modal').classList.remove('hidden');
    if (document.getElementById('chat-messages').innerHTML === "") {
        appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.');
    }
}

function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    appendMsg('user', text);
    input.value = '';

    setTimeout(() => {
        if (text.toLowerCase() === 'кабінет') {
            appendMsg('bot', '✅ Доступ підтверджено. Інтерфейс власника активовано.');
            // Тут буде логіка появи кнопок керування
        } else {
            appendMsg('bot', '❌ Невідома команда.');
        }
    }, 500);
}

function appendMsg(sender, text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

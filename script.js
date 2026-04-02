const tg = window.Telegram.WebApp;
tg.expand();

// Отримуємо ключ із посилання
const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// ПЕРЕВІРКА: Показувати Milka Bot тільки якщо є ключ admin_king
if (access === 'admin_king') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
}

function closeApp() { tg.close(); }

function openChat() {
    toggleMenu();
    document.getElementById('chat-modal').classList.remove('hidden');
    if (document.getElementById('chat-messages').innerHTML.trim() === "") {
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
        } else {
            appendMsg('bot', '❌ Команду не розпізнано.');
        }
    }, 600);
}

function appendMsg(sender, text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

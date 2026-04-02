const tg = window.Telegram.WebApp;
tg.expand();

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

if (access === 'admin_king') {
    document.getElementById('admin-view').classList.remove('hidden');
    document.getElementById('user-view').classList.add('hidden');
}

function toggleMenu() {
    const menu = document.getElementById('side-menu');
    menu.classList.toggle('active');
}

function closeApp() { tg.close(); }

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
            // Тут скоро будемо писати логіку перебудови кабінету!
        } else {
            appendMsg('bot', '❌ Невідома команда.');
        }
    }, 600); // Зробив затримку трохи довшою (600мс) для реалістичності
}

function appendMsg(sender, text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

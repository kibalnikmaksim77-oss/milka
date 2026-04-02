const tg = window.Telegram.WebApp;
tg.expand();

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// Логіка доступу (Юзер або Адмін)
if (access === 'admin_king') {
    const adminSection = document.getElementById('admin-view');
    const userSection = document.getElementById('user-view');
    if (adminSection) adminSection.classList.remove('hidden');
    if (userSection) userSection.classList.add('hidden');
}

// --- ЛОГІКА ХАКЕРСЬКОГО ЗАВАНТАЖЕННЯ (БЕЗ ЦИФР, ТІЛЬКИ АНІМАЦІЯ) ---
// Використовуємо window.onload, щоб дочекатися підгрузки фотографії бика
window.addEventListener('load', () => {
    const loader = document.getElementById('loading-screen');
    const app = document.getElementById('app-container');
    
    tg.hideHeader();

    // Анімація в CSS триває рівно 3 секунди (3000 мс). 
    // Даємо ще 200 мс на фінальний спалах, і ховаємо лоадер.
    setTimeout(() => {
        loader.style.opacity = '0'; // Плавно гасне
        
        setTimeout(() => {
            loader.style.display = 'none'; // Видаляємо лоадер
            app.classList.remove('hidden'); // Показуємо чорний екран з меню
            tg.showHeader(); // Повертаємо шапку Telegram
        }, 500); // Час на затухання
        
    }, 3200); 
});

// --- ТВОЯ ОРИГІНАЛЬНА ЛОГІКА ІНТЕРФЕЙСУ ---
function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }
function closeApp() { tg.close(); }
function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

function openChat() {
    toggleMenu(); 
    document.getElementById('chat-modal').classList.remove('hidden');
    loadChatHistory();
}

// Історія чату
function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    box.innerHTML = ''; 
    let history = JSON.parse(localStorage.getItem('milka_chat')) || [];
    if (history.length === 0) {
        appendMsgDOM('bot', 'Система активна. Чекаю на команду, Максиме.');
    } else {
        history.forEach(item => appendMsgDOM(item.sender, item.text));
    }
}

function saveMsgToHistory(sender, text) {
    let history = JSON.parse(localStorage.getItem('milka_chat')) || [];
    history.push({ sender: sender, text: text });
    localStorage.setItem('milka_chat', JSON.stringify(history));
}

function appendMsgDOM(sender, text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendMsg(sender, text) {
    appendMsgDOM(sender, text);
    saveMsgToHistory(sender, text);
}

// Відправка повідомлень
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    appendMsg('user', text);
    input.value = '';

    setTimeout(() => {
        if (text.toLowerCase() === 'кабінет') {
            appendMsg('bot', '✅ Доступ підтверджено. Інтерфейс власника активовано.');
            localStorage.setItem('cabinet_active', 'true');
        } else if (text.toLowerCase() === 'очистити') {
            localStorage.removeItem('milka_chat');
            localStorage.removeItem('cabinet_active');
            document.getElementById('chat-messages').innerHTML = '';
            appendMsg('bot', '🧹 Пам\'ять терміналу очищено.');
        } else {
            appendMsg('bot', '❌ Команду не розпізнано.');
        }
    }, 600);
}

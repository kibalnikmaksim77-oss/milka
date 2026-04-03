const tg = window.Telegram.WebApp;
tg.expand();

// Отримуємо унікальний ID користувача з Telegram (або 'guest' якщо запущено з браузера)
const userId = tg.initDataUnsafe?.user?.id || 'guest';

// Створюємо унікальні "сейфи" для кожного окремого акаунта
const BG_KEY = `milka_bg_${userId}`;
const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// ПЕРЕВІРКА ДОСТУПУ:
if (access === 'admin_king') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');

    // Перевіряємо статус кабінету тільки для цього юзера
    if (localStorage.getItem(CABINET_KEY) === 'true') {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) settingsBtn.classList.remove('hidden');
    }
}

// --- ЛОГІКА КАСТОМНОГО ФОНУ (ПРИВ'ЯЗАНА ДО ЮЗЕРА) ---
const savedBg = localStorage.getItem(BG_KEY);
if (savedBg) {
    document.body.style.backgroundImage = `url('${savedBg}')`;
}

function toggleSettings() {
    document.getElementById('settings-menu').classList.toggle('hidden');
}

function triggerBgUpload() {
    document.getElementById('bg-upload').click();
    toggleSettings();
}

function changeBackground(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgUrl = e.target.result;
            document.body.style.backgroundImage = `url('${imgUrl}')`;
            // Зберігаємо фон ТІЛЬКИ для поточного акаунта
            localStorage.setItem(BG_KEY, imgUrl);
        };
        reader.readAsDataURL(file);
    }
}

function resetBackground() {
    document.body.style.backgroundImage = 'none';
    localStorage.removeItem(BG_KEY);
    toggleSettings();
}

// --- ОСНОВНА ЛОГІКА МЕНЮ ТА ЧАТУ ---
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
}

function closeApp() { tg.close(); }

function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    box.innerHTML = ''; 
    
    // Завантажуємо історію чату конкретного акаунта
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];

    if (history.length === 0) {
        appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.');
    } else {
        history.forEach(item => {
            appendMsgDOM(item.sender, item.text);
        });
    }
}

function saveMsgToHistory(sender, text) {
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    history.push({ sender: sender, text: text });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
}

function appendMsgDOM(sender, text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    
    if (text.includes('Ваш mini web app перезавантажився')) {
        div.innerHTML = (text.includes('команди користувача') ? '🔒 ' : '✅ ') + text;
    } else {
        div.innerText = text;
    }
    
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendMsg(sender, text) {
    appendMsgDOM(sender, text);
    saveMsgToHistory(sender, text);
}

function openChat() {
    toggleMenu();
    document.getElementById('chat-modal').classList.remove('hidden');
    loadChatHistory();
}

function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

// ВІДПРАВКА ПОВІДОМЛЕНЬ І ЛОГІКА ТЕРМІНАЛУ
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    appendMsg('user', text);
    input.value = '';

    setTimeout(() => {
        if (text.toLowerCase() === 'кабінет') {
            // Вмикаємо режим власника для цього конкретного акаунта
            localStorage.setItem(CABINET_KEY, 'true');
            
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) settingsBtn.classList.remove('hidden');
            
            appendMsg('bot', 'Ваш mini web app перезавантажився - там тільки ваші команди.');

        } else if (text.toLowerCase() === 'вихід') {
            // Вимикаємо режим власника
            localStorage.removeItem(CABINET_KEY);
            
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) settingsBtn.classList.add('hidden');
            document.getElementById('settings-menu').classList.add('hidden');
            
            appendMsg('bot', 'Ваш mini web app перезавантажився тепер у вас команди користувача.');

        } else if (text.toLowerCase() === 'очистити') {
            // Очищаємо пам'ять чату тільки цього юзера
            localStorage.removeItem(CHAT_KEY);
            document.getElementById('chat-messages').innerHTML = '';
            appendMsg('bot', '🧹 Пам\'ять терміналу очищено.');
            
        } else {
            appendMsg('bot', '❌ Команду не розпізнано.');
        }
    }, 600);
    }

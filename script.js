const tg = window.Telegram.WebApp;
tg.expand();

// Отримуємо ключ із посилання
const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// ПЕРЕВІРКА ДОСТУПУ:
if (access === 'admin_king') {
    // 1. Показуємо кнопку терміналу (Milka Bot)
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');

    // 2. Якщо вже вводили "кабінет", показуємо 3 крапки
    if (localStorage.getItem('cabinet_active') === 'true') {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) settingsBtn.classList.remove('hidden');
    }
}

// --- ЛОГІКА КАСТОМНОГО ФОНУ ---
const savedBg = localStorage.getItem('milka_bg');
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
            localStorage.setItem('milka_bg', imgUrl);
        };
        reader.readAsDataURL(file);
    }
}

function resetBackground() {
    document.body.style.backgroundImage = 'none';
    localStorage.removeItem('milka_bg');
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
    
    let history = JSON.parse(localStorage.getItem('milka_chat')) || [];

    if (history.length === 0) {
        appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.');
    } else {
        history.forEach(item => {
            appendMsgDOM(item.sender, item.text);
        });
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
            // Активація режиму власника
            localStorage.setItem('cabinet_active', 'true');
            
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) settingsBtn.classList.remove('hidden');
            
            appendMsg('bot', 'Ваш mini web app перезавантажився - там тільки ваші команди.');

        } else if (text.toLowerCase() === 'вихід') {
            // Деактивація режиму власника
            localStorage.removeItem('cabinet_active');
            
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) settingsBtn.classList.add('hidden');
            document.getElementById('settings-menu').classList.add('hidden');
            
            appendMsg('bot', 'Ваш mini web app перезавантажився тепер у вас команди користувача.');

        } else if (text.toLowerCase() === 'очистити') {
            localStorage.removeItem('milka_chat');
            document.getElementById('chat-messages').innerHTML = '';
            appendMsg('bot', '🧹 Пам\'ять терміналу очищено.');
            
        } else {
            appendMsg('bot', '❌ Команду не розпізнано.');
        }
    }, 600);
}

const tg = window.Telegram.WebApp;
tg.expand();

// Отримуємо унікальний ID користувача з Telegram
const userId = tg.initDataUnsafe?.user?.id || 'guest';

// Ключі для пам'яті
const BG_KEY = `milka_bg_${userId}`;
const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');
const globalBg = urlParams.get('bg'); // Отримуємо глобальний фон від бота

// ПРІОРИТЕТ ФОНУ: Глобальний (якщо є) -> Особистий
if (globalBg) {
    document.body.style.backgroundImage = `url('${globalBg}')`;
} else {
    const savedBg = localStorage.getItem(BG_KEY);
    if (savedBg) {
        document.body.style.backgroundImage = `url('${savedBg}')`;
    }
}

// ПЕРЕВІРКА ДОСТУПУ
if (access === 'admin_king') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');

    if (localStorage.getItem(CABINET_KEY) === 'true') {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) settingsBtn.classList.remove('hidden');
    }
}

function toggleSettings() {
    document.getElementById('settings-menu').classList.toggle('hidden');
}

function triggerBgUpload() {
    document.getElementById('bg-upload').click();
    toggleSettings();
}

// ФУНКЦІЯ ЗМІНИ ФОНУ (Тепер з відправкою боту)
function changeBackground(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgUrl = e.target.result;
            document.body.style.backgroundImage = `url('${imgUrl}')`;
            
            // Зберігаємо локально
            localStorage.setItem(BG_KEY, imgUrl);

            // ЯКЩО ТИ АДМІН — ПЕРЕДАЄМО ФОТО БОТУ, ЩОБ ВІН ВСТАНОВИВ ЙОГО ДЛЯ ВСІХ
            if (access === 'admin_king') {
                tg.sendData(JSON.stringify({
                    action: "set_global_bg",
                    image: imgUrl
                }));
            }
        };
        reader.readAsDataURL(file);
    }
}

function resetBackground() {
    document.body.style.backgroundImage = 'none';
    localStorage.removeItem(BG_KEY);
    toggleSettings();
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
}

function closeApp() { tg.close(); }

// Логіка чату та терміналу (залишається без змін)
function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    box.innerHTML = ''; 
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    if (history.length === 0) {
        appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.');
    } else {
        history.forEach(item => appendMsgDOM(item.sender, item.text));
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
    div.innerText = text;
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

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    appendMsg('user', text);
    input.value = '';
    setTimeout(() => {
        const lowerText = text.toLowerCase();
        if (lowerText === 'кабінет') {
            localStorage.setItem(CABINET_KEY, 'true');
            document.getElementById('settings-btn')?.classList.remove('hidden');
            appendMsg('bot', 'Ваш mini web app перезавантажився - режим власника активний.');
        } else if (lowerText === 'вихід') {
            localStorage.removeItem(CABINET_KEY);
            document.getElementById('settings-btn')?.classList.add('hidden');
            appendMsg('bot', 'Ваш mini web app перезавантажився - режим користувача.');
        } else if (lowerText === 'очистити') {
            localStorage.removeItem(CHAT_KEY);
            document.getElementById('chat-messages').innerHTML = '';
            appendMsg('bot', '🧹 Пам\'ять очищено.');
        } else {
            appendMsg('bot', '❌ Команду не розпізнано.');
        }
    }, 600);
}


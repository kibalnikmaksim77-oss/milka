const tg = window.Telegram.WebApp;
tg.expand();

// Унікальні дані юзера
const userId = tg.initDataUnsafe?.user?.id || 'guest';
const BG_KEY = `milka_bg_${userId}`;
const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// --- ☁️ ГЛОБАЛЬНА СИНХРОНІЗАЦІЯ ФОНУ ---
const DWEET_NAME = "milka-cyber-bull-global-2026";
const CLOUD_URL = `https://dweet.io/get/latest/dweet/for/${DWEET_NAME}`;

async function loadGlobalBackground() {
    try {
        // Запитуємо хмару без кешування, щоб завжди бачити свіжий фон
        const response = await fetch(CLOUD_URL, { cache: "no-store" });
        const data = await response.json();
        
        if (data && data.with && data.with.length > 0) {
            const cloudBg = data.with[0].content.bg;
            if (cloudBg && cloudBg !== 'none') {
                document.body.style.backgroundImage = `url('${cloudBg}')`;
                return; // Глобальний фон має пріоритет
            }
        }
    } catch (e) {
        console.error("Помилка хмари, перемикаюсь на локальну пам'ять:", e);
    }
    
    // Якщо хмара пуста або помилка - ставимо те, що юзер вибрав сам
    const savedBg = localStorage.getItem(BG_KEY);
    if (savedBg) document.body.style.backgroundImage = `url('${savedBg}')`;
}

// Запуск завантаження фону при старті
loadGlobalBackground();

// --- ПЕРЕВІРКА ДОСТУПУ (АДМІН-ПАНЕЛЬ) ---
if (access === 'admin_king') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');

    if (localStorage.getItem(CABINET_KEY) === 'true') {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) settingsBtn.classList.remove('hidden');
    }
}

// --- УПРАВЛІННЯ ІНТЕРФЕЙСОМ ---
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
            
            // Зберігаємо локально
            localStorage.setItem(BG_KEY, imgUrl);

            // Якщо ти адмін — Python отримає цей base64 і закине в хмару
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

function closeApp() { 
    tg.close(); 
}

// --- СИСТЕМА ЧАТУ (ТВІЙ ПОВНИЙ КОД) ---
function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    if (!box) return;
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
    if (!box) return;
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
    const chatModal = document.getElementById('chat-modal');
    if (chatModal) {
        chatModal.classList.remove('hidden');
        loadChatHistory();
    }
}

function closeChat() { 
    document.getElementById('chat-modal')?.classList.add('hidden'); 
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    
    appendMsg('user', text);
    input.value = '';
    
    setTimeout(() => {
        const lowerText = text.toLowerCase();
        if (lowerText === 'кабінет') {
            localStorage.setItem(CABINET_KEY, 'true');
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) settingsBtn.classList.remove('hidden');
            appendMsg('bot', '🔒 Доступ до кабінету власника активовано.');
        } else if (lowerText === 'вихід') {
            localStorage.removeItem(CABINET_KEY);
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) settingsBtn.classList.add('hidden');
            appendMsg('bot', '🔓 Режим користувача активовано.');
        } else if (lowerText === 'очистити') {
            localStorage.removeItem(CHAT_KEY);
            const box = document.getElementById('chat-messages');
            if (box) box.innerHTML = '';
            appendMsg('bot', '🧹 Пам\'ять чату очищена.');
        } else {
            appendMsg('bot', '❌ Системна помилка: команду не розпізнано.');
        }
    }, 600);
}

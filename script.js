const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || 'guest';

// Ключі пам'яті
const BG_KEY = `milka_bg_${userId}`;
const GLOBAL_BG_KEY = `milka_global_current`;
const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// --- ☁️ ДИНАМІЧНЕ ЗАВАНТАЖЕННЯ З ХМАРИ ---
const CLOUD_DB_URL = 'https://dweet.io/get/latest/dweet/for/milka-cyber-bull-global-bg-2026';

fetch(CLOUD_DB_URL)
    .then(response => response.json())
    .then(data => {
        if (data && data.with && data.with.length > 0) {
            const cloudBg = data.with[0].content.bg;
            if (cloudBg && cloudBg !== 'none') {
                document.body.style.backgroundImage = `url('${cloudBg}')`;
                localStorage.setItem(GLOBAL_BG_KEY, cloudBg); // Кешуємо
                return;
            }
        }
        throw new Error("No cloud data");
    })
    .catch(err => {
        // Якщо хмара недоступна, беремо останній збережений фон з пам'яті телефону
        const lastGlobal = localStorage.getItem(GLOBAL_BG_KEY);
        if (lastGlobal) {
            document.body.style.backgroundImage = `url('${lastGlobal}')`;
        } else {
            const savedBg = localStorage.getItem(BG_KEY);
            if (savedBg) document.body.style.backgroundImage = `url('${savedBg}')`;
        }
    });

// --- ПЕРЕВІРКА АДМІНА ---
if (access === 'admin_king') {
    document.getElementById('admin-view')?.classList.remove('hidden');
    if (localStorage.getItem(CABINET_KEY) === 'true') {
        document.getElementById('settings-btn')?.classList.remove('hidden');
    }
}

// --- ФУНКЦІЇ МЕНЮ ---
function toggleMenu() {
    const menu = document.getElementById('side-menu');
    if (menu) menu.classList.toggle('active');
}

function toggleSettings() {
    const sMenu = document.getElementById('settings-menu');
    if (sMenu) sMenu.classList.toggle('hidden');
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
            localStorage.setItem(BG_KEY, imgUrl);
            
            // Відправляємо боту команду оновити хмару
            if (access === 'admin_king') {
                tg.sendData(JSON.stringify({ action: "set_global_bg", image: imgUrl }));
            }
        };
        reader.readAsDataURL(file);
    }
}

function resetBackground() {
    document.body.style.backgroundImage = 'none';
    localStorage.removeItem(BG_KEY);
    localStorage.removeItem(GLOBAL_BG_KEY);
    toggleSettings();
}

function closeApp() { tg.close(); }

// --- РОБОТА ЧАТУ ---
function openChat() {
    const menu = document.getElementById('side-menu');
    const modal = document.getElementById('chat-modal');
    if (menu) menu.classList.remove('active'); 
    if (modal) {
        modal.classList.remove('hidden'); 
        loadChatHistory();
    }
}

function closeChat() {
    const modal = document.getElementById('chat-modal');
    if (modal) modal.classList.add('hidden');
}

function appendMsgDOM(sender, text) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendMsg(sender, text) {
    appendMsgDOM(sender, text);
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    history.push({ sender, text });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
}

function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    box.innerHTML = ''; 
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    if (history.length === 0) {
        appendMsgDOM('bot', 'Система Milka активна. Введіть команду...');
    } else {
        history.forEach(item => appendMsgDOM(item.sender, item.text));
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    
    appendMsg('user', text);
    input.value = '';
    
    setTimeout(() => {
        const cmd = text.toLowerCase();
        if (cmd === 'кабінет') {
            localStorage.setItem(CABINET_KEY, 'true');
            document.getElementById('settings-btn')?.classList.remove('hidden');
            appendMsg('bot', '🔒 Доступ до кабінету активовано.');
        } else if (cmd === 'вихід') {
            localStorage.removeItem(CABINET_KEY);
            document.getElementById('settings-btn')?.classList.add('hidden');
            appendMsg('bot', '🔓 Режим власника вимкнено.');
        } else if (cmd === 'очистити') {
            localStorage.removeItem(CHAT_KEY);
            document.getElementById('chat-messages').innerHTML = '';
            appendMsg('bot', '🧹 Історію очищено.');
        } else {
            appendMsg('bot', '❓ Невідома команда.');
        }
    }, 600);
}

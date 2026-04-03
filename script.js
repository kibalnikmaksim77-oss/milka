const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || 'guest';

// Ключі для пам'яті
const BG_KEY = `milka_bg_${userId}`;
const GLOBAL_BG_KEY = `milka_global_current`; // Ключ для глобального фону
const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');
const globalBgFromUrl = urlParams.get('bg');

// --- ЛОГІКА АВТО-ОНОВЛЕННЯ ФОНУ ---
if (globalBgFromUrl) {
    // Якщо прийшов новий фон в URL — ставимо його і зберігаємо як головний
    document.body.style.backgroundImage = `url('${globalBgFromUrl}')`;
    localStorage.setItem(GLOBAL_BG_KEY, globalBgFromUrl);
} else {
    // Якщо в URL фону немає, беремо останній збережений глобальний фон
    const lastGlobal = localStorage.getItem(GLOBAL_BG_KEY);
    if (lastGlobal) {
        document.body.style.backgroundImage = `url('${lastGlobal}')`;
    } else {
        // Якщо глобального немає взагалі — беремо особистий
        const savedBg = localStorage.getItem(BG_KEY);
        if (savedBg) document.body.style.backgroundImage = `url('${savedBg}')`;
    }
}

// ПЕРЕВІРКА ДОСТУПУ (Адмін)
if (access === 'admin_king') {
    document.getElementById('admin-view')?.classList.remove('hidden');
    if (localStorage.getItem(CABINET_KEY) === 'true') {
        document.getElementById('settings-btn')?.classList.remove('hidden');
    }
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
            localStorage.setItem(BG_KEY, imgUrl);

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
    localStorage.removeItem(GLOBAL_BG_KEY);
    toggleSettings();
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }
function closeApp() { tg.close(); }

// --- ЧАТ (Без змін) ---
function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    box.innerHTML = ''; 
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    history.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('msg', item.sender);
        div.innerText = item.text;
        box.appendChild(div);
    });
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    // Відображення
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', 'user');
    div.innerText = text;
    box.appendChild(div);
    
    // Збереження
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    history.push({sender: 'user', text: text});
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    
    input.value = '';
    
    setTimeout(() => {
        if (text.toLowerCase() === 'кабінет') {
            localStorage.setItem(CABINET_KEY, 'true');
            document.getElementById('settings-btn')?.classList.remove('hidden');
        }
        if (text.toLowerCase() === 'вихід') {
            localStorage.removeItem(CABINET_KEY);
            document.getElementById('settings-btn')?.classList.add('hidden');
        }
    }, 600);
        }

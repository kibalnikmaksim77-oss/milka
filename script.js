const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || 'guest';
const BG_KEY = `milka_bg_${userId}`;
const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;
const NOTES_KEY = `milka_notes_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');
const globalBg = urlParams.get('bg'); 
const encodedData = urlParams.get('cd');

let cyberPages = {};
let currentPageId = 'main';

// РОЗШИФРОВКА БАЗИ
if (encodedData) {
    try {
        cyberPages = JSON.parse(atob(encodedData));
    } catch (e) { console.error("Base64 Error"); }
}

// ПЕРЕВІРКА АДМІНКИ (З ВИПРАВЛЕННЯМ КЕШУ)
function checkAdminAccess() {
    const isKing = access === 'admin_king' || localStorage.getItem(CABINET_KEY) === 'true';
    if (isKing) {
        document.getElementById('admin-view')?.classList.remove('hidden');
        document.getElementById('settings-btn')?.classList.remove('hidden');
        document.getElementById('dynamic-settings-btn')?.classList.remove('hidden');
    } else {
        document.getElementById('admin-view')?.classList.add('hidden');
        document.getElementById('settings-btn')?.classList.add('hidden');
        document.getElementById('dynamic-settings-btn')?.classList.add('hidden');
    }
    return isKing;
}

// ВСТАНОВЛЕННЯ ФОНУ
function setDisplayBg(url) {
    document.body.style.backgroundImage = url ? `url('${url}')` : 'none';
}

// ІНІЦІАЛІЗАЦІЯ ФОНУ
if (globalBg) { setDisplayBg(globalBg); } 
else {
    const saved = localStorage.getItem(BG_KEY);
    if (saved) setDisplayBg(saved);
}

// --- НОВИНКА: SMART TOUCH (КРОК 10) ---
function handleScreenTap(e) {
    if (currentPageId !== 'main' && checkAdminAccess()) {
        // Якщо тапнули по фону, а не по кнопках — показуємо панель
        if (e.target.id === 'dynamic-body' || e.target.id === 'dynamic-page-view') {
            toggleCreatorPanel();
        }
    }
}

function toggleCreatorPanel() {
    const panel = document.getElementById('creator-panel');
    panel.classList.toggle('hidden');
}

// --- НОВИНКА: ЛОГІКА СТОРІНОК (КРОК 5, 6, 9) ---
function openCyberPage(pageId) {
    const data = cyberPages[pageId];
    if (!data) return;

    currentPageId = pageId;
    document.getElementById('main-content-view').classList.add('hidden');
    document.getElementById('dynamic-page-view').classList.remove('hidden');
    
    // Якщо у сторінки є свій фон — ставимо його, якщо ні — робимо темно
    if (data.bg) {
        setDisplayBg(data.bg);
        document.getElementById('dynamic-status').innerText = "";
    } else {
        setDisplayBg(null); // Чорний фон для нової сторінки
        document.getElementById('dynamic-status').innerText = "Система в стадії розробки...";
    }
    
    document.getElementById('dynamic-text-content').innerHTML = data.text || "";
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
}

function closeDynamicPage() {
    currentPageId = 'main';
    document.getElementById('dynamic-page-view').classList.add('hidden');
    document.getElementById('main-content-view').classList.remove('hidden');
    document.getElementById('creator-panel').classList.add('hidden');
    setDisplayBg(globalBg || localStorage.getItem(BG_KEY));
}

// ФУНКЦІЇ ПАНЕЛІ ТВОРЦЯ
function setPageText() {
    const txt = prompt("Введіть текст для цієї сторінки:");
    if (txt !== null) {
        document.getElementById('dynamic-text-content').innerHTML = txt;
        // Тут буде відправка сигналу Питону для збереження тексту
        tg.sendData(JSON.stringify({ action: "save_page_text", page: currentPageId, text: txt }));
    }
}

function deleteCurrentPage() {
    if (confirm("⚠️ ВИДАЛИТИ ЦЕЙ РОЗДІЛ НАЗАВЖДИ?")) {
        tg.sendData(JSON.stringify({ action: "delete_page", page: currentPageId }));
        closeDynamicPage();
    }
}

// --- ТВОЇ ОРИГІНАЛЬНІ ФУНКЦІЇ (БЕЗ ЗМІН) ---
function toggleSettings() { document.getElementById('settings-menu').classList.toggle('hidden'); }
function triggerBgUpload() { document.getElementById('bg-upload').click(); toggleSettings(); }

function changeBackground(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const url = e.target.result;
        setDisplayBg(url);
        localStorage.setItem(BG_KEY, url);
        if (checkAdminAccess()) {
            tg.sendData(JSON.stringify({ action: "request_photo", target_page: currentPageId }));
            alert("🦾 Сигнал передано! Відправ фото для сторінки: " + currentPageId);
            setTimeout(() => tg.close(), 500);
        }
    };
    reader.readAsDataURL(file);
}

function resetBackground() {
    setDisplayBg(null);
    localStorage.removeItem(BG_KEY);
    if (checkAdminAccess()) {
        tg.sendData(JSON.stringify({ action: "reset_bg", page: currentPageId }));
    }
    toggleSettings();
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }

// --- ТВОЯ ЛОГІКА ЧАТУ ТА ПАМ'ЯТОК ---
// (Встав сюди весь свій код sendMessage, appendMsg, loadChatHistory і т.д. без змін)

function sendMessage() {
    const rawText = document.getElementById('chat-input').innerText.trim();
    // ... твій код ...
    if (rawText.toLowerCase() === 'кабінет') {
        localStorage.setItem(CABINET_KEY, 'true');
        location.reload();
    } else if (rawText.toLowerCase() === 'вихід') {
        localStorage.removeItem(CABINET_KEY); // Очищення адмінки!
        location.reload();
    }
}

// ІНІЦІАЛІЗАЦІЯ
window.onload = () => {
    checkAdminAccess();
    // Виклик малювання кнопок (функція renderCyberButtons з попередніх версій)
    if (typeof renderCyberButtons === 'function') renderCyberButtons();
};
        

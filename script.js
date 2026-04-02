const tg = window.Telegram.WebApp;
tg.expand();
tg.hideHeader(); 

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

if (access === 'admin_king') {
    const adminSection = document.getElementById('admin-view');
    const userSection = document.getElementById('user-view');
    if (adminSection) adminSection.classList.remove('hidden');
    if (userSection) userSection.classList.add('hidden');
}

// --- ЛОГІКА ВІДЕО-ЗАГРУЗКИ ---
const introVideo = document.getElementById('intro-video');
const appContainer = document.getElementById('app-container');
const logoPatch = document.getElementById('logo-patch');

// Прискорення відео (1.5 = на 50% швидше)
introVideo.playbackRate = 1.5;

// Перехід рівно по закінченню відео
introVideo.onended = () => {
    introVideo.style.display = 'none';
    if (logoPatch) logoPatch.style.display = 'none'; // Ховаємо латку теж
    appContainer.classList.remove('hidden');
    tg.showHeader();
};

// Захист від помилок завантаження
introVideo.onerror = () => {
    introVideo.style.display = 'none';
    if (logoPatch) logoPatch.style.display = 'none';
    appContainer.classList.remove('hidden');
    tg.showHeader();
};

// Запасний варіант, якщо відео зависне (через 5 сек)
setTimeout(() => {
    if (!appContainer.classList.contains('hidden')) return;
    introVideo.style.display = 'none';
    if (logoPatch) logoPatch.style.display = 'none';
    appContainer.classList.remove('hidden');
    tg.showHeader();
}, 5000);

// --- ЛОГІКА ІНТЕРФЕЙСУ ---
function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }
function closeApp() { tg.close(); }
function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

function openChat() {
    toggleMenu(); 
    document.getElementById('chat-modal').classList.remove('hidden');
    loadChatHistory();
}

// --- ЧАТ ---
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
    
    if (text.includes('Доступ підтверджено')) {
        div.innerHTML = '✅ ' + text.replace('✅ ', '');
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
            appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.');
        } else {
            appendMsg('bot', '❌ Команду не розпізнано.');
        }
    }, 600);
}

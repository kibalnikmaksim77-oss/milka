const tg = window.Telegram.WebApp;
tg.expand();

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// Логіка доступу
if (access === 'admin_king') {
    const adminSection = document.getElementById('admin-view');
    const userSection = document.getElementById('user-view');
    if (adminSection) adminSection.classList.remove('hidden');
    if (userSection) userSection.classList.add('hidden');
}

// --- ІДЕАЛЬНА ЗАГРУЗКА БЕЗ БАГІВ ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loading-screen');
    const app = document.getElementById('app-container');
    
    // Ховаємо верхню панель Telegram
    tg.hideHeader();

    // CSS анімація збірки бика і лазера триває 3000 мс (3 сек).
    // Ставимо таймаут на 3.1 сек, щоб плавно приховати лоадер.
    setTimeout(() => {
        loader.style.opacity = '0'; // Запускаємо затухання
        
        setTimeout(() => {
            loader.style.display = 'none'; // Видаляємо блок
            app.classList.remove('hidden'); // Показуємо чорний екран і меню
            tg.showHeader(); // Повертаємо панель Telegram
        }, 600); // Чекаємо поки прозорість стане 0
        
    }, 3100); 
});

// --- ТВОЄ ОРИГІНАЛЬНЕ МЕНЮ ---
function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }
function closeApp() { tg.close(); }
function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

function openChat() {
    toggleMenu(); 
    document.getElementById('chat-modal').classList.remove('hidden');
    loadChatHistory();
}

// --- ЧАТ (Зберігаємо перше повідомлення) ---
function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    box.innerHTML = ''; 
    let history = JSON.parse(localStorage.getItem('milka_chat')) || [];
    
    // Якщо чат пустий, бот пише першим (як в оригіналі)
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
    
    // Якщо це системне повідомлення з галочкою
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

// Відправка
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

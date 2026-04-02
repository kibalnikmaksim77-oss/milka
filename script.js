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

// --- ЛОГІКА ХАКЕРСЬКОГО ЗАВАНТАЖЕННЯ ---
window.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loading-screen');
    const app = document.getElementById('app-container');
    const percentText = document.getElementById('load-percent');
    const bullLogo = document.getElementById('cyber-bull-logo');
    
    tg.hideHeader();

    let percent = 0;
    // Інтервал, який швидко накручує відсотки від 0 до 100
    let loadingInterval = setInterval(() => {
        // Додаємо випадкове число від 5 до 15
        percent += Math.floor(Math.random() * 10) + 5; 
        
        if (percent >= 100) {
            percent = 100;
            clearInterval(loadingInterval);
            percentText.innerText = percent;
            
            // На 100% бик яскраво спалахує неоном
            bullLogo.classList.add('fully-loaded');
            
            // Чекаємо півсекунди, щоб ти насолодився спалахом, і ховаємо екран
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    app.classList.remove('hidden');
                    tg.showHeader();
                }, 600); // Зникання екрану
            }, 800); // Пауза на 100%
        } else {
            percentText.innerText = percent;
        }
    }, 150); // Швидкість зміни відсотків
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

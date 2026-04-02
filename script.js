const tg = window.Telegram.WebApp;
tg.expand();

// Шукаємо ключ адміна
const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// Якщо це ти, відкриваємо секретну зону в меню
if (access === 'admin_king') {
    document.getElementById('admin-zone').classList.remove('hidden');
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

function closeApp() {
    tg.close();
}

// Відкриваємо чат з ботом
function openChat() {
    toggleMenu(); // Ховаємо меню
    document.getElementById('chat-modal').classList.remove('hidden');
    
    // Бот вітається, якщо чат пустий
    const chatBox = document.getElementById('chat-messages');
    if (chatBox.innerHTML.trim() === "") {
        appendMessage('bot', 'Слухаю, Власнику. Яку команду виконати?');
    }
}

function closeChat() {
    document.getElementById('chat-modal').classList.add('hidden');
}

// Логіка відправки повідомлень
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // Показуємо повідомлення Максима
    appendMessage('user', text);
    input.value = '';

    // Бот відповідає через півсекунди
    setTimeout(() => {
        if (text.toLowerCase() === 'кабінет') {
            appendMessage('bot', '✅ Доступ підтверджено. Завантажую Кабінет Власника...');
            
            // Через 1.5 секунди закриваємо чат і міняємо екран
            setTimeout(() => {
                activateCabinet();
            }, 1500);

        } else {
            appendMessage('bot', '❌ Команду не розпізнано. Система чекає.');
        }
    }, 600);
}

function appendMessage(sender, text) {
    const chatBox = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('msg', sender);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Завантаження Кабінету на головний екран
function activateCabinet() {
    closeChat(); // Ховаємо чат
    const mainContent = document.getElementById('main-content');
    
    // Перебудовуємо головний екран!
    mainContent.innerHTML = `
        <h2 class="cabinet-title">⚡ ТЕРМІНАЛ ВЛАСНИКА</h2>
        <p class="cabinet-status">Тут порожньо. Чекаю на інструкції для створення команд...</p>
    `;
    
    // Тут потім додамо зміну картинки на "Бик за ноутом"
}

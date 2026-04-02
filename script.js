const tg = window.Telegram.WebApp;
tg.expand();

// Отримуємо ключ із посилання
const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');

// ПЕРЕВІРКА: Показувати Milka Bot тільки якщо є ключ admin_king
if (access === 'admin_king') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
}

function closeApp() { tg.close(); }

// --- ЛОГІКА ПАМ'ЯТІ (LOCAL STORAGE) ---

// Завантаження історії при відкритті чату
function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    box.innerHTML = ''; // Очищаємо перед завантаженням
    
    // Дістаємо історію з сейфу (або створюємо пусту)
    let history = JSON.parse(localStorage.getItem('milka_chat')) || [];

    if (history.length === 0) {
        // Якщо чат абсолютно пустий (перший вхід)
        appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.');
    } else {
        // Якщо історія є - відмальовуємо її
        history.forEach(item => {
            appendMsgDOM(item.sender, item.text);
        });
    }
}

// Збереження одного повідомлення в сейф
function saveMsgToHistory(sender, text) {
    let history = JSON.parse(localStorage.getItem('milka_chat')) || [];
    history.push({ sender: sender, text: text });
    localStorage.setItem('milka_chat', JSON.stringify(history));
}

// Додавання повідомлення ТІЛЬКИ на екран (без збереження)
function appendMsgDOM(sender, text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// Головна функція: додає на екран І зберігає в пам'ять
function appendMsg(sender, text) {
    appendMsgDOM(sender, text);
    saveMsgToHistory(sender, text);
}

// --- ОСНОВНІ ФУНКЦІЇ ЧАТУ ---

function openChat() {
    toggleMenu();
    document.getElementById('chat-modal').classList.remove('hidden');
    loadChatHistory(); // Підвантажуємо пам'ять при відкритті
}

function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // Відправляємо і зберігаємо твоє повідомлення
    appendMsg('user', text);
    input.value = '';

    // Відповідь бота
    setTimeout(() => {
        if (text.toLowerCase() === 'кабінет') {
            appendMsg('bot', '✅ Доступ підтверджено. Інтерфейс власника активовано.');
        } else if (text.toLowerCase() === 'очистити') {
            // Секретна команда для тебе: стерти пам'ять
            localStorage.removeItem('milka_chat');
            document.getElementById('chat-messages').innerHTML = '';
            appendMsg('bot', '🧹 Пам\'ять терміналу очищено.');
        } else {
            appendMsg('bot', '❌ Команду не розпізнано.');
        }
    }, 600);
}

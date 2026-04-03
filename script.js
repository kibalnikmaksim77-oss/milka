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

// ФУНКЦІЯ ЗМІНИ ФОНУ
function changeBackground(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const imgUrl = e.target.result;
        document.body.style.backgroundImage = `url('${imgUrl}')`;
        localStorage.setItem(BG_KEY, imgUrl);
    };
    reader.readAsDataURL(file);

    if (access === 'admin_king') {
        tg.sendData(JSON.stringify({
            action: "request_photo"
        }));
        alert("🦾 Сигнал передано Питону! \n\nТепер закрий додаток і просто відправ потрібне фото боту в повідомлення. Він сам його розішле.");
        setTimeout(() => { tg.close(); }, 500);
    }
}

function resetBackground() {
    document.body.style.backgroundImage = 'none';
    localStorage.removeItem(BG_KEY);
    
    if (access === 'admin_king') {
        tg.sendData(JSON.stringify({ action: "reset_all_bg" }));
        alert("🧹 𝚍𝚎𝚜𝚒𝚐𝚗_𝚛𝚎𝚜𝚎𝚝: 𝚊𝚕𝚕_𝚞𝚜𝚎𝚛𝚜_𝚞𝚙𝚍𝚊𝚝𝚒𝚗𝚐");
    }
    toggleSettings();
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }
function closeApp() { tg.close(); }

// --- ЛОГІКА РЕДАКТОРА ТА ФОРМАТУВАННЯ ---
const chatInput = document.getElementById('chat-input');
const formatTrigger = document.getElementById('format-trigger');
const formatMenu = document.getElementById('format-menu');

// Слідкуємо за текстом, щоб показувати/ховати 3 крапки
chatInput.addEventListener('input', () => {
    if (chatInput.innerText.trim().length > 0) {
        formatTrigger.classList.remove('hidden');
    } else {
        formatTrigger.classList.add('hidden');
        formatMenu.classList.add('hidden');
    }
});

function toggleFormatMenu() {
    formatMenu.classList.toggle('hidden');
}

// Застосування стилів (onmousedown щоб не втрачати фокус виділення)
function applyFormat(type, event) {
    event.preventDefault(); // Запобігаємо зняттю виділення тексту
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    switch(type) {
        case 'bold': document.execCommand('bold'); break;
        case 'italic': document.execCommand('italic'); break;
        case 'strikethrough': document.execCommand('strikeThrough'); break;
        case 'underline': document.execCommand('underline'); break;
        case 'monospaced': document.execCommand('fontName', false, 'monospace'); break;
        case 'link':
            let url = prompt("Введіть посилання (URL):");
            if (url) document.execCommand('createLink', false, url);
            break;
        case 'plain': document.execCommand('removeFormat'); break;
        case 'codeBlock':
            const text = selection.toString();
            if(text) {
                const codeHTML = `
                <div class="custom-code-block" contenteditable="false">
                    <div class="code-header">
                        <span>Назва коду</span>
                        <span style="cursor:pointer;" onclick="copyMyCode(this)">📋 Копіювати</span>
                    </div>
                    <pre class="code-content">${text}</pre>
                </div><br>`;
                document.execCommand('insertHTML', false, codeHTML);
            }
            break;
    }
    formatMenu.classList.add('hidden');
}

// Функція копіювання коду
function copyMyCode(btn) {
    const pre = btn.parentElement.nextElementSibling;
    navigator.clipboard.writeText(pre.innerText).then(() => {
        const originalText = btn.innerText;
        btn.innerText = '✅ Скопійовано!';
        setTimeout(() => { btn.innerText = originalText; }, 2000);
    });
}

// --- ЛОГІКА ЧАТУ ---
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

function saveMsgToHistory(sender, htmlText) {
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    history.push({ sender: sender, text: htmlText }); // Зберігаємо саме HTML зі стилями
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
}

function appendMsgDOM(sender, htmlText) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    div.innerHTML = htmlText; // Використовуємо innerHTML, щоб теги рендерились
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendMsg(sender, htmlText) {
    appendMsgDOM(sender, htmlText);
    saveMsgToHistory(sender, htmlText);
}

function openChat() {
    toggleMenu();
    document.getElementById('chat-modal').classList.remove('hidden');
    loadChatHistory();
}

function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

// Оновлена функція відправки
function sendMessage() {
    // Беремо HTML для відображення і текст для перевірки команд
    const htmlText = chatInput.innerHTML.trim(); 
    const rawText = chatInput.innerText.trim();

    if (!rawText) return;
    
    // Відправляємо повідомлення з форматуванням
    appendMsg('user', htmlText);
    
    // Очищаємо поле та ховаємо крапки
    chatInput.innerHTML = '';
    formatTrigger.classList.add('hidden');
    formatMenu.classList.add('hidden');
    
    setTimeout(() => {
        const lowerText = rawText.toLowerCase();
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
            // Для тестів можемо ехо-повернути те саме повідомлення
            appendMsg('bot', '✅ Прийнято: ' + htmlText);
        }
    }, 600);
}

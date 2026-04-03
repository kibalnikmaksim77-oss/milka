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
const globalBg = urlParams.get('bg'); 

// ПРІОРИТЕТ ФОНУ
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

function applyFormat(type, event) {
    event.preventDefault(); 
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
                let codeTitle = prompt("Введіть назву для коду (наприклад, script.js або Python):", "Код");
                
                if (codeTitle === null) {
                    formatMenu.classList.add('hidden');
                    return;
                }
                if (codeTitle.trim() === '') {
                    codeTitle = "Код";
                }

                const codeHTML = `
                <div class="custom-code-block" contenteditable="false">
                    <div class="code-header">
                        <span>${codeTitle}</span>
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

function copyMyCode(btn) {
    const pre = btn.parentElement.nextElementSibling;
    navigator.clipboard.writeText(pre.innerText).then(() => {
        const originalText = btn.innerText;
        btn.innerText = '✅ Скопійовано!';
        setTimeout(() => { btn.innerText = originalText; }, 2000);
    });
}

// --- ЛОГІКА СКРІПКИ ТА ПЕРЕГЛЯДУ ЗОБРАЖЕННЯ ---
const attachUpload = document.getElementById('attach-upload');
const previewContainer = document.getElementById('image-preview-container');

function handleAttachment(event) {
    const files = event.target.files;
    if (!files.length) return;
    
    // Очищаємо попередній прев'ю
    previewContainer.innerHTML = '';
    
    let hasImages = false;
    let fileNames = [];

    // Перебираємо файли
    for(let i = 0; i < files.length; i++) {
        const file = files[i];
        fileNames.push(file.name);

        // Якщо це зображення — створюємо прев'ю
        if (file.type.startsWith('image/')) {
            hasImages = true;
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                previewContainer.appendChild(img);
            }
            reader.readAsDataURL(file);
        }
    }
    
    // Показуємо контейнер прев'ю, якщо є зображення
    if (hasImages) {
        previewContainer.classList.remove('hidden');
    } else {
        previewContainer.classList.add('hidden');
    }
    
    // Також відразу відправляємо повідомлення про прикріплені файли в чат
    appendMsg('user', `📎 <b>Прикріплено файлів: ${files.length}</b><br><i>${fileNames.join('<br>')}</i>`);
    
    // Скидаємо значення інпута
    event.target.value = ""; 
}

// --- ЛОГІКА ЧАТУ ТА ВИДАЛЕННЯ ---
function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    box.innerHTML = ''; 
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    if (history.length === 0) {
        appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.');
    } else {
        history.forEach(item => {
            if (!item.id) item.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            appendMsgDOM(item.sender, item.text, item.id);
        });
        localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    }
}

function saveMsgToHistory(sender, htmlText, id) {
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    history.push({ id: id, sender: sender, text: htmlText });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
}

function deleteMsgFromHistory(id) {
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    history = history.filter(msg => msg.id !== id);
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
}

function appendMsgDOM(sender, htmlText, id) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    div.innerHTML = htmlText; 
    div.dataset.id = id;

    // Логіка зажаття для видалення
    let pressTimer;
    const startPress = (e) => {
        if (e.type === 'click' && e.button !== 0) return;
        pressTimer = setTimeout(() => {
            if (confirm("🗑 Видалити це повідомлення?")) {
                deleteMsgFromHistory(id);
                div.remove();
            }
        }, 800); 
    };
    const cancelPress = () => { clearTimeout(pressTimer); };

    div.addEventListener('mousedown', startPress);
    div.addEventListener('touchstart', startPress);
    div.addEventListener('mouseup', cancelPress);
    div.addEventListener('mouseleave', cancelPress);
    div.addEventListener('touchend', cancelPress);
    div.addEventListener('touchmove', cancelPress);

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendMsg(sender, htmlText) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    appendMsgDOM(sender, htmlText, id);
    saveMsgToHistory(sender, htmlText, id);
}

function openChat() {
    toggleMenu();
    document.getElementById('chat-modal').classList.remove('hidden');
    loadChatHistory();
}

function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

// ЛОГІКА ВІДПРАВКИ (Без Ехо, з хованням прев'ю)
function sendMessage() {
    const htmlText = chatInput.innerHTML.trim(); 
    const rawText = chatInput.innerText.trim();

    // Перевіряємо чи є текст АБО картинка в прев'ю
    if (!rawText && !previewContainer.innerHTML) return;
    
    appendMsg('user', htmlText);
    
    chatInput.innerHTML = '';
    formatTrigger.classList.add('hidden');
    formatMenu.classList.add('hidden');
    
    // Ховаємо прев'ю після відправки
    previewContainer.classList.add('hidden');
    previewContainer.innerHTML = '';

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
        } 
    }, 600);
                       }
        

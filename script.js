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

if (globalBg) { document.body.style.backgroundImage = `url('${globalBg}')`; } 
else {
    const savedBg = localStorage.getItem(BG_KEY);
    if (savedBg) { document.body.style.backgroundImage = `url('${savedBg}')`; }
}

if (access === 'admin_king') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');

    if (localStorage.getItem(CABINET_KEY) === 'true') {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) settingsBtn.classList.remove('hidden');
    }
}

function toggleSettings() { document.getElementById('settings-menu').classList.toggle('hidden'); }
function triggerBgUpload() { document.getElementById('bg-upload').click(); toggleSettings(); }

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
        tg.sendData(JSON.stringify({ action: "request_photo" }));
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

const chatInput = document.getElementById('chat-input');
const formatTrigger = document.getElementById('format-trigger');
const formatMenu = document.getElementById('format-menu');

chatInput.addEventListener('input', () => {
    if (chatInput.innerText.trim().length > 0) { formatTrigger.classList.remove('hidden'); } 
    else { formatTrigger.classList.add('hidden'); formatMenu.classList.add('hidden'); }
});

function toggleFormatMenu() { formatMenu.classList.toggle('hidden'); }

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
            let codeTitle = prompt("Введіть назву для коду (наприклад, index.html):", "Код");
            if (codeTitle === null) { formatMenu.classList.add('hidden'); return; }
            if (codeTitle.trim() === '') { codeTitle = "Код"; }

            const codeHTML = `
            <div class="custom-code-block" contenteditable="false">
                <div class="code-header">
                    <span>${codeTitle}</span>
                    <span style="cursor:pointer;" onclick="copyMyCode(this)">📋 Копіювати</span>
                </div>
                <pre class="code-content" contenteditable="true">${text || '// Вставте ваш код сюди...'}</pre>
            </div><br>`;
            document.execCommand('insertHTML', false, codeHTML);
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

let pendingMedia = []; 

function handleAttachment(event) {
    const files = event.target.files;
    if (!files.length) return;
    
    for(let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const isVideo = file.type.startsWith('video/');
            pendingMedia.push({ type: isVideo ? 'video' : 'image', src: dataUrl });
            renderMediaPreview();
        }
        reader.readAsDataURL(file);
    }
    event.target.value = ""; 
}

function renderMediaPreview() {
    const container = document.getElementById('media-preview-container');
    container.innerHTML = '';
    if (pendingMedia.length === 0) { container.classList.add('hidden'); return; }
    
    container.classList.remove('hidden');
    pendingMedia.forEach((media, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        if (media.type === 'video') {
            div.innerHTML = `<video src="${media.src}"></video><div class="preview-remove" onclick="removePendingMedia(${index})">❌</div>`;
        } else {
            div.innerHTML = `<img src="${media.src}"><div class="preview-remove" onclick="removePendingMedia(${index})">❌</div>`;
        }
        container.appendChild(div);
    });
}

function removePendingMedia(index) {
    pendingMedia.splice(index, 1);
    renderMediaPreview();
}

let msgToDeleteId = null;
let msgToDeleteDiv = null;
const deleteConfirmModal = document.getElementById('delete-confirm-modal');

document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    deleteConfirmModal.classList.add('hidden');
    msgToDeleteId = null;
    msgToDeleteDiv = null;
});

document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    if (msgToDeleteId && msgToDeleteDiv) {
        deleteMsgFromHistory(msgToDeleteId);
        msgToDeleteDiv.remove();
    }
    deleteConfirmModal.classList.add('hidden');
    msgToDeleteId = null;
    msgToDeleteDiv = null;
});

function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    box.innerHTML = ''; 
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    if (history.length === 0) { appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.'); } 
    else {
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

// ОНОВЛЕНО: Функція для ДИНАМІЧНОГО редагування повідомлення в чаті та історії
function updateMsg(id, newHtml) {
    const msgDiv = document.querySelector(`.msg[data-id="${id}"]`);
    if (msgDiv) {
        msgDiv.innerHTML = newHtml;
        let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
        let msgIndex = history.findIndex(m => m.id === id);
        if (msgIndex !== -1) {
            history[msgIndex].text = newHtml;
            localStorage.setItem(CHAT_KEY, JSON.stringify(history));
        }
    }
}

function appendMsgDOM(sender, htmlText, id) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    div.innerHTML = htmlText; 
    div.dataset.id = id;

    let pressTimer;
    const startPress = (e) => {
        if (e.type === 'click' && e.button !== 0) return;
        pressTimer = setTimeout(() => {
            msgToDeleteId = id;
            msgToDeleteDiv = div;
            deleteConfirmModal.classList.remove('hidden');
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

// Додано можливість передавати forcedId
function appendMsg(sender, htmlText, forcedId = null) {
    const id = forcedId || Date.now().toString() + Math.random().toString(36).substr(2, 5);
    appendMsgDOM(sender, htmlText, id);
    saveMsgToHistory(sender, htmlText, id);
    return id; // Повертаємо ID, щоб знати, яке повідомлення редагувати
}

function openChat() {
    toggleMenu();
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('chat-modal').classList.remove('hidden');
    loadChatHistory();
}

function closeChat() { 
    document.getElementById('chat-modal').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
}

// --- СИСТЕМА ДИНАМІЧНОГО МЕНЮ ПАМ'ЯТОК ---
window.generateNotesListHTML = function(msgId) {
    let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    let keys = Object.keys(notes);
    let buttonsHtml = '<div class="notes-list-container">';
    keys.forEach(key => {
        // Передаємо ID бульбашки, щоб редагувати саме її
        buttonsHtml += `<button class="note-btn" onclick="openNoteFromButton('${key.replace(/'/g, "\\'")}', '${msgId}')">${key}</button>`;
    });
    buttonsHtml += '</div>';
    return `🗄 <b>Ваші збережені пам'ятки:</b><br><span style="font-size:12px; color:#aaa;">Натисніть на кнопку, щоб розгорнути код:</span>` + buttonsHtml;
};

window.openNoteFromButton = function(title, msgId) {
    let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    if (notes[title]) {
        let content = `📂 Ось ваш код <b>${title}</b>:<br>` + notes[title];
        // Додаємо кнопку повернення
        content += `<br><div style="margin-top:10px; text-align:center;"><button class="note-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`;
        updateMsg(msgId, content); // РЕДАГУЄМО поточне повідомлення!
    } else {
        updateMsg(msgId, `❌ Пам'ятку не знайдено.<br><div style="margin-top:10px;"><button class="note-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`);
    }
};

window.returnToNotesList = function(msgId) {
    let htmlContent = generateNotesListHTML(msgId);
    updateMsg(msgId, htmlContent); // Повертаємо список кнопок в ту ж бульбашку!
};

let awaitingNote = false;

function sendMessage() {
    const htmlText = chatInput.innerHTML.trim(); 
    const rawText = chatInput.innerText.trim();

    if (!rawText && !htmlText.includes('<img') && !htmlText.includes('<div') && pendingMedia.length === 0) return;
    
    if (awaitingNote) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;
        const codeHeaderSpan = tempDiv.querySelector('.code-header span:first-child');
        
        if (codeHeaderSpan) {
            const noteTitle = codeHeaderSpan.innerText.trim();
            let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
            notes[noteTitle.toLowerCase()] = htmlText; 
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
            appendMsg('bot', `💾 Код <b>${noteTitle}</b> успішно завантажено в кібер-пам'ять!`);
        } else {
            appendMsg('bot', `❌ Відмінено. Ви не відправили форматований блок коду (через &lt;/&gt;).`);
        }
        
        awaitingNote = false;
        chatInput.innerHTML = '';
        pendingMedia = [];
        renderMediaPreview();
        formatTrigger.classList.add('hidden');
        formatMenu.classList.add('hidden');
        return; 
    }

    let mediaHtml = '';
    pendingMedia.forEach(media => {
        if (media.type === 'video') { mediaHtml += `<video src="${media.src}" controls></video><br>`; } 
        else { mediaHtml += `<img src="${media.src}"><br>`; }
    });

    const finalMessageHtml = mediaHtml + htmlText;
    appendMsg('user', finalMessageHtml);
    
    chatInput.innerHTML = '';
    pendingMedia = [];
    renderMediaPreview();
    formatTrigger.classList.add('hidden');
    formatMenu.classList.add('hidden');
    
    setTimeout(() => {
        const lowerText = rawText.toLowerCase();
        
        if (lowerText === '+пам\'ятка' || lowerText === '+пам’ятка') {
            awaitingNote = true;
            appendMsg('bot', 'Що ви хочете зберегти? Відправте текст у вигляді кода (через <b>⋮</b> -> <b>&lt;/&gt;</b>), і я візьму назву з назви коду.');
        } 
        else if (lowerText === 'пам\'ятки' || lowerText === 'пам’ятки') {
            let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
            let keys = Object.keys(notes);
            
            // Генеруємо унікальний ID для бульбашки заздалегідь
            const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 5);

            if (keys.length === 0) {
                appendMsg('bot', `📭 Ваша кібер-пам'ять наразі порожня. Збережіть щось за допомогою команди <b>+пам'ятка</b>.`, msgId);
            } else {
                let htmlContent = generateNotesListHTML(msgId);
                // Відправляємо повідомлення з прив'язаним ID
                appendMsg('bot', htmlContent, msgId);
            }
        }
        else if (lowerText.startsWith("пам'ятка ") || lowerText.startsWith("пам’ятка ")) {
            const reqTitle = lowerText.replace(/пам['’]ятка /g, "").trim();
            let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
            
            if (notes[reqTitle]) {
                appendMsg('bot', `📂 Ось ваш код:<br>` + notes[reqTitle]);
            } else {
                appendMsg('bot', `❌ Пам'ятку з назвою <b>${reqTitle}</b> не знайдено.`);
            }
        }
        else if (lowerText.startsWith("видалити пам'ятку ") || lowerText.startsWith("видалити пам’ятку ")) {
            const delTitle = lowerText.replace(/видалити пам['’]ятку /g, "").trim();
            let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
            
            if (notes[delTitle]) {
                delete notes[delTitle];
                localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
                appendMsg('bot', `🧹 Пам'ятку <b>${delTitle}</b> успішно видалено з кібер-пам'яті.`);
            } else {
                appendMsg('bot', `❌ Пам'ятку з назвою <b>${delTitle}</b> не знайдено.`);
            }
        }
        else if (lowerText === 'кабінет') {
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
                         

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

// База даних з підтримкою вкладених сторінок (матрьошка)
let cyberPages = { main: { buttons: [] }, burger: { buttons: [] }, pages: {} };
let isEditMode = false;
let navStack = []; // Пам'ять кроків (Стек навігації)

// --- РОЗШИФРОВКА БАЗИ КНОПОК ---
if (encodedData) {
    try {
        const parsed = JSON.parse(atob(encodedData));
        cyberPages = { ...cyberPages, ...parsed };
    } catch (e) { console.error("Помилка декодування бази cd"); }
}

if (globalBg) { document.body.style.backgroundImage = `url('${globalBg}')`; } 
else {
    const savedBg = localStorage.getItem(BG_KEY);
    if (savedBg) { document.body.style.backgroundImage = `url('${savedBg}')`; }
}

if (access === 'admin_king' || localStorage.getItem(CABINET_KEY) === 'true') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.classList.remove('hidden');
}

// --- ФУНКЦІЯ НЕОНОВИХ ЕМОДЗІ ---
function neonizeEmoji(text) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    return text.replace(emojiRegex, '<span style="filter: drop-shadow(0 0 8px #bc13fe); font-size: 1.2em;">$1</span>');
}

// --- НАВІГАЦІЯ (СТУДІЯ МАТРЬОШОК ТА СТЕК ПАМ'ЯТІ) ---
function goHome() {
    navStack = []; 
    const terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) terminal.classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
}

function goBack() {
    navStack.pop(); 
    if (navStack.length > 0) {
        renderTerminal(); 
    } else {
        goHome(); 
    }
}

function openTerminalPage(pageTitle) {
    // Системні кнопки не відкривають нові вікна
    if(pageTitle.includes('Око Юзера') || pageTitle.includes('Milka Bot') || pageTitle === '🏠') return;
    
    navStack.push(pageTitle); 
    renderTerminal();
}

function renderTerminal() {
    if (navStack.length === 0) return;
    const currentPage = navStack[navStack.length - 1]; 
    
    document.getElementById('app-container').classList.add('hidden');
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
    
    let terminal = document.getElementById('dynamic-terminal-page');
    if (!terminal) {
        terminal = document.createElement('div');
        terminal.id = 'dynamic-terminal-page';
        terminal.className = 'neon-border';
        document.body.appendChild(terminal);
    }
    
    const isUserEye = document.getElementById('user-eye-studio') && document.getElementById('user-eye-studio').style.display !== 'none';
    
    let dotsHtml = '';
    if (access === 'admin_king' && !isUserEye) {
        dotsHtml = `<div class="admin-dots" onclick="toggleSettings()" style="margin-right: 15px;">⋮</div>`;
    }

    terminal.innerHTML = `
        <div class="terminal-header">
            <div class="terminal-burger" onclick="toggleMenu()">
                <span></span><span></span><span></span>
            </div>
            <div class="terminal-title">${neonizeEmoji(currentPage)}</div>
            <div class="terminal-right-controls">
                ${dotsHtml}
                <div class="close-cross-btn" onclick="goBack()">❌</div>
            </div>
        </div>
        <div class="terminal-content" id="terminal-buttons-container"></div>
    `;
    terminal.classList.remove('hidden');

    // Рендеримо вкладені кнопки (матрьошки)
    const contentContainer = document.getElementById('terminal-buttons-container');
    if (cyberPages.pages && cyberPages.pages[currentPage]) {
        cyberPages.pages[currentPage].buttons.forEach(btn => {
            if (btn.role === 'owner' && access !== 'admin_king') return;
            const b = document.createElement('button');
            b.className = btn.role === 'owner' ? 'note-btn secret-btn' : 'note-btn';
            b.innerHTML = neonizeEmoji(btn.text);
            b.onclick = () => openTerminalPage(btn.text);
            
            b.style.cssText = "width:100%; padding:14px 10px; font-size:14px; border-radius:16px; background:rgba(15, 15, 15, 0.4); backdrop-filter:blur(12px); border:1.5px solid rgba(188, 19, 254, 0.6); box-shadow:0 8px 32px rgba(0,0,0,0.5); color:#fff; text-shadow:0 0 10px #bc13fe;";
            contentContainer.appendChild(b);
        });
    } else {
        contentContainer.innerHTML = `<div style="grid-column: span 2; text-align: center; color: #555; margin-top: 20px;">Сторінка порожня...</div>`;
    }
}

// --- СТУДІЯ "ОКО ЮЗЕРА" (ДРУГИЙ СВІТ - ІДЕАЛЬНО ЧИСТИЙ) ---
function openUserEyeStudio() {
    let modal = document.getElementById('user-eye-studio');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'user-eye-studio';
        modal.className = 'neon-border'; 
        modal.style.cssText = "position:absolute; top:10px; left:10px; right:10px; bottom:10px; z-index:9999; background-size:cover; background-position:top center; background-repeat:no-repeat; display:flex; flex-direction:column; align-items:center; background-color:#080808; overflow:hidden;";
        
        const header = document.createElement('div');
        header.style.cssText = "position:relative; width: 100%; height: 60px; display:flex; justify-content:space-between; align-items:center; padding: 0 20px; box-sizing: border-box; margin-top: 10px;";
        
        header.innerHTML = `
            <div class="terminal-burger" onclick="toggleMenu()"><span></span><span></span><span></span></div>
            <div class="terminal-title">ОКО ЮЗЕРА</div>
            <div class="close-cross-btn" onclick="document.getElementById('user-eye-studio').style.display='none'">❌</div>
        `;
        
        modal.appendChild(header);

        const grid = document.createElement('div');
        grid.id = 'user-eye-grid';
        grid.style.cssText = "position:absolute; top:50%; width:90%; height:38%; display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; align-content:start; overflow-y:auto;";
        modal.appendChild(grid);
        document.body.appendChild(modal);
    }
    
    // Синхронізуємо фон
    modal.style.backgroundImage = document.body.style.backgroundImage || 'none';
    
    const grid = document.getElementById('user-eye-grid');
    grid.innerHTML = ''; 
    
    if (cyberPages.main && cyberPages.main.buttons) {
        cyberPages.main.buttons.forEach(btn => {
            if (btn.role === 'user' && btn.location === 'main') {
                const b = document.createElement('button');
                b.className = 'note-btn';
                b.innerHTML = neonizeEmoji(btn.text);
                b.style.cssText = "width:100%; padding:14px 10px; font-size:14px; border-radius:16px; background:rgba(15, 15, 15, 0.4); backdrop-filter:blur(12px); border:1.5px solid rgba(188, 19, 254, 0.6); box-shadow:0 8px 32px rgba(0,0,0,0.5), inset 0 0 10px rgba(188,19,254,0.2); color:#fff; text-shadow:0 0 10px #bc13fe; margin:0;";
                b.onclick = () => openTerminalPage(btn.text);
                grid.appendChild(b);
            }
        });
    }

    modal.style.display = 'flex';
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu(); 
}

// --- РЕЖИМ КОНСТРУКТОРА ТА НАЛАШТУВАННЯ ---
function toggleSettings() { 
    let menu = document.getElementById('settings-menu');
    // Впроваджуємо кнопку редагування
    if (!menu.querySelector('.edit-mode-btn') && access === 'admin_king') {
        const editBtn = document.createElement('button');
        editBtn.className = 'settings-item edit-mode-btn';
        editBtn.innerHTML = '🛠 Режим Конструктора';
        editBtn.onclick = () => {
            isEditMode = !isEditMode;
            menu.classList.add('hidden');
            renderCyberButtons();
            alert(isEditMode ? "🛠 Режим Конструктора УВІМКНЕНО." : "🛠 Режим Конструктора ВИМКНЕНО.");
        };
        menu.insertBefore(editBtn, menu.firstChild);
    }
    menu.classList.toggle('hidden'); 
}

function handleButtonAction(action, btnId, location) {
    tg.HapticFeedback.impactOccurred('medium');
    tg.sendData(JSON.stringify({ action: "move_btn", btn_id: btnId, direction: action, loc: location }));
}

// --- МАЛЮВАННЯ КНОПОК ТА СІТКИ ---
function renderCyberButtons() {
    const mainGrid = document.getElementById('user-commands-safe-zone');
    const userNav = document.getElementById('user-view');
    const ownerNav = document.getElementById('owner-view'); 
    
    if (mainGrid) {
        mainGrid.innerHTML = '';
        mainGrid.style.display = "grid";
        mainGrid.style.gridTemplateColumns = "repeat(2, 1fr)";
    }
    if (userNav) userNav.innerHTML = '';
    if (ownerNav) ownerNav.innerHTML = '';

    // Створюємо "Хатинку" в Бургер-меню
    const menuContent = document.querySelector('.menu-content');
    if (menuContent && !document.getElementById('home-btn-burger')) {
        const homeBtn = document.createElement('button');
        homeBtn.id = 'home-btn-burger';
        homeBtn.innerHTML = '🏠';
        homeBtn.className = 'home-btn-burger';
        homeBtn.onclick = goHome;
        menuContent.insertBefore(homeBtn, menuContent.firstChild);
    }

    if (access === 'admin_king' && !document.getElementById('trigger-eye-btn') && ownerNav) {
        const eyeBtn = document.createElement('button');
        eyeBtn.id = 'trigger-eye-btn';
        eyeBtn.className = 'menu-item secret-btn';
        eyeBtn.innerHTML = '👁️ Око Юзера';
        eyeBtn.onclick = openUserEyeStudio;
        ownerNav.appendChild(eyeBtn); 
    }

    if (cyberPages.main && cyberPages.main.buttons) {
        cyberPages.main.buttons.forEach((btn) => createButtonElement(btn, 'main', mainGrid));
    }
    if (cyberPages.burger && cyberPages.burger.buttons) {
        cyberPages.burger.buttons.forEach((btn) => {
            if(btn.role === 'owner' && ownerNav) createButtonElement(btn, 'burger', ownerNav);
            if(btn.role === 'user' && userNav) createButtonElement(btn, 'burger', userNav);
        });
    }
}

function createButtonElement(btn, location, container) {
    if (btn.role === 'owner' && access !== 'admin_king') return; 

    const wrapper = document.createElement('div');
    wrapper.className = `btn-wrapper ${location === 'main' ? 'grid-item' : ''}`;
    
    const b = document.createElement('button');
    b.className = btn.role === 'owner' && location === 'burger' ? 'menu-item secret-btn' : 'note-btn';
    b.innerHTML = neonizeEmoji(btn.text);
    b.onclick = () => openTerminalPage(btn.text);
    
    if (location === 'main') {
        b.style.cssText = "width:100%; padding:14px 10px; font-size:14px; border-radius:16px; background:rgba(15, 15, 15, 0.4); backdrop-filter:blur(12px); border:1.5px solid rgba(188, 19, 254, 0.6); box-shadow:0 8px 32px rgba(0,0,0,0.5); color:#fff; text-shadow:0 0 10px #bc13fe;";
    } else {
        b.style.width = "100%";
        b.style.marginBottom = "5px";
    }
    
    wrapper.appendChild(b);

    // Додаємо стрілочки якщо режим редагування увімкнено
    if (isEditMode && access === 'admin_king') {
        const controls = document.createElement('div');
        controls.className = 'edit-controls';
        if (location === 'main') {
            controls.innerHTML = `
                <div class="edit-btn" onclick="event.stopPropagation(); handleButtonAction('left', '${btn.text}', 'main')">←</div>
                <div class="edit-btn" onclick="event.stopPropagation(); handleButtonAction('up', '${btn.text}', 'main')">↑</div>
                <div class="edit-btn" onclick="event.stopPropagation(); handleButtonAction('down', '${btn.text}', 'main')">↓</div>
                <div class="edit-btn" onclick="event.stopPropagation(); handleButtonAction('right', '${btn.text}', 'main')">→</div>
            `;
        } else {
            controls.innerHTML = `
                <div class="edit-btn" onclick="event.stopPropagation(); handleButtonAction('up', '${btn.text}', 'burger')">↑</div>
                <div class="edit-btn" onclick="event.stopPropagation(); handleButtonAction('down', '${btn.text}', 'burger')">↓</div>
            `;
        }
        wrapper.appendChild(controls);
    }
    if(container) container.appendChild(wrapper);
}

// --- БАЗОВІ ФУНКЦІЇ ДОДАТКА ТА НАЛАШТУВАНЬ ---
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

// --- ЧАТ, ФОРМАТУВАННЯ ТА ПАМ'ЯТКИ (ТВІЙ КОД ЗБЕРЕЖЕНО НА 100%) ---
const chatInput = document.getElementById('chat-input');
const formatTrigger = document.getElementById('format-trigger');
const formatMenu = document.getElementById('format-menu');

if (chatInput) {
    chatInput.addEventListener('input', () => {
        if (chatInput.innerText.trim().length > 0) { formatTrigger.classList.remove('hidden'); } 
        else { formatTrigger.classList.add('hidden'); formatMenu.classList.add('hidden'); }
    });
}

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

if (document.getElementById('btn-cancel-delete')) {
    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
        deleteConfirmModal.classList.add('hidden');
        msgToDeleteId = null;
        msgToDeleteDiv = null;
    });
}

if (document.getElementById('btn-confirm-delete')) {
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (msgToDeleteId && msgToDeleteDiv) {
            deleteMsgFromHistory(msgToDeleteId);
            msgToDeleteDiv.remove();
        }
        deleteConfirmModal.classList.add('hidden');
        msgToDeleteId = null;
        msgToDeleteDiv = null;
    });
}

function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    if (!box) return;
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
    if (!box) return;
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

function appendMsg(sender, htmlText, forcedId = null) {
    const id = forcedId || Date.now().toString() + Math.random().toString(36).substr(2, 5);
    appendMsgDOM(sender, htmlText, id);
    saveMsgToHistory(sender, htmlText, id);
    return id; 
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

window.generateNotesListHTML = function(msgId) {
    let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    let keys = Object.keys(notes);
    let buttonsHtml = '<div class="notes-list-container">';
    keys.forEach(key => {
        buttonsHtml += `<button class="note-btn" onclick="openNoteFromButton('${key.replace(/'/g, "\\'")}', '${msgId}')">${key}</button>`;
    });
    buttonsHtml += '</div>';
    return `🗄 <b>Ваші збережені пам'ятки:</b><br><span style="font-size:12px; color:#aaa;">Натисніть на кнопку, щоб розгорнути код:</span>` + buttonsHtml;
};

window.openNoteFromButton = function(title, msgId) {
    let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    if (notes[title]) {
        let content = `📂 Ось ваш код <b>${title}</b>:<br>` + notes[title];
        content += `<br><div style="margin-top:10px; text-align:center;"><button class="note-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`;
        updateMsg(msgId, content);
    } else {
        updateMsg(msgId, `❌ Пам'ятку не знайдено.<br><div style="margin-top:10px;"><button class="note-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`);
    }
};

window.returnToNotesList = function(msgId) {
    let htmlContent = generateNotesListHTML(msgId);
    updateMsg(msgId, htmlContent);
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
            const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            if (keys.length === 0) {
                appendMsg('bot', `📭 Ваша кібер-пам'ять наразі порожня.`, msgId);
            } else {
                appendMsg('bot', generateNotesListHTML(msgId), msgId);
            }
        }
        else if (lowerText.startsWith("пам'ятка ") || lowerText.startsWith("пам’ятка ")) {
            const reqTitle = lowerText.replace(/пам['’]ятка /g, "").trim();
            let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
            if (notes[reqTitle]) { appendMsg('bot', `📂 Ось ваш код:<br>` + notes[reqTitle]); } 
            else { appendMsg('bot', `❌ Пам'ятку <b>${reqTitle}</b> не знайдено.`); }
        }
        else if (lowerText === 'кабінет') {
            localStorage.setItem(CABINET_KEY, 'true');
            document.getElementById('settings-btn')?.classList.remove('hidden');
            appendMsg('bot', 'Режим власника активний.');
        } else if (lowerText === 'вихід') {
            localStorage.removeItem(CABINET_KEY);
            document.getElementById('settings-btn')?.classList.add('hidden');
            appendMsg('bot', 'Режим користувача.');
        } else if (lowerText === 'очистити') {
            localStorage.removeItem(CHAT_KEY);
            document.getElementById('chat-messages').innerHTML = '';
            appendMsg('bot', '🧹 Пам\'ять очищено.');
        } 
    }, 600);
}

// --- ІНІЦІАЛІЗАЦІЯ ПРИ ЗАВАНТАЖЕННІ ---
window.onload = () => {
    renderCyberButtons();
};

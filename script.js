const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || 'guest';
const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;
const NOTES_KEY = `milka_notes_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');
const encodedData = urlParams.get('cd'); 

let cyberPages = { main: { buttons: [] }, burger: { buttons: [] }, pages: {}, pages_bg: {} };
let isEditMode = false;
let navStack = []; 

// ВИПРАВЛЕНЕ КОДУВАННЯ БЕЗ BASE64 (Читає чистий UTF-8 з Питона)
if (encodedData) {
    try {
        let decodedString = decodeURIComponent(encodedData);
        const parsed = JSON.parse(decodedString);
        cyberPages = { ...cyberPages, ...parsed };
    } catch (e) { console.error("Помилка декодування бази", e); }
}

// ГЛОБАЛЬНИЙ ФОН ПРИ ЗАВАНТАЖЕННІ
const globalBg = cyberPages.pages_bg && cyberPages.pages_bg['global'];
if (globalBg) { document.body.style.backgroundImage = `url('${globalBg}')`; } 
else { document.body.style.backgroundImage = 'none'; }

if (access === 'admin_king' || localStorage.getItem(CABINET_KEY) === 'true') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.classList.remove('hidden');
}

function neonizeEmoji(text) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    return text.replace(emojiRegex, '<span style="filter: drop-shadow(0 0 10px #bc13fe); font-size: 1.2em;">$1</span>');
}

function extractOnlyEmoji(text) {
    const match = text.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
    return match ? match[0] : '💠'; 
}

function goHome() {
    navStack = []; 
    const terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) terminal.classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
}

function goBack() {
    navStack.pop(); 
    if (navStack.length > 0) { renderTerminal(); } else { goHome(); }
}

function openTerminalPage(pageTitle) {
    if(pageTitle.includes('Око Юзера') || pageTitle.includes('Milka Bot') || pageTitle === '🏠') return;
    navStack.push(pageTitle); 
    renderTerminal();
}

function renderTerminal() {
    if (navStack.length === 0) return;
    const currentPage = navStack[navStack.length - 1]; 
    const titleEmoji = extractOnlyEmoji(currentPage); 
    
    document.getElementById('app-container').classList.add('hidden');
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
    
    let terminal = document.getElementById('dynamic-terminal-page');
    if (!terminal) {
        terminal = document.createElement('div');
        terminal.id = 'dynamic-terminal-page';
        terminal.className = 'neon-border';
        document.body.appendChild(terminal);
    }
    
    let dotsHtml = '';
    if (access === 'admin_king') {
        dotsHtml = `<div class="admin-dots" onclick="toggleSettings()">⋮</div>`;
    }

    terminal.innerHTML = `
        <div class="terminal-header">
            <div class="terminal-burger" onclick="toggleMenu()"><span></span><span></span><span></span></div>
            <div class="terminal-title">${neonizeEmoji(titleEmoji)}</div>
            <div class="terminal-right-controls">
                ${dotsHtml}
                <div class="close-cross-btn" onclick="goBack()">❌</div>
            </div>
        </div>
        <div class="terminal-content" id="terminal-buttons-container"></div>
    `;
    
    const pageBg = cyberPages.pages_bg && cyberPages.pages_bg[currentPage];
    if (pageBg) { terminal.style.backgroundImage = `url('${pageBg}')`; terminal.style.backgroundSize = 'cover'; }
    else { terminal.style.backgroundImage = 'none'; }
    
    terminal.classList.remove('hidden');

    const contentContainer = document.getElementById('terminal-buttons-container');
    if (cyberPages.pages && cyberPages.pages[currentPage]) {
        cyberPages.pages[currentPage].buttons.forEach(btn => {
            if (btn.role === 'owner' && access !== 'admin_king') return;
            const b = document.createElement('button');
            b.className = 'cyber-btn' + (btn.role === 'owner' ? ' secret-btn' : '');
            b.innerHTML = neonizeEmoji(btn.text);
            b.onclick = () => openTerminalPage(btn.text);
            
            const wrapper = document.createElement('div');
            wrapper.className = 'btn-wrapper';
            wrapper.dataset.id = btn.text;
            wrapper.dataset.loc = currentPage; 
            wrapper.appendChild(b);
            
            makeDraggable(wrapper, currentPage);
            contentContainer.appendChild(wrapper);
        });
    } else {
        contentContainer.innerHTML = `<div style="grid-column: span 2; text-align: center; color: #bc13fe; font-size: 12px; margin-top: 20px;">Порожньо...</div>`;
    }
}

function openUserEyeStudio() {
    let modal = document.getElementById('user-eye-studio');
    const adminView = document.getElementById('admin-view'); 

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'user-eye-studio';
        modal.className = 'neon-border'; 
        modal.style.cssText = "position:absolute; top:10px; left:10px; right:10px; bottom:10px; z-index:500; display:flex; flex-direction:column; overflow:hidden;";
        
        let dotsHtml = '';
        if (access === 'admin_king') {
            dotsHtml = `<div class="admin-dots" onclick="toggleSettings()">⋮</div>`;
        }

        const header = document.createElement('div');
        header.className = 'terminal-header';
        
        header.innerHTML = `
            <div class="terminal-burger" onclick="toggleMenu()"><span></span><span></span><span></span></div>
            <div class="terminal-title">${neonizeEmoji('👁️')}</div>
            <div class="terminal-right-controls">
                ${dotsHtml}
                <div class="close-cross-btn" id="close-eye-btn">❌</div>
            </div>
        `;
        
        modal.appendChild(header);

        const grid = document.createElement('div');
        grid.id = 'user-eye-grid';
        grid.style.cssText = "flex-grow:1; padding:20px; overflow-y:auto; display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; align-content:start;";
        modal.appendChild(grid);
        document.body.appendChild(modal);

        document.getElementById('close-eye-btn').onclick = () => {
            modal.style.display = 'none';
            if (adminView) adminView.style.display = 'block'; 
        };
    }
    
    if (adminView) adminView.style.display = 'none';

    const globalBg = cyberPages.pages_bg && cyberPages.pages_bg['global'];
    modal.style.backgroundImage = globalBg ? `url('${globalBg}')` : 'none';
    modal.style.backgroundSize = 'cover';
    
    const grid = document.getElementById('user-eye-grid');
    grid.innerHTML = ''; 
    
    if (cyberPages.main && cyberPages.main.buttons) {
        cyberPages.main.buttons.forEach(btn => {
            if (btn.role === 'user' && btn.location === 'main') {
                const b = document.createElement('button');
                b.className = 'cyber-btn';
                b.innerHTML = neonizeEmoji(btn.text);
                b.onclick = () => openTerminalPage(btn.text);
                
                const wrapper = document.createElement('div');
                wrapper.className = 'btn-wrapper';
                wrapper.dataset.id = btn.text;
                wrapper.dataset.loc = 'main';
                wrapper.appendChild(b);
                
                makeDraggable(wrapper, 'main');
                grid.appendChild(wrapper);
            }
        });
    }

    modal.style.display = 'flex';
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu(); 
        }
function toggleSettings() { 
    let menu = document.getElementById('settings-menu');
    if (!menu.querySelector('.edit-mode-btn') && access === 'admin_king') {
        const editBtn = document.createElement('button');
        editBtn.className = 'settings-item edit-mode-btn';
        editBtn.innerHTML = '🛠 Режим Конструктора';
        editBtn.onclick = () => {
            isEditMode = !isEditMode;
            menu.classList.add('hidden');
            renderCyberButtons();
            alert(isEditMode ? "🛠 Режим Конструктора УВІМКНЕНО. Перетягніть кнопки пальцем." : "🛠 Режим Конструктора ВИМКНЕНО.");
        };
        menu.insertBefore(editBtn, menu.firstChild);
    }
    menu.classList.toggle('hidden'); 
}

// --- ЛОГІКА СЕНСОРНОГО ПЕРЕТЯГУВАННЯ ---
let draggedItem = null;

function makeDraggable(el, location) {
    if (!isEditMode || access !== 'admin_king') return;
    el.classList.add('draggable-item');
    
    el.addEventListener('touchstart', function(e) {
        draggedItem = this;
        this.style.opacity = '0.4';
        this.style.transform = 'scale(1.05)';
        tg.HapticFeedback.impactOccurred('medium');
    }, {passive: false});

    el.addEventListener('touchmove', function(e) {
        if (!draggedItem) return;
        e.preventDefault(); 
        let touch = e.touches[0];
        let target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!target) return;
        let targetWrapper = target.closest('.btn-wrapper');
        
        if (targetWrapper && targetWrapper !== draggedItem && targetWrapper.dataset.loc === draggedItem.dataset.loc) {
            let rect = targetWrapper.getBoundingClientRect();
            let mid = rect.top + rect.height / 2;
            if (touch.clientY < mid) {
                targetWrapper.parentNode.insertBefore(draggedItem, targetWrapper);
            } else {
                targetWrapper.parentNode.insertBefore(draggedItem, targetWrapper.nextSibling);
            }
        }
    }, {passive: false});

    el.addEventListener('touchend', function(e) {
        if (!draggedItem) return;
        this.style.opacity = '1';
        this.style.transform = 'scale(1)';
        
        let parent = this.parentNode;
        let newOrder = Array.from(parent.querySelectorAll('.btn-wrapper')).map(w => w.dataset.id);
        
        tg.HapticFeedback.impactOccurred('heavy');
        tg.sendData(JSON.stringify({ action: "reorder", loc: this.dataset.loc, new_order: newOrder }));
        draggedItem = null;
    });
}

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

    const menuContent = document.querySelector('.menu-content');
    if (menuContent && !document.getElementById('home-btn-burger')) {
        const homeBtn = document.createElement('button');
        homeBtn.id = 'home-btn-burger';
        homeBtn.innerHTML = '🏠';
        homeBtn.className = 'cyber-btn home-btn-burger';
        homeBtn.onclick = goHome;
        menuContent.insertBefore(homeBtn, menuContent.firstChild);
    }

    if (access === 'admin_king' && !document.getElementById('trigger-eye-btn') && ownerNav) {
        const eyeBtn = document.createElement('button');
        eyeBtn.id = 'trigger-eye-btn';
        eyeBtn.className = 'cyber-btn secret-btn';
        eyeBtn.style.marginBottom = '5px';
        eyeBtn.innerHTML = neonizeEmoji('👁️ Око Юзера');
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
    wrapper.dataset.id = btn.text;
    wrapper.dataset.loc = location;
    
    const b = document.createElement('button');
    b.className = 'cyber-btn' + (btn.role === 'owner' ? ' secret-btn' : ''); 
    if (location === 'burger') b.style.marginBottom = '5px';
    b.innerHTML = neonizeEmoji(btn.text);
    b.onclick = () => openTerminalPage(btn.text);
    
    wrapper.appendChild(b);
    makeDraggable(wrapper, location);
    if(container) container.appendChild(wrapper);
}

// --- ІНДИВІДУАЛЬНІ ФОНИ СТОРІНОК ---
function triggerBgUpload() { document.getElementById('bg-upload').click(); toggleSettings(); }

function changeBackground(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (access === 'admin_king') {
        let currentPage = 'global';
        if (navStack.length > 0) { currentPage = navStack[navStack.length - 1]; }
        
        tg.sendData(JSON.stringify({ action: "request_photo", page: currentPage }));
        alert(`🦾 Сигнал передано Питону! \n\nВідправ фото боту в повідомлення. Воно встановиться для сторінки: ${currentPage}`);
        setTimeout(() => { tg.close(); }, 500);
    }
}

function resetBackground() {
    if (access === 'admin_king') {
        let currentPage = 'global';
        if (navStack.length > 0) { currentPage = navStack[navStack.length - 1]; }
        
        tg.sendData(JSON.stringify({ action: "reset_bg", page: currentPage }));
        alert(`🧹 Фон для сторінки ${currentPage} видалено!`);
        setTimeout(() => { tg.close(); }, 500);
    }
    toggleSettings();
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }
function closeApp() { tg.close(); }

// --- ЧАТ ---
const chatInput = document.getElementById('chat-input');
const formatTrigger = document.getElementById('format-trigger');
const formatMenu = document.getElementById('format-menu');
if (chatInput) { chatInput.addEventListener('input', () => { if (chatInput.innerText.trim().length > 0) { formatTrigger.classList.remove('hidden'); } else { formatTrigger.classList.add('hidden'); formatMenu.classList.add('hidden'); } }); }
function toggleFormatMenu() { formatMenu.classList.toggle('hidden'); }
function applyFormat(type, event) {
    event.preventDefault(); const selection = window.getSelection(); if (!selection.rangeCount) return;
    switch(type) {
        case 'bold': document.execCommand('bold'); break; case 'italic': document.execCommand('italic'); break; case 'strikethrough': document.execCommand('strikeThrough'); break; case 'underline': document.execCommand('underline'); break; case 'monospaced': document.execCommand('fontName', false, 'monospace'); break;
        case 'link': let url = prompt("Введіть посилання (URL):"); if (url) document.execCommand('createLink', false, url); break; case 'plain': document.execCommand('removeFormat'); break;
        case 'codeBlock': const text = selection.toString(); let codeTitle = prompt("Введіть назву для коду:", "Код"); if (codeTitle === null) { formatMenu.classList.add('hidden'); return; } if (codeTitle.trim() === '') { codeTitle = "Код"; }
            const codeHTML = `<div class="custom-code-block" contenteditable="false"><div class="code-header"><span>${codeTitle}</span><span style="cursor:pointer;" onclick="copyMyCode(this)">📋 Копіювати</span></div><pre class="code-content" contenteditable="true">${text || '// Вставте ваш код сюди...'}</pre></div><br>`;
            document.execCommand('insertHTML', false, codeHTML); break;
    }
    formatMenu.classList.add('hidden');
}
function copyMyCode(btn) { const pre = btn.parentElement.nextElementSibling; navigator.clipboard.writeText(pre.innerText).then(() => { const originalText = btn.innerText; btn.innerText = '✅ Скопійовано!'; setTimeout(() => { btn.innerText = originalText; }, 2000); }); }
let pendingMedia = []; 
function handleAttachment(event) {
    const files = event.target.files; if (!files.length) return;
    for(let i = 0; i < files.length; i++) {
        const file = files[i]; const reader = new FileReader();
        reader.onload = function(e) { const dataUrl = e.target.result; const isVideo = file.type.startsWith('video/'); pendingMedia.push({ type: isVideo ? 'video' : 'image', src: dataUrl }); renderMediaPreview(); }
        reader.readAsDataURL(file);
    } event.target.value = ""; 
}
function renderMediaPreview() {
    const container = document.getElementById('media-preview-container'); container.innerHTML = '';
    if (pendingMedia.length === 0) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    pendingMedia.forEach((media, index) => {
        const div = document.createElement('div'); div.className = 'preview-item';
        if (media.type === 'video') { div.innerHTML = `<video src="${media.src}"></video><div class="preview-remove" onclick="removePendingMedia(${index})">❌</div>`; } 
        else { div.innerHTML = `<img src="${media.src}"><div class="preview-remove" onclick="removePendingMedia(${index})">❌</div>`; }
        container.appendChild(div);
    });
}
function removePendingMedia(index) { pendingMedia.splice(index, 1); renderMediaPreview(); }
let msgToDeleteId = null; let msgToDeleteDiv = null; const deleteConfirmModal = document.getElementById('delete-confirm-modal');
if (document.getElementById('btn-cancel-delete')) { document.getElementById('btn-cancel-delete').addEventListener('click', () => { deleteConfirmModal.classList.add('hidden'); msgToDeleteId = null; msgToDeleteDiv = null; }); }
if (document.getElementById('btn-confirm-delete')) { document.getElementById('btn-confirm-delete').addEventListener('click', () => { if (msgToDeleteId && msgToDeleteDiv) { deleteMsgFromHistory(msgToDeleteId); msgToDeleteDiv.remove(); } deleteConfirmModal.classList.add('hidden'); msgToDeleteId = null; msgToDeleteDiv = null; }); }
function loadChatHistory() {
    const box = document.getElementById('chat-messages'); if (!box) return; box.innerHTML = ''; let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    if (history.length === 0) { appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.'); } else { history.forEach(item => { if (!item.id) item.id = Date.now().toString() + Math.random().toString(36).substr(2, 5); appendMsgDOM(item.sender, item.text, item.id); }); localStorage.setItem(CHAT_KEY, JSON.stringify(history)); }
}
function saveMsgToHistory(sender, htmlText, id) { let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; history.push({ id: id, sender: sender, text: htmlText }); localStorage.setItem(CHAT_KEY, JSON.stringify(history)); }
function deleteMsgFromHistory(id) { let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; history = history.filter(msg => msg.id !== id); localStorage.setItem(CHAT_KEY, JSON.stringify(history)); }
function updateMsg(id, newHtml) { const msgDiv = document.querySelector(`.msg[data-id="${id}"]`); if (msgDiv) { msgDiv.innerHTML = newHtml; let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; let msgIndex = history.findIndex(m => m.id === id); if (msgIndex !== -1) { history[msgIndex].text = newHtml; localStorage.setItem(CHAT_KEY, JSON.stringify(history)); } } }
function appendMsgDOM(sender, htmlText, id) {
    const box = document.getElementById('chat-messages'); if (!box) return;
    const div = document.createElement('div'); div.classList.add('msg', sender); div.innerHTML = htmlText; div.dataset.id = id;
    let pressTimer; const startPress = (e) => { if (e.type === 'click' && e.button !== 0) return; pressTimer = setTimeout(() => { msgToDeleteId = id; msgToDeleteDiv = div; deleteConfirmModal.classList.remove('hidden'); }, 800); };
    const cancelPress = () => { clearTimeout(pressTimer); };
    div.addEventListener('mousedown', startPress); div.addEventListener('touchstart', startPress); div.addEventListener('mouseup', cancelPress); div.addEventListener('mouseleave', cancelPress); div.addEventListener('touchend', cancelPress); div.addEventListener('touchmove', cancelPress);
    box.appendChild(div); box.scrollTop = box.scrollHeight;
}
function appendMsg(sender, htmlText, forcedId = null) { const id = forcedId || Date.now().toString() + Math.random().toString(36).substr(2, 5); appendMsgDOM(sender, htmlText, id); saveMsgToHistory(sender, htmlText, id); return id; }
function openChat() { toggleMenu(); document.getElementById('app-container').classList.add('hidden'); document.getElementById('chat-modal').classList.remove('hidden'); loadChatHistory(); }
function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); document.getElementById('app-container').classList.remove('hidden'); }
window.generateNotesListHTML = function(msgId) { let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; let keys = Object.keys(notes); let buttonsHtml = '<div class="notes-list-container">'; keys.forEach(key => { buttonsHtml += `<button class="note-btn" onclick="openNoteFromButton('${key.replace(/'/g, "\\'")}', '${msgId}')">${key}</button>`; }); buttonsHtml += '</div>'; return `🗄 <b>Ваші збережені пам'ятки:</b><br><span style="font-size:12px; color:#aaa;">Натисніть на кнопку, щоб розгорнути код:</span>` + buttonsHtml; };
window.openNoteFromButton = function(title, msgId) { let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; if (notes[title]) { updateMsg(msgId, `📂 Ось ваш код <b>${title}</b>:<br>` + notes[title] + `<br><div style="margin-top:10px; text-align:center;"><button class="note-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`); } else { updateMsg(msgId, `❌ Пам'ятку не знайдено.<br><div style="margin-top:10px;"><button class="note-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`); } };
window.returnToNotesList = function(msgId) { let htmlContent = generateNotesListHTML(msgId); updateMsg(msgId, htmlContent); };
let awaitingNote = false;
function sendMessage() {
    const htmlText = chatInput.innerHTML.trim(); const rawText = chatInput.innerText.trim();
    if (!rawText && !htmlText.includes('<img') && !htmlText.includes('<div') && pendingMedia.length === 0) return;
    if (awaitingNote) {
        const tempDiv = document.createElement('div'); tempDiv.innerHTML = htmlText; const codeHeaderSpan = tempDiv.querySelector('.code-header span:first-child');
        if (codeHeaderSpan) { const noteTitle = codeHeaderSpan.innerText.trim(); let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; notes[noteTitle.toLowerCase()] = htmlText; localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); appendMsg('bot', `💾 Код <b>${noteTitle}</b> успішно завантажено в кібер-пам'ять!`); } else { appendMsg('bot', `❌ Відмінено. Ви не відправили форматований блок коду (через &lt;/&gt;).`); }
        awaitingNote = false; chatInput.innerHTML = ''; pendingMedia = []; renderMediaPreview(); formatTrigger.classList.add('hidden'); formatMenu.classList.add('hidden'); return; 
    }
    let mediaHtml = ''; pendingMedia.forEach(media => { if (media.type === 'video') { mediaHtml += `<video src="${media.src}" controls></video><br>`; } else { mediaHtml += `<img src="${media.src}"><br>`; } });
    const finalMessageHtml = mediaHtml + htmlText; appendMsg('user', finalMessageHtml);
    chatInput.innerHTML = ''; pendingMedia = []; renderMediaPreview(); formatTrigger.classList.add('hidden'); formatMenu.classList.add('hidden');
    setTimeout(() => {
        const lowerText = rawText.toLowerCase();
        if (lowerText === '+пам\'ятка' || lowerText === '+пам’ятка') { awaitingNote = true; appendMsg('bot', 'Що ви хочете зберегти? Відправте текст у вигляді кода (через <b>⋮</b> -> <b>&lt;/&gt;</b>).'); } 
        else if (lowerText === 'пам\'ятки' || lowerText === 'пам’ятки') { let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; let keys = Object.keys(notes); const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 5); if (keys.length === 0) { appendMsg('bot', `📭 Ваша кібер-пам'ять наразі порожня.`, msgId); } else { appendMsg('bot', generateNotesListHTML(msgId), msgId); } }
        else if (lowerText.startsWith("пам'ятка ") || lowerText.startsWith("пам’ятка ")) { const reqTitle = lowerText.replace(/пам['’]ятка /g, "").trim(); let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; if (notes[reqTitle]) { appendMsg('bot', `📂 Ось ваш код:<br>` + notes[reqTitle]); } else { appendMsg('bot', `❌ Пам'ятку <b>${reqTitle}</b> не знайдено.`); } }
        else if (lowerText === 'кабінет') { localStorage.setItem(CABINET_KEY, 'true'); document.getElementById('settings-btn')?.classList.remove('hidden'); appendMsg('bot', 'Режим власника активний.'); } 
        else if (lowerText === 'вихід') { localStorage.removeItem(CABINET_KEY); document.getElementById('settings-btn')?.classList.add('hidden'); appendMsg('bot', 'Режим користувача.'); } 
        else if (lowerText === 'очистити') { localStorage.removeItem(CHAT_KEY); document.getElementById('chat-messages').innerHTML = ''; appendMsg('bot', '🧹 Пам\'ять очищено.'); } 
    }, 600);
}

window.onload = () => { renderCyberButtons(); };
            
    

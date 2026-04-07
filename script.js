const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || 'guest';
const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;
const NOTES_KEY = `milka_notes_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');
const globalBg = urlParams.get('bg'); 
const encodedData = urlParams.get('cd'); 

let cyberPages = { main: { buttons: [] }, burger: { buttons: [] }, pages: {}, pages_bg: {} };
let isEditMode = false;
let navStack = []; 

if (encodedData) {
    try {
        let decodedString;
        try { decodedString = decodeURIComponent(encodedData); } 
        catch (e) { decodedString = decodeURIComponent(escape(atob(encodedData))); }
        const parsed = JSON.parse(decodedString);
        cyberPages = { ...cyberPages, ...parsed };
    } catch (e) { console.error("Помилка декодування бази", e); }
}

const initGlobalBg = cyberPages.pages_bg && cyberPages.pages_bg['global'];
if (initGlobalBg) { document.body.style.backgroundImage = `url('${initGlobalBg}')`; } 
else if (globalBg) { document.body.style.backgroundImage = `url('${globalBg}')`; } 
else {
    const savedBg = localStorage.getItem(`milka_bg_${userId}`);
    if (savedBg) document.body.style.backgroundImage = `url('${savedBg}')`; 
}

if (access === 'admin_king' || localStorage.getItem(CABINET_KEY) === 'true') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.classList.remove('hidden');
}

function goHome() {
    if (isEditMode) { alert("⚠️ Спочатку збережіть або відмініть зміни."); return; }
    navStack = []; 
    const terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) { terminal.classList.add('hidden'); terminal.remove(); }
    document.getElementById('app-container').classList.remove('hidden');
    hideContextMenu();
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu.classList.contains('active')) toggleMenu();
}

function goBack() {
    if (isEditMode) { alert("⚠️ Спочатку збережіть або відмініть зміни."); return; }
    navStack.pop(); 
    if (navStack.length > 0) renderTerminal(); else goHome(); 
}

function openTerminalPage(pageTitle) {
    if (isEditMode) return; 
    if(pageTitle.includes('Око Юзера') || pageTitle.includes('Milka Bot') || pageTitle === '🏠') return;
    navStack.push(pageTitle); 
    renderTerminal();
}

// =======================================================================
// --- АБСОЛЮТНЕ ПОЗИЦІОНУВАННЯ (РОБОЧИЙ СТІЛ) ---
// =======================================================================
function applyAbsolutePosition(wrapper, index, loc) {
    wrapper.style.position = 'absolute';
    wrapper.style.width = '45%'; 
    wrapper.style.margin = '0';

    let foundCoord = null;
    
    // ПРІОРИТЕТ 1: Дані з бази даних (Python), якщо вони там є
    if (cyberPages.pages_coords && cyberPages.pages_coords[loc] && cyberPages.pages_coords[loc][wrapper.dataset.id]) {
        foundCoord = cyberPages.pages_coords[loc][wrapper.dataset.id];
    } 
    // ПРІОРИТЕТ 2: Локальна пам'ять (тимчасово)
    else {
        let localLayout = JSON.parse(localStorage.getItem('milka_coords_' + userId)) || {};
        if (localLayout[loc] && localLayout[loc][wrapper.dataset.id]) {
            foundCoord = localLayout[loc][wrapper.dataset.id];
        }
    }

    if (foundCoord) {
        wrapper.style.left = foundCoord.left;
        wrapper.style.top = foundCoord.top;
    } else {
        // По замовчуванню в 2 колонки
        let isRightCol = index % 2 !== 0;
        let row = Math.floor(index / 2);
        wrapper.style.left = isRightCol ? '52%' : '3%';
        wrapper.style.top = (row * 50) + 'px';
    }
}

function makeDraggable(wrapper) {
    let offsetX = 0, offsetY = 0;

    wrapper.addEventListener('touchstart', function(e) {
        if (!isEditMode || access !== 'admin_king') return;
        tg.HapticFeedback.impactOccurred('medium');

        let rect = this.getBoundingClientRect();
        let parentRect = this.parentNode.getBoundingClientRect();
        let touch = e.touches[0];

        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;

        this.style.zIndex = '9999';
        this.style.boxShadow = '0 0 20px #bc13fe';
        this.style.opacity = '0.9';
    }, {passive: false});

    wrapper.addEventListener('touchmove', function(e) {
        if (!isEditMode || access !== 'admin_king') return;
        e.preventDefault(); 
        let touch = e.touches[0];
        let parentRect = this.parentNode.getBoundingClientRect();

        let newLeft = touch.clientX - parentRect.left - offsetX;
        let newTop = touch.clientY - parentRect.top - offsetY;

        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        if (newLeft + this.offsetWidth > parentRect.width) newLeft = parentRect.width - this.offsetWidth;
        if (newTop + this.offsetHeight > parentRect.height) newTop = parentRect.height - this.offsetHeight;

        this.style.left = newLeft + 'px';
        this.style.top = newTop + 'px';
    }, {passive: false});

    wrapper.addEventListener('touchend', function(e) {
        if (!isEditMode || access !== 'admin_king') return;
        this.style.zIndex = '1';
        this.style.boxShadow = '0 0 5px rgba(188, 19, 254, 0.2)';
        this.style.opacity = '1';
        tg.HapticFeedback.impactOccurred('light');

        let parentRect = this.parentNode.getBoundingClientRect();
        let leftPx = parseFloat(this.style.left);
        let topPx = parseFloat(this.style.top);

        // Фіксуємо у відсотках
        this.style.left = (leftPx / parentRect.width * 100) + '%';
        this.style.top = (topPx / parentRect.height * 100) + '%';
    });
}

// =======================================================================
// --- ЛОГІКА ЗБЕРЕЖЕННЯ ТА ВІДПРАВКИ ПИТОНУ ---
// =======================================================================

function saveLayout(type) {
    isEditMode = false;
    hideContextMenu();
    
    let loc = currentLocationForSave;
    let wrappers = [];
    if (type === 'user_eye') wrappers = document.querySelectorAll('#user-eye-grid .btn-wrapper');
    else wrappers = document.querySelectorAll(`.btn-wrapper[data-loc="${loc}"]`);

    let coordsData = {};
    let newOrderIds = [];

    wrappers.forEach(w => {
        coordsData[w.dataset.id] = {
            left: w.style.left,
            top: w.style.top
        };
        newOrderIds.push(w.dataset.id);
    });

    // 1. Зберігаємо локально для миттєвого ефекту
    let localLayout = JSON.parse(localStorage.getItem('milka_coords_' + userId)) || {};
    localLayout[loc] = coordsData;
    localStorage.setItem('milka_coords_' + userId, JSON.stringify(localLayout));

    tg.HapticFeedback.impactOccurred('heavy');

    // 2. ВІДПРАВЛЯЄМО ПИТОНУ (ДЛЯ ВСІХ І НАЗАВЖДИ)
    tg.sendData(JSON.stringify({ 
        action: "reorder", 
        loc: loc, 
        coords: coordsData, // Python повинен це зберегти!
        new_order: newOrderIds 
    }));

    alert("✅ Дизайн збережено та відправлено в систему!");
}

function cancelDragAndDrop(type) {
    isEditMode = false;
    hideContextMenu();
    if (currentLocationForSave === 'main') {
        if (document.getElementById('user-eye-studio')) openUserEyeStudio();
        else renderCyberButtons();
    } else {
        renderTerminal();
    }
    alert("❌ Зміни позицій скасовано.");
}

// =======================================================================

function renderTerminal() {
    if (navStack.length === 0) return;
    const currentPage = navStack[navStack.length - 1]; 
    
    document.getElementById('app-container').classList.add('hidden');
    hideContextMenu();
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu.classList.contains('active')) toggleMenu();
    
    let terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) terminal.remove(); 
    
    terminal = document.createElement('div');
    terminal.id = 'dynamic-terminal-page';
    terminal.className = 'neon-border';
    document.body.appendChild(terminal);
    
    let dotsHtml = '';
    if (access === 'admin_king') {
        dotsHtml = `<div class="admin-dots" onclick="toggleContextMenu(event, 'terminal', '${currentPage}')">⋮</div>`;
    }

    terminal.innerHTML = `
        <div class="terminal-header">
            <div class="terminal-burger" onclick="toggleMenu()">
                <span></span><span></span><span></span>
            </div>
            <div class="terminal-title"></div>
            <div class="terminal-right-controls">
                ${dotsHtml}
                <div class="close-cross-btn" onclick="goBack()">❌</div>
            </div>
        </div>
        <div class="terminal-content" id="terminal-buttons-container"></div>
    `;
    
    const pageBg = cyberPages.pages_bg && cyberPages.pages_bg[currentPage];
    if (pageBg) { terminal.style.backgroundImage = `url('${pageBg}')`; terminal.style.backgroundSize = 'cover'; }
    terminal.classList.remove('hidden');

    const contentContainer = document.getElementById('terminal-buttons-container');

    if (cyberPages.pages && cyberPages.pages[currentPage]) {
        let visibleIndex = 0;
        cyberPages.pages[currentPage].buttons.forEach((btn) => {
            if (btn.role === 'owner' && access !== 'admin_king') return;
            const wrapper = document.createElement('div');
            wrapper.className = 'btn-wrapper';
            wrapper.dataset.id = btn.text;
            wrapper.dataset.loc = currentPage; 
            
            const b = document.createElement('button');
            b.className = 'cyber-btn';
            if (btn.role === 'owner') b.classList.add('secret-btn');
            b.innerHTML = btn.text; 
            b.onclick = () => openTerminalPage(btn.text);
            
            wrapper.appendChild(b);
            makeDraggable(wrapper);
            applyAbsolutePosition(wrapper, visibleIndex, currentPage);
            contentContainer.appendChild(wrapper);
            visibleIndex++;
        });
    }
}

function openUserEyeStudio() {
    let modal = document.getElementById('user-eye-studio');
    const adminView = document.getElementById('admin-view'); 
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'user-eye-studio';
    modal.className = 'neon-border'; 
    
    let dotsHtml = '';
    if (access === 'admin_king') {
        dotsHtml = `<div class="admin-dots" onclick="toggleContextMenu(event, 'user_eye', 'main')">⋮</div>`;
    }

    const header = document.createElement('div');
    header.className = 'terminal-header';
    header.innerHTML = `
        <div class="terminal-burger" onclick="toggleMenu()">
            <span></span><span></span><span></span>
        </div>
        <div class="terminal-title"></div>
        <div class="terminal-right-controls">
            ${dotsHtml}
            <div class="close-cross-btn" id="close-eye-btn">❌</div>
        </div>
    `;
    modal.appendChild(header);

    const grid = document.createElement('div');
    grid.id = 'user-eye-grid';
    grid.className = 'eye-safe-zone';
    modal.appendChild(grid);
    document.body.appendChild(modal);

    document.getElementById('close-eye-btn').onclick = () => {
        if (isEditMode) { alert("⚠️ Закриття заблоковано. Спочатку збережіть або відмініть зміни."); return; }
        modal.remove();
        hideContextMenu();
        if (adminView) adminView.style.display = 'block'; 
    };
    
    if (adminView) adminView.style.display = 'none';

    const globalBgValue = cyberPages.pages_bg && cyberPages.pages_bg['global'];
    if (globalBgValue) { modal.style.backgroundImage = `url('${globalBgValue}')`; modal.style.backgroundSize = 'cover'; }
    
    grid.innerHTML = ''; 

    if (cyberPages.main && cyberPages.main.buttons) {
        let visibleIndex = 0;
        cyberPages.main.buttons.forEach((btn) => {
            if (btn.role === 'user' && btn.location === 'main') {
                const wrapper = document.createElement('div');
                wrapper.className = 'btn-wrapper';
                wrapper.dataset.id = btn.text;
                wrapper.dataset.loc = 'main';
                
                const b = document.createElement('button');
                b.className = 'cyber-btn';
                b.innerHTML = btn.text;
                b.onclick = () => openTerminalPage(btn.text);
                
                wrapper.appendChild(b);
                makeDraggable(wrapper);
                applyAbsolutePosition(wrapper, visibleIndex, 'main');
                grid.appendChild(wrapper);
                visibleIndex++;
            }
        });
    }

    modal.style.display = 'flex';
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu.classList.contains('active')) toggleMenu();
}

function toggleContextMenu(event, type, loc) {
    const menu = document.getElementById('context-menu');
    if (!menu.classList.contains('hidden')) { menu.classList.add('hidden'); return; }
    
    menu.innerHTML = '';
    currentLocationForSave = loc;
    
    if (isEditMode) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'settings-item';
        saveBtn.innerHTML = '💾 Зберегти позиції';
        saveBtn.onclick = () => saveLayout(type);
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'settings-item';
        cancelBtn.innerHTML = '❌ Відмінити зміни';
        cancelBtn.onclick = () => cancelDragAndDrop(type);
        
        menu.appendChild(saveBtn);
        menu.appendChild(cancelBtn);
    } else {
        if (type === 'user_eye') {
            const editBtn = document.createElement('button');
            editBtn.className = 'settings-item';
            editBtn.innerHTML = '🛠 Вільне Переміщення';
            editBtn.onclick = () => toggleEditMode(type);
            menu.appendChild(editBtn);
        } else {
            const bgBtn = document.createElement('button');
            bgBtn.className = 'settings-item';
            bgBtn.innerHTML = '🖼 Встановити фон';
            bgBtn.onclick = () => triggerBgUpload();
            
            const resetBtn = document.createElement('button');
            resetBtn.className = 'settings-item';
            resetBtn.innerHTML = '🗑 Видалити фон';
            resetBtn.onclick = () => resetBackground();
            
            const editBtn = document.createElement('button');
            editBtn.className = 'settings-item';
            editBtn.innerHTML = '🛠 Вільне Переміщення';
            editBtn.onclick = () => toggleEditMode(type);
            
            menu.appendChild(bgBtn);
            menu.appendChild(resetBtn);
            menu.appendChild(editBtn);
        }
    }

    const rect = event.target.getBoundingClientRect();
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px'; 
    menu.classList.remove('hidden');
}

function hideContextMenu() {
    const menu = document.getElementById('context-menu');
    if(menu) menu.classList.add('hidden');
}

function toggleEditMode(type) {
    isEditMode = true;
    hideContextMenu();
    alert("🛠 Вільне Переміщення УВІМКНЕНО.\nПеретягуйте кнопки куди завгодно. Потім натисніть 3 крапки і виберіть 'Зберегти позиції'.");
}

function renderCyberButtons() {
    const mainGrid = document.getElementById('user-commands-safe-zone');
    const userNav = document.getElementById('user-view');
    const ownerNav = document.getElementById('owner-view'); 
    
    if (mainGrid) mainGrid.innerHTML = '';
    if (userNav) userNav.innerHTML = '';
    if (ownerNav) ownerNav.innerHTML = '';

    const menuContent = document.querySelector('.menu-content');
    if (menuContent && !document.getElementById('home-btn-burger')) {
        const homeBtn = document.createElement('button');
        homeBtn.id = 'home-btn-burger';
        homeBtn.innerHTML = '🏠';
        homeBtn.className = 'cyber-btn';
        homeBtn.onclick = goHome;
        menuContent.insertBefore(homeBtn, menuContent.firstChild);
    }

    if (access === 'admin_king' && !document.getElementById('trigger-eye-btn') && ownerNav) {
        const eyeBtn = document.createElement('button');
        eyeBtn.id = 'trigger-eye-btn';
        eyeBtn.className = 'cyber-btn secret-btn';
        eyeBtn.innerHTML = '👁️ Око Юзера';
        eyeBtn.onclick = openUserEyeStudio;
        ownerNav.appendChild(eyeBtn); 
    }

    if (cyberPages.main && cyberPages.main.buttons) {
        let visibleIndex = 0;
        cyberPages.main.buttons.forEach((btn) => {
            if (access === 'admin_king') {
                if (btn.role === 'owner') { createButtonElement(btn, 'main', mainGrid, visibleIndex); visibleIndex++; }
            } else {
                if (btn.role === 'user') { createButtonElement(btn, 'main', mainGrid, visibleIndex); visibleIndex++; }
            }
        });
    }
    
    if (cyberPages.burger && cyberPages.burger.buttons) {
        cyberPages.burger.buttons.forEach((btn) => {
            if(btn.role === 'owner' && ownerNav) createButtonElement(btn, 'burger', ownerNav, 0);
            if(btn.role === 'user' && userNav) createButtonElement(btn, 'burger', userNav, 0);
        });
    }
}

function createButtonElement(btn, location, container, index) {
    const wrapper = document.createElement('div');
    wrapper.className = `btn-wrapper`;
    wrapper.dataset.id = btn.text;
    wrapper.dataset.loc = location;
    
    const b = document.createElement('button');
    b.className = 'cyber-btn';
    if (btn.role === 'owner') b.classList.add('secret-btn');
    b.innerHTML = btn.text;
    b.onclick = () => openTerminalPage(btn.text);
    
    wrapper.appendChild(b);
    
    if (location !== 'burger') {
        makeDraggable(wrapper);
        applyAbsolutePosition(wrapper, index, location);
    }
    
    if(container) container.appendChild(wrapper);
}

function triggerBgUpload() { 
    const bgUpload = document.getElementById('bg-upload');
    if (bgUpload) bgUpload.click(); 
    hideContextMenu(); 
}

function changeBackground(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (access === 'admin_king') {
        let currentPage = 'global';
        if (navStack.length > 0) currentPage = navStack[navStack.length - 1]; 
        tg.sendData(JSON.stringify({ action: "request_photo", page: currentPage }));
        alert(`🦾 Сигнал передано Питону! \n\nВідправ фото боту.`);
        setTimeout(() => { tg.close(); }, 500);
    }
}

function resetBackground() {
    if (access === 'admin_king') {
        let currentPage = 'global';
        if (navStack.length > 0) currentPage = navStack[navStack.length - 1]; 
        tg.sendData(JSON.stringify({ action: "reset_bg", page: currentPage }));
        alert(`🧹 Фон видалено!`);
        setTimeout(() => { tg.close(); }, 500);
    }
    hideContextMenu();
}

function toggleMenu() { 
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu) sideMenu.classList.toggle('active'); 
}
function closeApp() { tg.close(); }

// =======================================================================
// --- ЧАТ, ФОРМАТУВАННЯ ТА ПАМ'ЯТКИ (БЕЗ ЗМІН) ---
// =======================================================================
const chatInput = document.getElementById('chat-input');
const formatTrigger = document.getElementById('format-trigger');
const formatMenu = document.getElementById('format-menu');

if (chatInput) {
    chatInput.addEventListener('input', () => {
        if (chatInput.innerText.trim().length > 0) { formatTrigger.classList.remove('hidden'); } 
        else { formatTrigger.classList.add('hidden'); formatMenu.classList.add('hidden'); }
    });
}

function toggleFormatMenu() { if (formatMenu) formatMenu.classList.toggle('hidden'); }

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
        case 'link': let url = prompt("Введіть посилання (URL):"); if (url) document.execCommand('createLink', false, url); break;
        case 'plain': document.execCommand('removeFormat'); break;
        case 'codeBlock':
            const text = selection.toString();
            let codeTitle = prompt("Введіть назву для коду:", "Код");
            if (codeTitle === null) { formatMenu.classList.add('hidden'); return; }
            if (codeTitle.trim() === '') codeTitle = "Код"; 
            const codeHTML = `<div class="custom-code-block" contenteditable="false"><div class="code-header"><span>${codeTitle}</span><span style="cursor:pointer;" onclick="copyMyCode(this)">📋 Копіювати</span></div><pre class="code-content" contenteditable="true">${text || '// Вставте ваш код сюди...'}</pre></div><br>`;
            document.execCommand('insertHTML', false, codeHTML); break;
    }
    if (formatMenu) formatMenu.classList.add('hidden');
}

function copyMyCode(btn) {
    const pre = btn.parentElement.nextElementSibling;
    navigator.clipboard.writeText(pre.innerText).then(() => {
        const originalText = btn.innerText; btn.innerText = '✅ Скопійовано!';
        setTimeout(() => { btn.innerText = originalText; }, 2000);
    });
}

let pendingMedia = []; 
function handleAttachment(event) {
    const files = event.target.files; if (!files.length) return;
    for(let i = 0; i < files.length; i++) {
        const file = files[i]; const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result; const isVideo = file.type.startsWith('video/');
            pendingMedia.push({ type: isVideo ? 'video' : 'image', src: dataUrl }); renderMediaPreview();
        }
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
if (document.getElementById('btn-cancel-delete')) { document.getElementById('btn-cancel-delete').addEventListener('click', () => { if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden'); msgToDeleteId = null; msgToDeleteDiv = null; }); }
if (document.getElementById('btn-confirm-delete')) { document.getElementById('btn-confirm-delete').addEventListener('click', () => { if (msgToDeleteId && msgToDeleteDiv) { deleteMsgFromHistory(msgToDeleteId); msgToDeleteDiv.remove(); } if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden'); msgToDeleteId = null; msgToDeleteDiv = null; }); }

function loadChatHistory() {
    const box = document.getElementById('chat-messages'); if (!box) return;
    box.innerHTML = ''; let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    if (history.length === 0) { appendMsg('bot', 'Чекаю на команду, Максиме.'); } 
    else { history.forEach(item => { if (!item.id) item.id = Date.now().toString(); appendMsgDOM(item.sender, item.text, item.id); }); localStorage.setItem(CHAT_KEY, JSON.stringify(history)); }
}
function saveMsgToHistory(sender, htmlText, id) { let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; history.push({ id: id, sender: sender, text: htmlText }); localStorage.setItem(CHAT_KEY, JSON.stringify(history)); }
function deleteMsgFromHistory(id) { let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; history = history.filter(msg => msg.id !== id); localStorage.setItem(CHAT_KEY, JSON.stringify(history)); }
function updateMsg(id, newHtml) { const msgDiv = document.querySelector(`.msg[data-id="${id}"]`); if (msgDiv) { msgDiv.innerHTML = newHtml; let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; let msgIndex = history.findIndex(m => m.id === id); if (msgIndex !== -1) { history[msgIndex].text = newHtml; localStorage.setItem(CHAT_KEY, JSON.stringify(history)); } } }

function appendMsgDOM(sender, htmlText, id) {
    const box = document.getElementById('chat-messages'); if (!box) return;
    const div = document.createElement('div'); div.classList.add('msg', sender); div.innerHTML = htmlText; div.dataset.id = id;
    let pressTimer; const startPress = (e) => { if (e.type === 'click' && e.button !== 0) return; pressTimer = setTimeout(() => { msgToDeleteId = id; msgToDeleteDiv = div; if (deleteConfirmModal) deleteConfirmModal.classList.remove('hidden'); }, 800); }; const cancelPress = () => { clearTimeout(pressTimer); };
    div.addEventListener('mousedown', startPress); div.addEventListener('touchstart', startPress); div.addEventListener('mouseup', cancelPress); div.addEventListener('mouseleave', cancelPress); div.addEventListener('touchend', cancelPress); div.addEventListener('touchmove', cancelPress);
    box.appendChild(div); box.scrollTop = box.scrollHeight;
}
function appendMsg(sender, htmlText, forcedId = null) { const id = forcedId || Date.now().toString(); appendMsgDOM(sender, htmlText, id); saveMsgToHistory(sender, htmlText, id); return id; }
function openChat() { toggleMenu(); document.getElementById('app-container').classList.add('hidden'); document.getElementById('chat-modal').classList.remove('hidden'); loadChatHistory(); }
function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); document.getElementById('app-container').classList.remove('hidden'); }

window.generateNotesListHTML = function(msgId) {
    let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; let keys = Object.keys(notes); let buttonsHtml = '<div class="notes-list-container">';
    keys.forEach(key => { buttonsHtml += `<button class="cyber-btn" onclick="openNoteFromButton('${key.replace(/'/g, "\\'")}', '${msgId}')">${key}</button>`; });
    buttonsHtml += '</div>'; return `🗄 <b>Ваші збережені пам'ятки:</b><br>` + buttonsHtml;
};
window.openNoteFromButton = function(title, msgId) {
    let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    if (notes[title]) { let content = `📂 Код <b>${title}</b>:<br>` + notes[title]; content += `<br><button class="cyber-btn" onclick="returnToNotesList('${msgId}')">🔙 Назад</button>`; updateMsg(msgId, content); } 
    else { updateMsg(msgId, `❌ Не знайдено.<br><button class="cyber-btn" onclick="returnToNotesList('${msgId}')">🔙 Назад</button>`); }
};
window.returnToNotesList = function(msgId) { let htmlContent = generateNotesListHTML(msgId); updateMsg(msgId, htmlContent); };

let awaitingNote = false;
function sendMessage() {
    const htmlText = chatInput.innerHTML.trim(); const rawText = chatInput.innerText.trim();
    if (!rawText && !htmlText.includes('<img') && !htmlText.includes('<div') && pendingMedia.length === 0) return;
    
    if (awaitingNote) {
        const tempDiv = document.createElement('div'); tempDiv.innerHTML = htmlText; const codeHeaderSpan = tempDiv.querySelector('.code-header span:first-child');
        if (codeHeaderSpan) { const noteTitle = codeHeaderSpan.innerText.trim(); let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; notes[noteTitle.toLowerCase()] = htmlText; localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); appendMsg('bot', `💾 Код <b>${noteTitle}</b> збережено!`); } 
        else { appendMsg('bot', `❌ Помилка формату.`); }
        awaitingNote = false; chatInput.innerHTML = ''; pendingMedia = []; renderMediaPreview(); formatTrigger.classList.add('hidden'); formatMenu.classList.add('hidden'); return; 
    }

    let mediaHtml = ''; pendingMedia.forEach(media => { if (media.type === 'video') { mediaHtml += `<video src="${media.src}" controls></video><br>`; } else { mediaHtml += `<img src="${media.src}"><br>`; } });
    const finalMessageHtml = mediaHtml + htmlText; appendMsg('user', finalMessageHtml);
    chatInput.innerHTML = ''; pendingMedia = []; renderMediaPreview(); formatTrigger.classList.add('hidden'); formatMenu.classList.add('hidden');
    
    setTimeout(() => {
        const lowerText = rawText.toLowerCase();
        if (lowerText === '+пам\'ятка') { awaitingNote = true; appendMsg('bot', 'Відправ текст у вигляді кода.'); } 
        else if (lowerText === 'пам\'ятки') { let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; let keys = Object.keys(notes); const msgId = Date.now().toString(); if (keys.length === 0) { appendMsg('bot', `📭 Порожньо.`, msgId); } else { appendMsg('bot', generateNotesListHTML(msgId), msgId); } }
        else if (lowerText === 'кабінет') { localStorage.setItem(CABINET_KEY, 'true'); document.getElementById('settings-btn').classList.remove('hidden'); appendMsg('bot', 'Власник активний.'); } 
        else if (lowerText === 'вихід') { localStorage.removeItem(CABINET_KEY); document.getElementById('settings-btn').classList.add('hidden'); appendMsg('bot', 'Користувач.'); } 
        else if (lowerText === 'очистити') { localStorage.removeItem(CHAT_KEY); document.getElementById('chat-messages').innerHTML = ''; appendMsg('bot', '🧹 Очищено.'); } 
    }, 600);
}

window.onload = () => { renderCyberButtons(); };

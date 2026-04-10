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

let cyberPages = { main: { buttons: [] }, burger: { buttons: [] }, pages: {}, pages_bg: {}, pages_coords: {} };
let isEditMode = false;
let navStack = []; 
let editingTextId = null;

if (encodedData) {
    try {
        let decodedString;
        try { decodedString = decodeURIComponent(escape(atob(decodeURIComponent(encodedData)))); } 
        catch (e) {
            try { decodedString = decodeURIComponent(escape(atob(encodedData))); } 
            catch (e2) { decodedString = decodeURIComponent(encodedData); }
        }
        const parsed = JSON.parse(decodedString);
        if (parsed.main) cyberPages.main = parsed.main;
        if (parsed.burger) cyberPages.burger = parsed.burger;
        if (parsed.pages) cyberPages.pages = parsed.pages;
        if (parsed.pages_bg) cyberPages.pages_bg = parsed.pages_bg;
        if (parsed.pages_coords) cyberPages.pages_coords = parsed.pages_coords;
    } catch (e) { 
        console.error("Помилка декодування бази", e);
    }
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
    if (isEditMode) { document.getElementById('save-layout-modal').classList.remove('hidden'); return; }
    navStack = []; 
    const terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) { terminal.classList.add('hidden'); terminal.remove(); }
    document.getElementById('app-container').classList.remove('hidden');
    hideContextMenu();
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu && sideMenu.classList.contains('active')) toggleMenu();
}

function goBack() {
    if (isEditMode) { document.getElementById('save-layout-modal').classList.remove('hidden'); return; }
    navStack.pop(); 
    if (navStack.length > 0) renderTerminal(); else goHome(); 
}

function openTerminalPage(pageTitle) {
    if (isEditMode) return; 
    if(pageTitle.includes('Око Юзера') || pageTitle.includes('Milka Bot') || pageTitle === '🏠') return;
    navStack.push(pageTitle); 
    renderTerminal();
}

function applyAbsolutePosition(wrapper, index, loc) {
    wrapper.style.position = 'absolute';
    wrapper.style.margin = '0';
    if (loc === 'burger') { wrapper.style.width = '100%'; } else { wrapper.style.width = '38%'; }

    let foundCoord = null;
    if (cyberPages.pages_coords && cyberPages.pages_coords[loc] && cyberPages.pages_coords[loc][wrapper.dataset.id]) {
        foundCoord = cyberPages.pages_coords[loc][wrapper.dataset.id];
    } else {
        let localLayout = JSON.parse(localStorage.getItem('milka_coords_' + userId)) || {};
        if (localLayout[loc] && localLayout[loc][wrapper.dataset.id]) { foundCoord = localLayout[loc][wrapper.dataset.id]; }
    }

    if (foundCoord) {
        wrapper.style.left = foundCoord.left;
        wrapper.style.top = foundCoord.top;
    } else if (loc !== 'burger') {
        let isRightCol = index % 2 !== 0;
        let row = Math.floor(index / 2);
        wrapper.style.left = isRightCol ? '54%' : '8%';
        wrapper.style.top = (80 + row * 60) + 'px';
    }
}

function makeDraggable(wrapper) {
    let offsetX = 0, offsetY = 0;
    wrapper.addEventListener('touchstart', function(e) {
        if (!isEditMode || access !== 'admin_king') return;
        if(e.target.classList.contains('delete-text-btn') || e.target.classList.contains('edit-text-btn')) return;
        tg.HapticFeedback.impactOccurred('medium');
        let rect = this.getBoundingClientRect();
        let touch = e.touches[0];
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
        this.style.zIndex = '9999';
        this.style.opacity = '0.9';
    }, {passive: false});

    wrapper.addEventListener('touchmove', function(e) {
        if (!isEditMode || access !== 'admin_king') return;
        if(e.target.classList.contains('delete-text-btn') || e.target.classList.contains('edit-text-btn')) return;
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
        this.style.zIndex = '10';
        this.style.opacity = '1';
        let parentRect = this.parentNode.getBoundingClientRect();
        let leftPx = parseFloat(this.style.left);
        let topPx = parseFloat(this.style.top);
        this.style.left = (leftPx / parentRect.width * 100) + '%';
        this.style.top = (topPx / parentRect.height * 100) + '%';
    });
}

function saveLayout(type) {
    isEditMode = false;
    hideContextMenu();
    document.getElementById('save-layout-modal').classList.add('hidden');
    document.querySelectorAll('.text-wrapper').forEach(w => w.classList.remove('editing-active'));
    
    let loc = currentLocationForSave;
    let wrappers = [];
    if (type === 'user_eye') wrappers = document.querySelectorAll('#user-eye-grid .btn-wrapper');
    else wrappers = document.querySelectorAll(`.btn-wrapper[data-loc="${loc}"]`);

    let coordsData = {};
    let newOrderIds = [];
    let textBlocks = []; 

    wrappers.forEach(w => {
        coordsData[w.dataset.id] = { left: w.style.left, top: w.style.top };
        if (w.dataset.type === 'text') {
            textBlocks.push({
                id: w.dataset.id,
                html: w.querySelector('.custom-text-block').innerHTML,
                left: w.style.left,
                top: w.style.top,
                size: w.dataset.size || 12 
            });
        } else {
            newOrderIds.push(w.dataset.id);
        }
    });

    let localLayout = JSON.parse(localStorage.getItem('milka_coords_' + userId)) || {};
    localLayout[loc] = coordsData;
    localStorage.setItem('milka_coords_' + userId, JSON.stringify(localLayout));
    
    let localTexts = JSON.parse(localStorage.getItem('milka_custom_texts_' + userId)) || {};
    localTexts[loc] = textBlocks;
    localStorage.setItem('milka_custom_texts_' + userId, JSON.stringify(localTexts));

    tg.HapticFeedback.impactOccurred('heavy');
    tg.sendData(JSON.stringify({ action: "reorder", loc: loc, coords: coordsData, new_order: newOrderIds }));
    if (type !== 'auto') alert("✅ Збережено!");
}

function renderTerminal() {
    if (navStack.length === 0) return;
    const currentPage = navStack[navStack.length - 1]; 
    document.getElementById('app-container').classList.add('hidden');
    hideContextMenu();
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu && sideMenu.classList.contains('active')) toggleMenu();
    
    let terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) terminal.remove(); 
    
    terminal = document.createElement('div');
    terminal.id = 'dynamic-terminal-page';
    terminal.className = 'neon-border';
    terminal.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
    document.body.appendChild(terminal);
    
    let dotsHtml = '';
    if (access === 'admin_king') { dotsHtml = `<div class="admin-dots" onclick="toggleContextMenu(event, 'terminal', '${currentPage}')">⋮</div>`; }

    terminal.innerHTML = `
        <div class="terminal-header">
            <div class="terminal-burger" onclick="toggleMenu()"><span></span><span></span><span></span></div>
            <div class="terminal-right-controls">
                ${dotsHtml}
                <div class="close-cross-btn" onclick="goBack()">❌</div>
            </div>
        </div>
        <div class="terminal-content mask-scroll" id="terminal-buttons-container" style="background:transparent; position:relative; width:100%; height:100%;"></div>
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
            b.className = 'cyber-btn btn-small' + (btn.role === 'owner' ? ' secret-btn' : '');
            b.innerHTML = btn.text; 
            b.onclick = () => openTerminalPage(btn.text);
            
            wrapper.appendChild(b);
            makeDraggable(wrapper);
            applyAbsolutePosition(wrapper, visibleIndex, currentPage);
            contentContainer.appendChild(wrapper);
            visibleIndex++;
        });
    }

    let localTexts = JSON.parse(localStorage.getItem('milka_custom_texts_' + userId)) || {};
    if (localTexts[currentPage]) {
        localTexts[currentPage].forEach(tb => {
            renderTextBlockDOM(tb.id, tb.html, currentPage, tb.left, tb.top, tb.size);
        });
    }
}

let currentLocationForSave = 'main';

function toggleContextMenu(event, type, loc) {
    const menu = document.getElementById('context-menu');
    if (!menu) return;
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

        if (loc !== 'main' && loc !== 'burger') {
            const addTextBtn = document.createElement('button');
            addTextBtn.className = 'settings-item';
            addTextBtn.innerHTML = '📝 Додати текст';
            addTextBtn.onclick = () => {
                hideContextMenu();
                editingTextId = null;
                const input = document.getElementById('custom-text-input');
                input.innerHTML = '';
                input.style.fontSize = '12px'; 
                document.getElementById('text-size-slider').value = 12;
                document.getElementById('text-size-display').innerText = '12px';
                document.getElementById('text-editor-modal').classList.remove('hidden');
            };
            menu.appendChild(addTextBtn);
        }
    }

    const rect = event.target.getBoundingClientRect();
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px'; 
    menu.classList.remove('hidden');
}

function hideContextMenu() { document.getElementById('context-menu')?.classList.add('hidden'); }

function toggleEditMode(type) {
    isEditMode = true;
    hideContextMenu();
    document.querySelectorAll('.text-wrapper').forEach(w => w.classList.add('editing-active'));
    tg.HapticFeedback.notificationOccurred('success');
}

function cancelDragAndDrop(type) {
    isEditMode = false;
    hideContextMenu();
    document.getElementById('save-layout-modal').classList.add('hidden');
    document.querySelectorAll('.text-wrapper').forEach(w => w.classList.remove('editing-active'));
    
    if (currentLocationForSave === 'main') { renderCyberButtons(); } 
    else { renderTerminal(); }
}

function renderCyberButtons() {
    const mainGrid = document.getElementById('user-commands-safe-zone');
    const ownerNav = document.getElementById('owner-view'); 
    const userNav = document.getElementById('user-view'); 
    if (mainGrid) mainGrid.innerHTML = '';
    
    if (cyberPages.main && cyberPages.main.buttons) {
        let visibleIndex = 0;
        cyberPages.main.buttons.forEach((btn) => {
            if (btn.role === 'owner' && access !== 'admin_king') return;
            createButtonElement(btn, 'main', mainGrid, visibleIndex); visibleIndex++;
        });
    }
}

function createButtonElement(btn, location, container, index) {
    const wrapper = document.createElement('div');
    wrapper.className = `btn-wrapper`;
    wrapper.dataset.id = btn.text;
    wrapper.dataset.loc = location;
    
    const b = document.createElement('button');
    const sizeClass = (location !== 'burger') ? 'btn-small' : '';
    b.className = ('cyber-btn ' + sizeClass + (btn.role === 'owner' ? ' secret-btn' : '')).trim();
    b.innerHTML = btn.text;
    b.onclick = () => openTerminalPage(btn.text);
    
    wrapper.appendChild(b);
    if (location !== 'burger') { makeDraggable(wrapper); applyAbsolutePosition(wrapper, index, location); }
    if(container) container.appendChild(wrapper);
}

function triggerBgUpload() { document.getElementById('bg-upload')?.click(); hideContextMenu(); }

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

function toggleMenu() { document.getElementById('side-menu')?.classList.toggle('active'); }
function closeApp() { tg.close(); }

const chatInput = document.getElementById('chat-input');
const formatTrigger = document.getElementById('format-trigger');
const formatMenu = document.getElementById('format-menu');

if (chatInput) {
    chatInput.addEventListener('input', () => {
        if (chatInput.innerText.trim().length > 0) { if(formatTrigger) formatTrigger.classList.remove('hidden'); } 
        else { if(formatTrigger) formatTrigger.classList.add('hidden'); if(formatMenu) formatMenu.classList.add('hidden'); }
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
        case 'link': 
            let url = prompt("🔗 Введіть посилання (наприклад, https://t.me/...):"); 
            if (url) {
                if (selection.toString().trim() === '') {
                    let linkText = prompt("📝 Введіть текст для цього посилання:", "Натисни сюди");
                    if (linkText) {
                        const linkHTML = `<a href="${url}" target="_blank" style="color: #bc13fe; text-decoration: underline; text-shadow: 0 0 5px #bc13fe;">${linkText}</a>`;
                        document.execCommand('insertHTML', false, linkHTML);
                    }
                } else {
                    const selectedText = selection.toString();
                    const linkHTML = `<a href="${url}" target="_blank" style="color: #bc13fe; text-decoration: underline; text-shadow: 0 0 5px #bc13fe;">${selectedText}</a>`;
                    document.execCommand('insertHTML', false, linkHTML);
                }
            } 
            break;
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

function loadChatHistory() {
    const box = document.getElementById('chat-messages'); if (!box) return;
    box.innerHTML = ''; let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    if (history.length === 0) { appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.'); } 
    else { history.forEach(item => { if (!item.id) item.id = Date.now().toString(); appendMsgDOM(item.sender, item.text, item.id); }); localStorage.setItem(CHAT_KEY, JSON.stringify(history)); }
}
function saveMsgToHistory(sender, htmlText, id) { let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; history.push({ id: id, sender: sender, text: htmlText }); localStorage.setItem(CHAT_KEY, JSON.stringify(history)); }
function deleteMsgFromHistory(id) { let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; history = history.filter(msg => msg.id !== id); localStorage.setItem(CHAT_KEY, JSON.stringify(history)); }

function appendMsgDOM(sender, htmlText, id) {
    const box = document.getElementById('chat-messages'); if (!box) return;
    const div = document.createElement('div'); div.classList.add('msg', sender); div.innerHTML = htmlText; div.dataset.id = id;
    box.appendChild(div); box.scrollTop = box.scrollHeight;
}
function appendMsg(sender, htmlText, forcedId = null) { const id = forcedId || Date.now().toString(); appendMsgDOM(sender, htmlText, id); saveMsgToHistory(sender, htmlText, id); return id; }
function openChat() { if(typeof toggleMenu === 'function') toggleMenu(); document.getElementById('app-container').classList.add('hidden'); document.getElementById('chat-modal').classList.remove('hidden'); loadChatHistory(); }
function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); document.getElementById('app-container').classList.remove('hidden'); }

window.onload = () => { renderCyberButtons(); };

// =========================================================
// --- ЛОГІКА ТЕКСТОВИХ БЛОКІВ (РЕДАГУВАННЯ) ---
// =========================================================

function updateTextSize(size) {
    document.getElementById('text-size-display').innerText = size + 'px';
    document.getElementById('custom-text-input').style.fontSize = size + 'px';
}

function applyTextFormat(command, value = null) {
    document.getElementById('custom-text-input').focus();
    if (command === 'monospaced') { document.execCommand('fontName', false, 'monospace'); } 
    else { document.execCommand(command, false, value); }
}

function closeTextEditor() {
    document.getElementById('text-editor-modal').classList.add('hidden');
    editingTextId = null;
}

function openTextEditorFor(id) {
    const wrapper = document.querySelector(`.text-wrapper[data-id="${id}"]`);
    if (!wrapper) return;
    
    editingTextId = id; 
    const content = wrapper.querySelector('.custom-text-block');
    const input = document.getElementById('custom-text-input');
    
    input.innerHTML = content.innerHTML;
    const currentSize = wrapper.dataset.size || 12;
    input.style.fontSize = currentSize + 'px';
    document.getElementById('text-size-slider').value = currentSize;
    document.getElementById('text-size-display').innerText = currentSize + 'px';
    
    document.getElementById('text-editor-modal').classList.remove('hidden');
}

function saveNewTextBlock() {
    const input = document.getElementById('custom-text-input');
    const html = input.innerHTML.trim();
    if (!html) return;
    
    const size = document.getElementById('text-size-slider').value; 
    
    if (editingTextId) {
        const wrapper = document.querySelector(`.text-wrapper[data-id="${editingTextId}"]`);
        if (wrapper) {
            const content = wrapper.querySelector('.custom-text-block');
            content.innerHTML = html;
            content.style.fontSize = size + 'px';
            wrapper.dataset.size = size;
        }
        editingTextId = null;
    } else {
        const loc = currentLocationForSave;
        const id = 'text_' + Date.now();
        renderTextBlockDOM(id, html, loc, '10%', '10%', size);
    }
    
    document.getElementById('text-editor-modal').classList.add('hidden');
    saveLayout('auto');
    if (isEditMode) document.querySelectorAll('.text-wrapper').forEach(w => w.classList.add('editing-active'));
}

function renderTextBlockDOM(id, html, loc, left, top, size = 12) {
    const contentContainer = document.getElementById('terminal-buttons-container');
    if (!contentContainer) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'btn-wrapper text-wrapper';
    if (isEditMode) wrapper.classList.add('editing-active');
    
    wrapper.dataset.id = id;
    wrapper.dataset.loc = loc;
    wrapper.dataset.type = 'text'; 
    wrapper.dataset.size = size; 
    wrapper.style.position = 'absolute';
    wrapper.style.left = left;
    wrapper.style.top = top;

    const content = document.createElement('div');
    content.className = 'custom-text-block';
    content.innerHTML = html;
    content.style.fontSize = size + 'px'; 

    const delBtn = document.createElement('div');
    delBtn.className = 'action-text-btn delete-text-btn';
    delBtn.innerHTML = '❌';
    delBtn.onclick = () => { wrapper.remove(); if(isEditMode) saveLayout('auto'); };

    const editBtn = document.createElement('div');
    editBtn.className = 'action-text-btn edit-text-btn';
    editBtn.innerHTML = '✏️';
    editBtn.onclick = () => openTextEditorFor(id);

    wrapper.appendChild(content);
    wrapper.appendChild(delBtn);
    wrapper.appendChild(editBtn);

    makeDraggable(wrapper);
    contentContainer.appendChild(wrapper);
}

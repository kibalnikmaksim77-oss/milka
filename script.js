const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || 'guest';
const tgName = tg.initDataUnsafe?.user?.first_name || 'Користувач';

const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;
const NOTES_KEY = `milka_notes_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');
const globalBg = urlParams.get('bg'); 
const encodedData = urlParams.get('cd'); 
const appRoute = urlParams.get('route'); 

let cyberPages = { main: { buttons: [] }, burger: { buttons: [] }, pages: {}, pages_bg: {}, pages_coords: {}, pages_texts: {}, translations: {} };
let isEditMode = false;
let navStack = []; 
let editingTextId = null;

if (encodedData) {
    try {
        let decodedString;
        try { 
            decodedString = decodeURIComponent(escape(atob(decodeURIComponent(encodedData)))); 
        } catch (e) {
            try { decodedString = decodeURIComponent(escape(atob(encodedData))); } 
            catch (e2) { decodedString = decodeURIComponent(encodedData); }
        }
        
        const parsed = JSON.parse(decodedString);
        if (parsed.main) cyberPages.main = parsed.main;
        if (parsed.burger) cyberPages.burger = parsed.burger;
        if (parsed.pages) cyberPages.pages = parsed.pages;
        if (parsed.pages_bg) cyberPages.pages_bg = parsed.pages_bg;
        if (parsed.pages_coords) cyberPages.pages_coords = parsed.pages_coords;
        if (parsed.pages_texts) cyberPages.pages_texts = parsed.pages_texts; 
        if (parsed.translations) cyberPages.translations = parsed.translations; // 🌍 Словник перекладів
    } catch (e) { 
        console.error("Помилка декодування бази", e);
        alert("⚠️ ПОМИЛКА: Дані дизайну не завантажено. Не зберігайте позиції, щоб не стерти базу!");
    }
}

// 🔥 ВІДРЕМОНТОВАНА ФУНКЦІЯ ПЕРЕКЛАДУ 🔥
function tr(text) { 
    if (cyberPages.translations && cyberPages.translations[text]) {
        return cyberPages.translations[text];
    }
    return text; // Якщо перекладу немає — віддає оригінал
}

const initGlobalBg = cyberPages.pages_bg && cyberPages.pages_bg['global'];
if (initGlobalBg) { document.body.style.backgroundImage = `url('${initGlobalBg}')`; } 
else if (globalBg) { document.body.style.backgroundImage = `url('${globalBg}')`; } 

if (access === 'admin_king' || localStorage.getItem(CABINET_KEY) === 'true') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.classList.remove('hidden');
}

function openLanguageMenu() {
    navStack.push("Мова");
    document.getElementById('app-container').classList.add('hidden');
    
    let terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) terminal.remove(); 
    
    terminal = document.createElement('div');
    terminal.id = 'dynamic-terminal-page';
    terminal.className = 'neon-border';
    
    terminal.innerHTML = `
        <div class="terminal-header">
            <div class="terminal-burger"></div>
            <div class="terminal-right-controls"><div class="close-cross-btn" onclick="goHome()">❌</div></div>
        </div>
        <div class="terminal-content mask-scroll" id="terminal-buttons-container">
            <div style="text-align:center; padding: 20px; border: 1px solid #bc13fe; border-radius: 10px; background: rgba(0,0,0,0.5); margin-bottom: 20px; box-shadow: inset 0 0 15px rgba(0,0,0,0.9);">
                <p style="font-size: 11px; color: #fff; margin: 0; font-family: monospace;">ОБЕРІТЬ МОВУ / CHOOSE LANGUAGE:</p>
                <p style="font-size: 10px; color: #bc13fe; margin: 5px 0 0 0; text-shadow: 0 0 5px #bc13fe;">MILKA BOT | APP</p>
            </div>
            <div id="languages-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;"></div>
        </div>
    `;
    document.body.appendChild(terminal);
    
    const grid = document.getElementById('languages-grid');
    const langButtons = cyberPages.pages && cyberPages.pages['🌏'] ? cyberPages.pages['🌏'].buttons : [];
    
    if (langButtons.length > 0) {
        langButtons.forEach(btn => {
            const b = document.createElement('button');
            b.className = 'cyber-btn'; 
            
            // ⚙️ Зменшені компактні відступи та розміри кнопок
            b.style.padding = "8px";
            b.style.fontSize = "18px"; 
            b.style.height = "45px"; 
            
            b.innerHTML = btn.text; 
            b.onclick = () => {
                tg.HapticFeedback.impactOccurred('heavy');
                tg.sendData(JSON.stringify({ action: "set_lang", flag: btn.text }));
                tg.close();
            };
            grid.appendChild(b);
        });
    } else {
        grid.innerHTML = '<p style="color:#888; text-align:center; grid-column: span 2; font-size: 12px;">Папка 🌏 зараз порожня.<br>Адміністратор ще не додав жодної мови.</p>';
    }
}

function goHome() {
    if (isEditMode) { alert("⚠️ Спочатку збережіть або відмініть зміни."); return; }
    navStack = []; 
    const terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) { terminal.classList.add('hidden'); terminal.remove(); }
    document.getElementById('app-container').classList.remove('hidden');
    hideContextMenu();
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu && sideMenu.classList.contains('active')) toggleMenu();
}

function goBack() {
    if (isEditMode) { alert("⚠️ Спочатку збережіть або відмініть зміни."); return; }
    navStack.pop(); 
    if (navStack.length > 0) renderTerminal(); else goHome(); 
}

function openTerminalPage(pageTitle) {
    if (isEditMode) return; 
    if(pageTitle.includes('Око Юзера') || pageTitle.includes('Milka Bot') || pageTitle === '🏠') return;
    
    if (pageTitle === '🌏') {
        openLanguageMenu();
        return;
    }

    navStack.push(pageTitle); 
    renderTerminal();
}

function applyAbsolutePosition(wrapper, index, loc) {
    wrapper.style.position = 'absolute';
    wrapper.style.margin = '0';
    
    if (loc === 'burger') {
        wrapper.style.width = '100%'; 
    } else {
        wrapper.style.width = '38%'; 
    }

    let foundCoord = null;
    
    if (cyberPages.pages_coords && cyberPages.pages_coords[loc] && cyberPages.pages_coords[loc][wrapper.dataset.id]) {
        foundCoord = cyberPages.pages_coords[loc][wrapper.dataset.id];
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
        this.style.boxShadow = '0 0 20px #bc13fe';
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
        if(e.target.classList.contains('delete-text-btn') || e.target.classList.contains('edit-text-btn')) return;
        this.style.zIndex = '1';
        this.style.boxShadow = 'none'; 
        this.style.opacity = '1';
        tg.HapticFeedback.impactOccurred('light');

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
    
    document.querySelectorAll('.delete-text-btn').forEach(btn => btn.classList.add('hidden'));
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
                // БЕРЕМО ОРИГІНАЛ, щоб зберегти базу цілою!
                html: w.dataset.originalHtml || w.querySelector('.custom-text-block').innerHTML,
                left: w.style.left,
                top: w.style.top,
                size: w.dataset.size || 12 
            });
        } else {
            newOrderIds.push(w.dataset.id);
        }
    });

    if (!cyberPages.pages_coords) cyberPages.pages_coords = {};
    cyberPages.pages_coords[loc] = coordsData;
    
    if (!cyberPages.pages_texts) cyberPages.pages_texts = {};
    cyberPages.pages_texts[loc] = textBlocks; 

    tg.HapticFeedback.impactOccurred('heavy');
    tg.sendData(JSON.stringify({ action: "reorder", loc: loc, coords: coordsData, new_order: newOrderIds, texts: textBlocks }));
    
    if (type !== 'auto') alert("✅ Позиції та тексти збережено у Глобальну Базу Даних!");
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
    
    terminal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    terminal.style.backdropFilter = 'blur(10px)';
    terminal.style.webkitBackdropFilter = 'blur(10px)';
    
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
            b.style.background = 'rgba(0, 0, 0, 0.3)';
            b.style.border = '1px solid #bc13fe';
            b.style.color = '#bc13fe';
            b.style.boxShadow = 'inset 0 0 18px rgba(0, 0, 0, 0.95), 0 4px 10px rgba(0, 0, 0, 0.6)';
            b.style.backdropFilter = 'blur(4px)';
            b.style.webkitBackdropFilter = 'blur(4px)';
            
            // 🔥 ВІЗУАЛЬНИЙ ПЕРЕКЛАД 🔥
            b.innerHTML = tr(btn.text); 
            b.onclick = () => openTerminalPage(btn.text); // Сигнал йде оригіналом
            
            wrapper.appendChild(b);
            makeDraggable(wrapper);
            applyAbsolutePosition(wrapper, visibleIndex, currentPage);
            contentContainer.appendChild(wrapper);
            visibleIndex++;
        });
    }

    let pythonTexts = cyberPages.pages_texts && cyberPages.pages_texts[currentPage];
    if (pythonTexts && pythonTexts.length > 0) {
        pythonTexts.forEach(tb => {
            renderTextBlockDOM(tb.id, tb.html, currentPage, tb.left, tb.top, tb.size);
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
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.webkitBackdropFilter = 'blur(10px)';
    
    let dotsHtml = '';
    if (access === 'admin_king') {
        dotsHtml = `<div class="admin-dots" onclick="toggleContextMenu(event, 'user_eye', 'main')">⋮</div>`;
    }

    modal.innerHTML = `
        <div class="terminal-header">
            <div class="terminal-burger" onclick="toggleMenu()">
                <span></span><span></span><span></span>
            </div>
            <div class="terminal-title"></div>
            <div class="terminal-right-controls">
                ${dotsHtml}
                <div class="close-cross-btn" id="close-eye-btn">❌</div>
            </div>
        </div>
        <div class="eye-safe-zone mask-scroll" id="user-eye-grid" style="background:transparent; position:relative; width:100%; height:100%;"></div>
    `;
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
    
    const grid = document.getElementById('user-eye-grid');
    if (cyberPages.main && cyberPages.main.buttons) {
        let visibleIndex = 0;
        cyberPages.main.buttons.forEach((btn) => {
            if (btn.role === 'user' && btn.location === 'main') {
                const wrapper = document.createElement('div');
                wrapper.className = 'btn-wrapper';
                wrapper.dataset.id = btn.text;
                wrapper.dataset.loc = 'main';
                
                const b = document.createElement('button');
                b.className = 'cyber-btn btn-small';
                b.style.background = 'rgba(0, 0, 0, 0.3)';
                b.style.border = '1px solid #bc13fe';
                b.style.color = '#bc13fe';
                b.style.boxShadow = 'inset 0 0 18px rgba(0, 0, 0, 0.95), 0 4px 10px rgba(0, 0, 0, 0.6)';
                b.style.backdropFilter = 'blur(4px)';
                b.style.webkitBackdropFilter = 'blur(4px)';
                
                // 🔥 ВІЗУАЛЬНИЙ ПЕРЕКЛАД 🔥
                b.innerHTML = tr(btn.text); 
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
    if (sideMenu && sideMenu.classList.contains('active')) toggleMenu();
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
                
                const clearTextBtn = document.createElement('button');
                clearTextBtn.className = 'settings-item';
                clearTextBtn.innerHTML = '🧹 Очистити тексти';
                clearTextBtn.onclick = () => {
                    if(confirm("Очистити цю сторінку від усіх текстів?")) {
                        hideContextMenu();
                        document.querySelectorAll(`.text-wrapper[data-loc="${loc}"]`).forEach(el => el.remove());
                        saveLayout('auto');
                    }
                };
                menu.appendChild(clearTextBtn);
            }
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
    document.querySelectorAll('.delete-text-btn').forEach(btn => btn.classList.remove('hidden'));
    document.querySelectorAll('.text-wrapper').forEach(w => w.classList.add('editing-active'));
    alert("🛠 Вільне Переміщення УВІМКНЕНО.\nПеретягуйте кнопки та текст куди завгодно. З'явилися кнопки видалення та редагування тексту.");
}

function cancelDragAndDrop(type) {
    isEditMode = false;
    hideContextMenu();
    document.querySelectorAll('.delete-text-btn').forEach(btn => btn.classList.add('hidden'));
    document.querySelectorAll('.text-wrapper').forEach(w => w.classList.remove('editing-active'));
    
    if (currentLocationForSave === 'main') {
        if (document.getElementById('user-eye-studio')) openUserEyeStudio();
        else renderCyberButtons();
    } else {
        renderTerminal();
    }
    alert("❌ Зміни скасовано.");
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
    const sizeClass = (location !== 'burger') ? 'btn-small' : '';
    b.className = ('cyber-btn ' + sizeClass + (btn.role === 'owner' ? ' secret-btn' : '')).trim();
    
    b.style.background = 'rgba(0, 0, 0, 0.3)';
    b.style.border = '1px solid #bc13fe';
    b.style.color = '#bc13fe';
    b.style.boxShadow = 'inset 0 0 18px rgba(0, 0, 0, 0.95), 0 4px 10px rgba(0, 0, 0, 0.6)';
    b.style.backdropFilter = 'blur(4px)';
    b.style.webkitBackdropFilter = 'blur(4px)';
    
    // 🔥 ВІЗУАЛЬНИЙ ПЕРЕКЛАД 🔥
    b.innerHTML = tr(btn.text); 
    b.onclick = () => openTerminalPage(btn.text);
    
    wrapper.appendChild(b);
    if (location !== 'burger') { makeDraggable(wrapper); applyAbsolutePosition(wrapper, index, location); }
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
        case 'link': let url = prompt("Введіть посилання:"); if (url) document.execCommand('createLink', false, url); break;
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
    const container = document.getElementById('media-preview-container'); if(!container) return;
    container.innerHTML = '';
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
    if (history.length === 0) { appendMsg('bot', `Система активна. Чекаю на команду, ${tgName}.`); } 
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
function openChat() { if(typeof toggleMenu === 'function') toggleMenu(); document.getElementById('app-container').classList.add('hidden'); document.getElementById('chat-modal').classList.remove('hidden'); loadChatHistory(); }
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
        awaitingNote = false; chatInput.innerHTML = ''; pendingMedia = []; renderMediaPreview(); if(formatTrigger) formatTrigger.classList.add('hidden'); if(formatMenu) formatMenu.classList.add('hidden'); return; 
    }

    let mediaHtml = ''; pendingMedia.forEach(media => { if (media.type === 'video') { mediaHtml += `<video src="${media.src}" controls></video><br>`; } else { mediaHtml += `<img src="${media.src}"><br>`; } });
    const finalMessageHtml = mediaHtml + htmlText; appendMsg('user', finalMessageHtml);
    chatInput.innerHTML = ''; pendingMedia = []; renderMediaPreview(); if(formatTrigger) formatTrigger.classList.add('hidden'); if(formatMenu) formatMenu.classList.add('hidden');
    
    setTimeout(() => {
        const lowerText = rawText.toLowerCase();
        if (lowerText === '+пам\'ятка') { awaitingNote = true; appendMsg('bot', 'Відправ текст у вигляді кода.'); } 
        else if (lowerText === 'пам\'ятки') { let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; let keys = Object.keys(notes); const msgId = Date.now().toString(); if (keys.length === 0) { appendMsg('bot', `📭 Порожньо.`, msgId); } else { appendMsg('bot', generateNotesListHTML(msgId), msgId); } }
        else if (lowerText === 'кабінет') { localStorage.setItem(CABINET_KEY, 'true'); if(document.getElementById('settings-btn')) document.getElementById('settings-btn').classList.remove('hidden'); appendMsg('bot', 'Власник активний.'); } 
        else if (lowerText === 'вихід') { localStorage.removeItem(CABINET_KEY); if(document.getElementById('settings-btn')) document.getElementById('settings-btn').classList.add('hidden'); appendMsg('bot', 'Користувач.'); } 
        else if (lowerText === 'очистити') { localStorage.removeItem(CHAT_KEY); document.getElementById('chat-messages').innerHTML = ''; appendMsg('bot', '🧹 Очищено.'); } 
    }, 600);
}

window.onload = () => { 
    renderCyberButtons(); 
    if (appRoute === 'lang') {
        setTimeout(() => openLanguageMenu(), 100);
    }
};

function updateTextSize(size) {
    document.getElementById('text-size-display').innerText = size + 'px';
    document.getElementById('custom-text-input').style.fontSize = size + 'px';
}

function applyTextFormat(command, value = null) {
    document.getElementById('custom-text-input').focus();
    if (command === 'monospaced') {
        document.execCommand('fontName', false, 'monospace');
    } else {
        document.execCommand(command, false, value);
    }
}

function openTextEditorFor(id) {
    const wrapper = document.querySelector(`.text-wrapper[data-id="${id}"]`);
    if (!wrapper) return;
    
    editingTextId = id; 
    const input = document.getElementById('custom-text-input');
    // Відкриваємо ОРИГІНАЛ для редагування
    input.innerHTML = wrapper.dataset.originalHtml || wrapper.querySelector('.custom-text-block').innerHTML;
    
    const currentSize = wrapper.dataset.size || 12;
    input.style.fontSize = currentSize + 'px';
    document.getElementById('text-size-slider').value = currentSize;
    document.getElementById('text-size-display').innerText = currentSize + 'px';
    
    document.getElementById('text-editor-modal').classList.remove('hidden');
}

function saveNewTextBlock() {
    const input = document.getElementById('custom-text-input');
    const html = input.innerHTML.trim();
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    if (!tempDiv.innerText.trim() && !html.includes('<img') && !html.includes('<br>')) {
        alert("Текст не може бути порожнім!");
        return;
    }
    
    const size = document.getElementById('text-size-slider').value; 
    
    if (editingTextId) {
        const wrapper = document.querySelector(`.text-wrapper[data-id="${editingTextId}"]`);
        if (wrapper) {
            const content = wrapper.querySelector('.custom-text-block');
            wrapper.dataset.originalHtml = html; // Зберігаємо новий оригінал
            
            // 🔥 ВІЗУАЛЬНИЙ ПЕРЕКЛАД 🔥
            content.innerHTML = tr(html); 
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
    wrapper.dataset.originalHtml = html; // Зберігаємо оригінал
    wrapper.style.position = 'absolute';
    wrapper.style.left = left;
    wrapper.style.top = top;

    const content = document.createElement('div');
    content.className = 'custom-text-block';
    
    // 🔥 ВІЗУАЛЬНИЙ ПЕРЕКЛАД 🔥
    content.innerHTML = tr(html); 
    content.style.fontSize = size + 'px'; 

    const delBtn = document.createElement('div');
    delBtn.className = 'action-text-btn delete-text-btn';
    delBtn.innerHTML = '❌';
    
    const handleDel = (e) => { 
        e.preventDefault(); e.stopPropagation(); 
        wrapper.remove(); 
        if(isEditMode) saveLayout('auto'); 
    };
    delBtn.addEventListener('touchstart', handleDel, {passive: false});
    delBtn.addEventListener('click', handleDel);

    const editBtn = document.createElement('div');
    editBtn.className = 'action-text-btn edit-text-btn';
    editBtn.innerHTML = '✏️';
    
    const handleEdit = (e) => { 
        e.preventDefault(); e.stopPropagation(); 
        openTextEditorFor(id); 
    };
    editBtn.addEventListener('touchstart', handleEdit, {passive: false});
    editBtn.addEventListener('click', handleEdit);

    wrapper.appendChild(content);
    wrapper.appendChild(delBtn);
    wrapper.appendChild(editBtn);

    makeDraggable(wrapper);
    contentContainer.appendChild(wrapper);
}

// 1. DOM Elements
const toggleBtn = document.getElementById('theme-toggle');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const taskModal = document.getElementById('task-modal');

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskLink = document.getElementById('task-link'); // Element link

const taskLists = document.querySelectorAll('.task-list');

// 2. Load Tasks & Theme from LocalStorage on Startup
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadTasks();
});

// 3. Theme Switcher Logic
if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('light-mode');

        const isLight = document.body.classList.contains('light-mode');
        toggleBtn.textContent = isLight ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (toggleBtn) toggleBtn.textContent = '☀️ Light Mode';
    }
}

// 4. Modal Controls
if (openModalBtn && closeModalBtn && taskModal) {
    openModalBtn.addEventListener('click', function() {
        taskModal.classList.remove('hidden');
        setTimeout(() => taskInput.focus(), 50);
    });

    closeModalBtn.addEventListener('click', function() {
        taskModal.classList.add('hidden');
    });

    taskModal.addEventListener('click', function(e) {
        if (e.target === taskModal) {
            taskModal.classList.add('hidden');
        }
    });
}

// 5. Create Task Logic
if (taskForm) {
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const title = taskInput.value.trim();
        const category = taskCategory.value;
        const link = taskLink ? taskLink.value.trim() : '';

        if (title !== '') {
            const card = createTaskCard(title, category, null, link);
            document.getElementById('list-todo').appendChild(card);
            
            saveTasks();
            updateTaskCounts();

            taskInput.value = '';
            if (taskLink) taskLink.value = '';
            taskModal.classList.add('hidden');
        }
    });
}

// Helper: Create Task Card Element
function createTaskCard(title, category, id = null, link = '') {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('draggable', 'true');
    card.id = id || 'task-' + Date.now();
    card.dataset.category = category;
    if (link) card.dataset.link = link;

    let categoryIcon = '📌';
    if (category === 'Letter') categoryIcon = '📄';
    if (category === 'Report') categoryIcon = '📊';
    if (category === 'Notes') categoryIcon = '📝';

    const docBtnHtml = link ? `<a href="${link}" target="_blank" class="doc-link-btn" title="Open Google Docs" style="text-decoration: none; font-size: 13px; margin-right: 6px;">🔗 Docs</a>` : '';

    card.innerHTML = `
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="card-category">${categoryIcon} ${category}</span>
            <div style="display: flex; align-items: center;">
                ${docBtnHtml}
                <button class="delete-btn" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 0 4px;">&times;</button>
            </div>
        </div>
        <p class="card-title" contenteditable="true" style="outline: none; margin-top: 6px;">${title}</p>
    `;

    // Prevent drag when clicking link
    const docLink = card.querySelector('.doc-link-btn');
    if (docLink) {
        docLink.addEventListener('click', (e) => e.stopPropagation());
    }

    // Delete Button Event
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        card.remove();
        saveTasks();
        updateTaskCounts();
    });

    // Auto Save Edit Title
    const titleEl = card.querySelector('.card-title');
    titleEl.addEventListener('blur', function() {
        saveTasks();
    });

    // Drag & Drop Events
    card.addEventListener('dragstart', function(e) {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.id);
    });

    card.addEventListener('dragend', function() {
        card.classList.remove('dragging');
    });

    return card;
}

// 6. Drag & Drop Logic
taskLists.forEach(list => {
    list.addEventListener('dragover', function(e) {
        e.preventDefault();
        list.classList.add('drag-over');
    });

    list.addEventListener('dragleave', function() {
        list.classList.remove('drag-over');
    });

    list.addEventListener('drop', function(e) {
        e.preventDefault();
        list.classList.remove('drag-over');

        const cardId = e.dataTransfer.getData('text/plain');
        const card = document.getElementById(cardId);

        if (card) {
            list.appendChild(card);
            saveTasks();
            updateTaskCounts();
        }
    });
});

// 7. LocalStorage Save & Load Functions
function saveTasks() {
    const columns = ['todo', 'progress', 'review', 'completed'];
    const boardData = {};

    columns.forEach(col => {
        const listEl = document.getElementById(`list-${col}`);
        boardData[col] = [];

        Array.from(listEl.children).forEach(card => {
            const titleEl = card.querySelector('.card-title');
            if (titleEl) {
                boardData[col].push({
                    id: card.id,
                    title: titleEl.textContent,
                    category: card.dataset.category || 'Other',
                    link: card.dataset.link || ''
                });
            }
        });
    });

    localStorage.setItem('kanbanBoardData', JSON.stringify(boardData));
}

function loadTasks() {
    const savedData = localStorage.getItem('kanbanBoardData');
    if (!savedData) return;

    const boardData = JSON.parse(savedData);
    const columns = ['todo', 'progress', 'review', 'completed'];

    columns.forEach(col => {
        const listEl = document.getElementById(`list-${col}`);
        listEl.innerHTML = '';

        if (boardData[col]) {
            boardData[col].forEach(task => {
                const card = createTaskCard(task.title, task.category, task.id, task.link);
                listEl.appendChild(card);
            });
        }
    });

    updateTaskCounts();
}

// Helper: Update Counts
function updateTaskCounts() {
    document.getElementById('count-todo').textContent = document.getElementById('list-todo').children.length;
    document.getElementById('count-progress').textContent = document.getElementById('list-progress').children.length;
    document.getElementById('count-review').textContent = document.getElementById('list-review').children.length;
    document.getElementById('count-completed').textContent = document.getElementById('list-completed').children.length;
}
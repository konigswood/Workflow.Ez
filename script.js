// 1. DOM Elements
const toggleBtn = document.getElementById('theme-toggle');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const taskModal = document.getElementById('task-modal');

const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const addBtn = document.getElementById('add-btn');

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
        taskInput.focus();
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
if (addBtn) {
    addBtn.addEventListener('click', function() {
        const title = taskInput.value.trim();
        const category = taskCategory.value;

        if (title !== '') {
            const card = createTaskCard(title, category);
            document.getElementById('list-todo').appendChild(card);
            
            saveTasks();
            updateTaskCounts();

            taskInput.value = '';
            taskModal.classList.add('hidden');
        } else {
            alert('Please enter a title!');
        }
    });
}

// Enter key shortcut for task input
if (taskInput) {
    taskInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBtn.click();
        }
    });
}

// Helper: Create Task Card Element
function createTaskCard(title, category, id = null) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('draggable', 'true');
    card.id = id || 'task-' + Date.now();
    card.dataset.category = category;

    let categoryIcon = '📌';
    if (category === 'Letter') categoryIcon = '📄';
    if (category === 'Report') categoryIcon = '📊';
    if (category === 'Notes') categoryIcon = '📝';

    card.innerHTML = `
        <span class="card-category">${categoryIcon} ${category}</span>
        <p class="card-title">${title}</p>
    `;

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
            boardData[col].push({
                id: card.id,
                title: card.querySelector('.card-title').textContent,
                category: card.dataset.category || 'Other'
            });
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
                const card = createTaskCard(task.title, task.category, task.id);
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
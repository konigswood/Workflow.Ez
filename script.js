// 1. Firebase Setup
const firebaseConfig = {
    apiKey: "AIzaSyDMfXsIjG6AQjWKK8P28UcrwfR7iAljOxE",
    authDomain: "workflow-ez.firebaseapp.com",
    databaseURL: "https://workflow-ez-default-rtdb.firebaseio.com",
    projectId: "workflow-ez",
    storageBucket: "workflow-ez.firebasestorage.app",
    messagingSenderId: "291689974901",
    appId: "1:291689974901:web:d53098b43c563b56263c3c",
    measurementId: "G-H0LDEDL98J"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 2. Determine Mode
const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('mode') === 'admin';

// 3. DOM Elements
const toggleBtn = document.getElementById('theme-toggle');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const taskModal = document.getElementById('task-modal');
const modalTitle = document.getElementById('modal-title');
const viewerBanner = document.getElementById('viewer-banner');

const taskForm = document.getElementById('task-form');
const editTaskId = document.getElementById('edit-task-id');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskLink = document.getElementById('task-link');

const taskLists = document.querySelectorAll('.task-list');

// 4. Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    setupUI();
    setupEventListeners();
    listenToFirebase();
});

function setupUI() {
    if (!isAdmin) {
        if (openModalBtn) openModalBtn.style.display = 'none';
        if (viewerBanner) viewerBanner.style.display = 'block';
    } else {
        if (openModalBtn) openModalBtn.style.display = 'inline-block';
        if (viewerBanner) viewerBanner.style.display = 'none';
    }
}

// 5. Theme Switcher
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        toggleBtn.textContent = isLight ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        if (toggleBtn) toggleBtn.textContent = '☀️ Light Mode';
    }
}

// 6. Modal & Event Listeners
function setupEventListeners() {
    if (openModalBtn && closeModalBtn && taskModal) {
        openModalBtn.addEventListener('click', () => {
            editTaskId.value = '';
            modalTitle.textContent = 'Create New Task';
            taskForm.reset();
            taskModal.classList.remove('hidden');
            setTimeout(() => taskInput.focus(), 50);
        });

        closeModalBtn.addEventListener('click', () => taskModal.classList.add('hidden'));
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) taskModal.classList.add('hidden');
        });
    }

    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!isAdmin) return;

            const title = taskInput.value.trim();
            const category = taskCategory.value;
            const link = taskLink ? taskLink.value.trim() : '';
            const existingId = editTaskId.value;

            if (title !== '') {
                if (existingId) {
                    // Update existing card
                    const card = document.getElementById(existingId);
                    if (card) {
                        card.dataset.category = category;
                        card.dataset.link = link;
                        
                        let categoryIcon = '📌';
                        if (category === 'Letter') categoryIcon = '📄';
                        if (category === 'Report') categoryIcon = '📊';
                        if (category === 'Notes') categoryIcon = '📝';

                        const docBtnHtml = link ? `<a href="${link}" target="_blank" class="doc-link-btn" title="Open Google Docs" style="text-decoration: none; font-size: 13px; margin-right: 6px;">🔗 Docs</a>` : '';
                        
                        card.querySelector('.card-category').innerHTML = `${categoryIcon} ${category}`;
                        card.querySelector('.card-title').textContent = title;

                        const actionsDiv = card.querySelector('.card-actions');
                        actionsDiv.innerHTML = `
                            ${docBtnHtml}
                            <button class="edit-btn" style="background: none; border: none; cursor: pointer; font-size: 13px; margin-right: 4px;">✏️</button>
                            <button class="delete-btn" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 0 4px;">&times;</button>
                        `;

                        bindCardEvents(card);
                    }
                } else {
                    // Create new card
                    const card = createTaskCard(title, category, null, link);
                    document.getElementById('list-todo').appendChild(card);
                }

                saveTasksToFirebase();
                taskForm.reset();
                taskModal.classList.add('hidden');
            }
        });
    }

    // Drag & Drop
    if (isAdmin) {
        taskLists.forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                list.classList.add('drag-over');
            });
            list.addEventListener('dragleave', () => list.classList.remove('drag-over'));
            list.addEventListener('drop', (e) => {
                e.preventDefault();
                list.classList.remove('drag-over');
                const cardId = e.dataTransfer.getData('text/plain');
                const card = document.getElementById(cardId);
                if (card) {
                    list.appendChild(card);
                    saveTasksToFirebase();
                }
            });
        });
    }
}

// 7. Create Task Card
function createTaskCard(title, category, id = null, link = '') {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.id = id || 'task-' + Date.now();
    card.dataset.category = category;
    if (link) card.dataset.link = link;

    if (isAdmin) card.setAttribute('draggable', 'true');

    let categoryIcon = '📌';
    if (category === 'Letter') categoryIcon = '📄';
    if (category === 'Report') categoryIcon = '📊';
    if (category === 'Notes') categoryIcon = '📝';

    const docBtnHtml = link ? `<a href="${link}" target="_blank" class="doc-link-btn" title="Open Google Docs" style="text-decoration: none; font-size: 13px; margin-right: 6px;">🔗 Docs</a>` : '';
    const adminBtnsHtml = isAdmin ? `
        <button class="edit-btn" style="background: none; border: none; cursor: pointer; font-size: 13px; margin-right: 4px;">✏️</button>
        <button class="delete-btn" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 0 4px;">&times;</button>
    ` : '';

    card.innerHTML = `
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="card-category">${categoryIcon} ${category}</span>
            <div class="card-actions" style="display: flex; align-items: center;">
                ${docBtnHtml}
                ${adminBtnsHtml}
            </div>
        </div>
        <p class="card-title" style="outline: none; margin-top: 6px;">${title}</p>
    `;

    bindCardEvents(card);
    return card;
}

function bindCardEvents(card) {
    const docLink = card.querySelector('.doc-link-btn');
    if (docLink) docLink.addEventListener('click', (e) => e.stopPropagation());

    if (isAdmin) {
        // Edit Button
        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editTaskId.value = card.id;
                taskInput.value = card.querySelector('.card-title').textContent;
                taskCategory.value = card.dataset.category || 'Other';
                taskLink.value = card.dataset.link || '';
                modalTitle.textContent = 'Edit Task';
                taskModal.classList.remove('hidden');
            });
        }

        // Delete Button
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                card.remove();
                saveTasksToFirebase();
            });
        }

        // Drag & Drop
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.id);
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
    }
}

// 8. Firebase Functions
function saveTasksToFirebase() {
    if (!isAdmin) return;

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

    database.ref('kanbanBoard').set(boardData);
}

function listenToFirebase() {
    database.ref('kanbanBoard').on('value', (snapshot) => {
        const boardData = snapshot.val();
        const columns = ['todo', 'progress', 'review', 'completed'];

        columns.forEach(col => {
            const listEl = document.getElementById(`list-${col}`);
            listEl.innerHTML = '';

            if (boardData && boardData[col]) {
                boardData[col].forEach(task => {
                    const card = createTaskCard(task.title, task.category, task.id, task.link);
                    listEl.appendChild(card);
                });
            }
        });

        updateTaskCounts();
    });
}

function updateTaskCounts() {
    document.getElementById('count-todo').textContent = document.getElementById('list-todo').children.length;
    document.getElementById('count-progress').textContent = document.getElementById('list-progress').children.length;
    document.getElementById('count-review').textContent = document.getElementById('list-review').children.length;
    document.getElementById('count-completed').textContent = document.getElementById('list-completed').children.length;
}
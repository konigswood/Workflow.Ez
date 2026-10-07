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

// 2. Determine Mode (Admin vs Viewer via URL Parameter)
const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('mode') === 'admin';

// 3. DOM Elements
const toggleBtn = document.getElementById('theme-toggle');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const taskModal = document.getElementById('task-modal');
const viewerBanner = document.getElementById('viewer-banner');

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskLink = document.getElementById('task-link');

const taskLists = document.querySelectorAll('.task-list');

// 4. Initialize UI based on Mode
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    setupModeAccess();
    setupEventListeners();
    listenToFirebase();
});

function setupModeAccess() {
    if (!isAdmin) {
        // Mode Viewer
        if (openModalBtn) openModalBtn.style.display = 'none';
        if (viewerBanner) viewerBanner.style.display = 'block';
    } else {
        // Mode Admin
        if (openModalBtn) openModalBtn.style.display = 'inline-block';
        if (viewerBanner) viewerBanner.style.display = 'none';
    }
}

// 5. Theme Switcher Logic
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

// 6. Modal & Form Controls
function setupEventListeners() {
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

    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!isAdmin) return; // Guard clause

            const title = taskInput.value.trim();
            const category = taskCategory.value;
            const link = taskLink ? taskLink.value.trim() : '';

            if (title !== '') {
                const card = createTaskCard(title, category, null, link);
                document.getElementById('list-todo').appendChild(card);
                
                saveTasksToFirebase();

                taskInput.value = '';
                if (taskLink) taskLink.value = '';
                taskModal.classList.add('hidden');
            }
        });
    }

    // Drag & Drop
    if (isAdmin) {
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
                    saveTasksToFirebase();
                }
            });
        });
    }
}

// Helper: Create Task Card Element
function createTaskCard(title, category, id = null, link = '') {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.id = id || 'task-' + Date.now();
    card.dataset.category = category;
    if (link) card.dataset.link = link;

    if (isAdmin) {
        card.setAttribute('draggable', 'true');
    }

    let categoryIcon = '📌';
    if (category === 'Letter') categoryIcon = '📄';
    if (category === 'Report') categoryIcon = '📊';
    if (category === 'Notes') categoryIcon = '📝';

    const docBtnHtml = link ? `<a href="${link}" target="_blank" class="doc-link-btn" title="Open Google Docs" style="text-decoration: none; font-size: 13px; margin-right: 6px;">🔗 Docs</a>` : '';
    const deleteBtnHtml = isAdmin ? `<button class="delete-btn" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 0 4px;">&times;</button>` : '';

    card.innerHTML = `
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="card-category">${categoryIcon} ${category}</span>
            <div style="display: flex; align-items: center;">
                ${docBtnHtml}
                ${deleteBtnHtml}
            </div>
        </div>
        <p class="card-title" ${isAdmin ? 'contenteditable="true"' : ''} style="outline: none; margin-top: 6px;">${title}</p>
    `;

    const docLink = card.querySelector('.doc-link-btn');
    if (docLink) {
        docLink.addEventListener('click', (e) => e.stopPropagation());
    }

    if (isAdmin) {
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                card.remove();
                saveTasksToFirebase();
            });
        }

        const titleEl = card.querySelector('.card-title');
        if (titleEl) {
            titleEl.addEventListener('blur', function() {
                saveTasksToFirebase();
            });
        }

        card.addEventListener('dragstart', function(e) {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.id);
        });

        card.addEventListener('dragend', function() {
            card.classList.remove('dragging');
        });
    }

    return card;
}

// 7. Firebase Realtime Database Sync Functions
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

// Helper: Update Counts
function updateTaskCounts() {
    document.getElementById('count-todo').textContent = document.getElementById('list-todo').children.length;
    document.getElementById('count-progress').textContent = document.getElementById('list-progress').children.length;
    document.getElementById('count-review').textContent = document.getElementById('list-review').children.length;
    document.getElementById('count-completed').textContent = document.getElementById('list-completed').children.length;
}
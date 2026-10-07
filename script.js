// Helper: Create Task Card Element
function createTaskCard(title, category, id = null, link = '') {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.id = id || 'task-' + Date.now();
    card.dataset.category = category;
    if (link) card.dataset.link = link;

    // Hanya Admin yang bisa drag
    if (isAdmin) {
        card.setAttribute('draggable', 'true');
    }

    let categoryIcon = '📌';
    if (category === 'Letter') categoryIcon = '📄';
    if (category === 'Report') categoryIcon = '📊';
    if (category === 'Notes') categoryIcon = '📝';

    const docBtnHtml = link ? `<a href="${link}" target="_blank" class="doc-link-btn" title="Open Google Docs" style="text-decoration: none; font-size: 13px; margin-right: 6px;">🔗 Docs</a>` : '';
    
    // HANYA ADMIN YANG DAPAT TOMBOL HAPUS
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

    // Event listener HANYA dipasang kalau ADMIN
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
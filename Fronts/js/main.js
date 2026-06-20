
async function fetchTools() {
    try {
        const result = await apiRequest('/api/tools');
        if (result.success) {
            return result.data;
        } else {
            console.error('API 返回错误:', result);
        }
    } catch (error) {
        console.error('请求失败：', error);
    }
}

let currentTools = [];

function renderCards(tools) {
    const grid = document.getElementById('cardGrid');
    grid.innerHTML = '';

    const data = tools || currentTools;

    data.forEach(tool => {
        const card = document.createElement('a');
        card.className = 'card';
        card.href = tool.link || '#';

        if (!tool.link || tool.link === '#') {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                alert('🔧 此工具正在开发中，敬请期待！');
            });
        }

        card.innerHTML = `
            <span class="card-icon">${tool.icon}</span>
            <div class="card-title">${tool.title}</div>
            <div class="card-desc">${tool.desc}</div>
            ${tool.badge ? `<span class="card-badge">${tool.badge}</span>` : ''}
        `;

        grid.appendChild(card);
    });

    document.getElementById('toolCount').textContent = data.length;
}

function searchTools(keyword) {
    const lower = keyword.toLowerCase().trim();
    if (lower === '') {
        renderCards(currentTools);
        return;
    }

    const filtered = currentTools.filter(tool =>
        tool.title.includes(lower) ||
        tool.desc.includes(lower) ||
        tool.category.includes(lower)
    );
    renderCards(filtered);
}

document.addEventListener('DOMContentLoaded', async () => {
    const tools = await fetchTools();
    currentTools = tools;
    renderCards(tools);

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    searchInput.addEventListener('input', (e) => {
        searchTools(e.target.value);
    });

    searchBtn.addEventListener('click', () => {
        searchTools(searchInput.value);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchTools(searchInput.value);
        }
    });
});

console.log('🍅 Friendly Tools 已加载');

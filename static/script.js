const GITHUB_OWNER = 'MrMagnets';
const GITHUB_REPO = 'magnet-blog';
const GITHUB_BRANCH = 'main';
const POSTS_PATH = 'content/posts';

function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// 使用 CORS 代理服务
const PROXY_URL = 'https://github.cors-proxy.com/';

async function loadPostList() {
    const container = document.getElementById('post-list');
    if (!container) return;
    try {
        const target = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${POSTS_PATH}`;
        const url = `${PROXY_URL}${encodeURIComponent(target)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('无法获取文章列表');
        const files = await res.json();
        if (!Array.isArray(files) || files.length === 0) {
            container.innerHTML = '<p>📭 还没有文章，去写一篇吧！</p>';
            return;
        }
        const posts = files.filter(f => f.name.endsWith('.md')).sort((a, b) => b.name.localeCompare(a.name));
        let html = '';
        for (const file of posts) {
            const slug = file.name.replace('.md', '');
            try {
                const contentRes = await fetch(file.download_url);
                const content = await contentRes.text();
                const titleMatch = content.match(/^#\s+(.+)/m);
                const title = titleMatch ? titleMatch[1] : slug;
                const date = file.name.slice(0, 10) || '未知日期';
                html += `<div class="post-item"><a href="post.html?slug=${encodeURIComponent(slug)}">${title}</a><div class="post-meta">📅 ${date}</div></div>`;
            } catch (e) {
                html += `<div class="post-item"><a href="post.html?slug=${encodeURIComponent(slug)}">${slug}</a><div class="post-meta">⚠️ 加载失败</div></div>`;
            }
        }
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p>❌ 加载失败: ${error.message}</p>`;
    }
}

async function loadPostDetail() {
    const container = document.getElementById('post-content');
    if (!container) return;
    const slug = getUrlParam('slug');
    if (!slug) { container.innerHTML = '<p>❌ 未指定文章</p>'; return; }
    try {
        const target = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${POSTS_PATH}/${slug}.md`;
        const url = `${PROXY_URL}${encodeURIComponent(target)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('文章不存在');
        const data = await res.json();
        const content = atob(data.content.replace(/\n/g, ''));
        let html = content.replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/\n/g, '<br>');
        container.innerHTML = html;
        document.title = `${slug} - 磁铁的博客`;
    } catch (error) {
        container.innerHTML = `<p>❌ 加载失败: ${error.message}</p>`;
    }
}

async function loadProblems() {
    const container = document.getElementById('problem-list');
    if (!container) return;
    try {
        const target = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/problems.json`;
        const url = `${PROXY_URL}${encodeURIComponent(target)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('题目数据不存在，请等待 GitHub Actions 运行');
        const data = await res.json();
        const jsonStr = atob(data.content.replace(/\n/g, ''));
        const jsonData = JSON.parse(jsonStr);
        const problems = jsonData.problems || [];
        if (problems.length === 0) { container.innerHTML = '<p>⏳ 今日题目加载中...</p>'; return; }
        let html = '';
        for (const p of problems) {
            const desc = p.content ? p.content.slice(0, 200) + '...' : '暂无描述';
            if (p.error) {
                html += `<div class="problem-card"><h3><a href="${p.url || '#'}" target="_blank">${p.pid}</a></h3><span class="difficulty" style="background:#fed7d7;color:#9b2c2c;">⚠️ ${p.error}</span><div class="problem-content">${desc}</div></div>`;
            } else {
                html += `<div class="problem-card"><h3><a href="${p.url}" target="_blank">${p.pid} ${p.title}</a></h3><span class="difficulty">${p.difficulty || '未知难度'}</span><div class="problem-content">${desc}</div></div>`;
            }
        }
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p>❌ 加载失败: ${error.message}</p>`;
    }
}

async function publishPost(title, content, token) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${dateStr}-${slug}.md`;
    const path = `${POSTS_PATH}/${filename}`;
    const mdContent = `# ${title}\n\n${content}`;
    const base64Content = btoa(unescape(encodeURIComponent(mdContent)));
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    let sha = null;
    try {
        const checkRes = await fetch(url, { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } });
        if (checkRes.ok) { const existing = await checkRes.json(); sha = existing.sha; }
    } catch (e) {}
    const payload = { message: `发布文章: ${title}`, content: base64Content, branch: GITHUB_BRANCH };
    if (sha) payload.sha = sha;
    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) { const err = await response.json(); throw new Error(err.message || '发布失败'); }
    return await response.json();
}

document.addEventListener('DOMContentLoaded', function() {
    loadPostList();
    loadPostDetail();
    loadProblems();
    const form = document.getElementById('publish-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content-editor').value.trim();
            const token = document.getElementById('github-token').value.trim();
            const statusDiv = document.getElementById('publish-status');
            if (!title || !content || !token) {
                statusDiv.innerHTML = '<div class="error">请填写完整信息</div>';
                return;
            }
            statusDiv.innerHTML = '<p>⏳ 正在发布...</p>';
            statusDiv.className = '';
            try {
                const result = await publishPost(title, content, token);
                const slug = result.content.path.replace('content/posts/', '').replace('.md', '');
                statusDiv.innerHTML = `<div class="success">✅ 发布成功！<br><a href="post.html?slug=${encodeURIComponent(slug)}" target="_blank">查看文章</a></div>`;
                statusDiv.className = 'success';
                document.getElementById('post-title').value = '';
                document.getElementById('post-content-editor').value = '';
            } catch (error) {
                statusDiv.innerHTML = `<div class="error">❌ 发布失败: ${error.message}</div>`;
                statusDiv.className = 'error';
            }
        });
    }
});

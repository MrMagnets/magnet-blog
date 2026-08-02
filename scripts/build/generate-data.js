const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const GITHUB_OWNER = 'MrMagnets';
const GITHUB_REPO = 'magnet-blog';
const POSTS_PATH = 'content/posts';

// 输出目录
const OUTPUT_DIR = 'static/data';

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 从 GitHub API 获取数据
function fetchFromGitHub(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Magnet-Blog-Builder'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('🚀 开始构建数据...');
    
    try {
        // 1. 获取文章列表
        const postsUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${POSTS_PATH}`;
        const postsData = await fetchFromGitHub(postsUrl);
        
        const posts = [];
        for (const file of postsData) {
            if (file.name.endsWith('.md')) {
                // 获取文章内容
                const contentRes = await fetch(file.download_url);
                const content = await contentRes.text();
                const titleMatch = content.match(/^#\s+(.+)/m);
                const title = titleMatch ? titleMatch[1] : file.name.replace('.md', '');
                posts.push({
                    slug: file.name.replace('.md', ''),
                    title: title,
                    date: file.name.slice(0, 10) || '未知日期',
                    content: content
                });
                console.log(`  ✅ 已处理: ${file.name}`);
            }
        }
        
        // 写入文章数据
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'posts.json'),
            JSON.stringify(posts, null, 2)
        );
        console.log(`✅ 已保存 ${posts.length} 篇文章`);
        
        // 2. 获取题目数据
        try {
            const problemsUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/problems.json`;
            const problemsData = await fetchFromGitHub(problemsUrl);
            if (problemsData.content) {
                const content = Buffer.from(problemsData.content, 'base64').toString('utf-8');
                const json = JSON.parse(content);
                fs.writeFileSync(
                    path.join(OUTPUT_DIR, 'problems.json'),
                    JSON.stringify(json, null, 2)
                );
                console.log(`✅ 已保存题目数据`);
            }
        } catch (e) {
            console.log('⚠️ 题目数据暂不可用');
        }
        
        console.log('🎉 构建完成！');
    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
}

main();

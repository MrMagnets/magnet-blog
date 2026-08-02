exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    const slug = event.queryStringParameters.slug;
    if (!slug) {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ error: '缺少 slug 参数' })
        };
    }

    try {
        const response = await fetch(`https://api.github.com/repos/MrMagnets/magnet-blog/contents/content/posts/${slug}.md`, {
            headers: {
                'User-Agent': 'Magnet-Blog'
            }
        });
        const data = await response.json();
        // 解码 Base64 内容
        if (data.content) {
            data.content = Buffer.from(data.content, 'base64').toString('utf-8');
        }
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch('https://api.github.com/repos/MrMagnets/magnet-blog/contents/content/problems.json', {
            headers: {
                'User-Agent': 'Magnet-Blog'
            }
        });
        const data = await response.json();
        // 解码 Base64 内容
        if (data.content) {
            data.content = Buffer.from(data.content, 'base64').toString('utf-8');
            data.json = JSON.parse(data.content);
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

const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config();

module.exports = async (req, res) => {
    const apiKey = process.env.API_KEY;
    const apiUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const content = req.query.content;
    const url = req.query.url;
    const allowedOrigins = process.env.ORIGIN ? process.env.ORIGIN.split(',') : [];

    const origin = req.headers.origin || req.headers.referer;
    if (!origin || !isOriginAllowed(origin, allowedOrigins)) {
        return res.status(403).send("摘要生成失败：来源不被允许");
    }

    if (!apiKey) {
        return res.status(500).send("摘要生成失败：未设置API_KEY");
    }
    if (!content || content.trim() === "") {
        return res.status(500).send("摘要生成失败：正文内容为空");
    }
    if (!url || url.trim() === "") {
        return res.status(500).send("摘要生成失败：未提供url");
    }

    const connection = await mysql.createConnection({
        host: process.env.POSTGRES_HOST,
        port: 3306,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE
    });

    try {
        const [rows] = await connection.execute('SELECT summary FROM summaries WHERE url = ?', [url]);

        if (rows.length > 0) {
            return res.status(200).send(rows[0].summary);
        }

        const requestBody = {
            model: "qwen-long",
            messages: [
                { role: "system", content: "You are a helpful summary generator." },
                { role: "user", content: `请为以下内容用中文生成长度为150汉字左右的摘要，摘要只有一个自然段，其中不要包含markdown格式，纯文本即可，且只需给出摘要，不要说其他任何话: ${content}` }
            ],
            temperature: 0.8,
            top_p: 0.8
        };
        
        const response = await axios.post(`${apiUrl}/chat/completions`, requestBody, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const summary = response.data.choices[0].message.content.trim();

        await connection.execute('INSERT INTO summaries (url, summary) VALUES (?, ?)', [url, summary]);

        res.status(200).send(summary);
    } catch (error) {
        res.status(500).send("摘要生成失败：返回格式不正确");
    } finally {
        await connection.end();
    }
}

function isOriginAllowed(origin, allowedOrigins) {
    const url = new URL(origin);
    const hostname = url.hostname;

    for (let allowedOrigin of allowedOrigins) {
        allowedOrigin = allowedOrigin.trim();
        if (allowedOrigin.startsWith('*.')) {
            const domain = allowedOrigin.slice(2);
            if (hostname.endsWith(domain)) {
                return true;
            }
        } else if (hostname === allowedOrigin || origin === allowedOrigin) {
            return true;
        }
    }
    return false;
}
const axios = require('axios');
const mysql = require('mysql2/promise');

module.exports = async (req, res) => {
    const apiKey = process.env.API_KEY;
    const apiUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const content = req.query.content;
    const url = req.query.url;

    if (!apiKey) {
        return res.status(500).send("摘要生成失败：未设置API_KEY");
    }
    if (!content || content.trim() === "") {
        return res.status(500).send("摘要生成失败：正文内容为空");
    }
    if (!url || url.trim() === "") {
        return res.status(500).send("摘要生成失败：未提供url");
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [rows] = await connection.execute(
            'SELECT summary FROM summaries WHERE url = ?',
            [pageUrl]
        );
        if (rows.length > 0) {
            return res.status(200).send(rows[0].summary);
        }

        const requestBody = {
            model: "qwen-long",
            messages: [
                { role: "system", content: "You are a helpful summary generator." },
                { role: "user", content: `请为以下内容用中文生成长度为150汉字左右的摘要，摘要只有一个自然段，且只给出摘要即可，不要说其他任何话: ${content}` }
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

        res.status(200).send(summary);
    } catch (error) {
        res.status(500).send("摘要生成失败：返回格式不正确");
    } finally {
        await connection.end();
    }
}
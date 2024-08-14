const axios = require('axios');
const { Pool } = require('pg');

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

    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
    });

    const client = await pool.connect();
    const selectQuery = 'SELECT summary FROM summaries WHERE url = $1';
    const selectResult = await client.query(selectQuery, [pageUrl]);

    if (selectResult.rows.length > 0) {
        const { summary } = selectResult.rows[0];
        client.release();
        return res.status(200).send(summary);
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

    try {
        const response = await axios.post(`${apiUrl}/chat/completions`, requestBody, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const summary = response.data.choices[0].message.content.trim();

        const insertQuery = 'INSERT INTO summaries (url, summary) VALUES ($1, $2)';
        await client.query(insertQuery, [pageUrl, summary]);
        client.release();

        res.status(200).send(summary);
    } catch (error) {
        res.status(500).send("摘要生成失败：返回格式不正确");
    }
}
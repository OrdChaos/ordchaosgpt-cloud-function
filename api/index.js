const axios = require('axios');

module.exports = async (req, res) => {
    const apiKey = process.env.API_KEY;
    const original = process.env.ORIGIN;
    const apiUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const content = req.query.content;
    const pageUrl = req.query.url;
    const origin = req.headers.origin;

    if (!apiKey) {
        return res.status(500).send("摘要生成失败：API_KEY 未定义");
    }

    if (!content || content.trim() === '') {
        return res.status(400).send("摘要生成失败：未给定内容");
    }

    if (!pageUrl || pageUrl.trim() === '') {
        return res.status(400).send("摘要生成失败：未提供页面URL");
    }

    try {
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

        await summariesCollection.insertOne({
            url: pageUrl,
            summary: summary,
            createdAt: new Date()
        });

        res.status(200).send(summary);
    } catch (error) {
        res.status(500).send("摘要生成失败：服务器错误");
    }
};
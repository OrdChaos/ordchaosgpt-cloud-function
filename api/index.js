const axios = require('axios');

module.exports = async (req, res) => {
    const apiKey = process.env.API_KEY;
    const apiUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const content = req.query.content || "摘要生成失败：未获取到摘要返回";

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
        res.status(200).send(summary);
    } catch (error) {
        console.error("Error generating summary:", error);
        res.status(500).send("摘要生成失败：返回格式不正确");
    }
};
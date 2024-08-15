# OrdChaosGPT

TianliGPT的下位代替品（大概）

使用阿里云通义千问（qwen-long）作为摘要生成引擎，Vercel部署，MySQL数据库持久化数据储存

优势是无服务器（？真的是优势吗）

缺点是稳定性（至少我不提供SLA保证）与速度（依据文章长度与网速，获取到摘要的时间约5秒）

## 调用

`GET https://your.deployment.address/api/index.js?content=正文&url=对应页面`即可

url相同而再次请求时，不再重复生成内容而直接访问数据库

## 部署-云函数

点击以下按钮以自动部署到Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FOrdChaos%2Fordchaosgpt-cloud-function&env=API_KEY,PROMOTE,ORIGIN,POSTGRES_HOST,POSTGRES_USER,POSTGRES_PASSWORD,POSTGRES_DATABASE&project-name=qwen-long-ordchaosgpt&repository-name=qwen-long-ordchaosgpt)

环境变量：

- API_KEY: 阿里云DashScope模型服务灵积apikey，在[这里](https://dashscope.console.aliyun.com/apiKey)申请
- PROMOTE: 生成前的提示语句，可以自行设置，类似于：`为以下内容给出摘要，满足要求：1.摘要只有一个自然段;2.其中不要包含markdown格式，纯文本即可;3.只需给出摘要，不要说其他任何话4.使用第三人称视角进行转述（用“作者”一词指代作者）而非第一人称;5.100字上下，不要过长;正文：`，你的正文内容会被拼接在Promote的最后，请依此调整你的Promote
- ORIGIN: 要使用api的域名，支持多个（用`,`分割）与泛域名（用`*`）
- POSTGRES_HOST: MySQL数据库地址
- POSTGRES_USER: MySQL数据库用户名
- POSTGRES_PASSWORD: MySQL数据库用户密码
- POSTGRES_DATABASE: MySQL数据库名称

对于你的MySQL数据库，你需要提前建表。

使用以下SQL语句：

```sql
CREATE TABLE summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT NOT NULL
);
```

## 部署-前端

复制并保存以下js：

```javascript
//改写自TianliGPT前端

var ordchaosGPT = {
  getTitleAndContent: function() {
    try {
      const title = document.title;
      const container = document.querySelector(ordchaosGPT_postSelector);
      if (!container) {
        console.warn('ordchaosGPT：找不到文章容器。请尝试将引入的代码放入到文章容器之后。');
        return '';
      }
      const paragraphs = container.getElementsByTagName('p');
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5');
      let content = '';

      for (let h of headings) {
        content += h.innerText + ' ';
      }

      for (let p of paragraphs) {
        const filteredText = p.innerText.replace(/https?:\/\/[^\s]+/g, '');
        content += filteredText;
      }

      const combinedText = title + ' ' + content;
      let wordLimit = 2500;
      if (typeof ordchaosGPT_wordLimit !== "undefined") {
        wordLimit = ordchaosGPT_wordLimit;
      }
      const truncatedText = combinedText.slice(0, wordLimit);
      return truncatedText;
    } catch (e) {
      console.error('ordchaosGPT错误：可能由于一个或多个错误导致没有正常运行，原因出在获取文章容器中的内容失败，或者可能是在文章转换过程中失败。', e);
      return '';
    }
  },

  fetchordchaosGPT: async function(content, url) {
    const apiUrl = `${ordchaosGPT_apiurl}api/index.js?content=${encodeURIComponent(content)}&url=${encodeURIComponent(url)}`;
    const timeout = 30000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(apiUrl, { signal: controller.signal });
      if (response.ok) {
        const summary = await response.text();
        return summary;
      } else {
        throw new Error('请求失败');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('请求超时');
        return '获取文章摘要超时。请稍后再试。';
      } else {
        console.error('请求失败：', error);
        return '获取文章摘要失败，请稍后再试。';
      }
    }
  }
}

function typeWriterEffect(text, element) {
  let charIndex = 0;

  function type() {
    if (charIndex < text.length) {
      element.innerHTML += text.charAt(charIndex);
      charIndex++;
      setTimeout(type, 30);
    }
  }

  element.classList.add('typing');
  type();
}

function runordchaosGPT() {
  const content = ordchaosGPT.getTitleAndContent();
  if (!content && content !== '') {
    console.log('ordchaosGPT本次提交的内容为：' + content);
  }
  const url = window.location.href;
  ordchaosGPT.fetchordchaosGPT(content, url).then(summary => {
    document.querySelector('.ocxq-ai-text').innerHTML = "";
    typeWriterEffect(summary, document.querySelector('.ocxq-ai-text'));
  });
}

runordchaosGPT();
```

在需要生成摘要的页面引用，那之后，添加：

```html
<script>
    let ordchaosGPT_postSelector = '#board .post-content .markdown-body';
    let ordchaosGPT_apiurl = 'https://your.deployment.address/'; //一定要保留最后的斜杠
</script>
```

`ordchaosGPT_postSelector`是需要被替换内容的容器，用[hexo-theme-fluid](https://hexo.fluid-dev.com/)就可以不更改，其它的自己找。

js会自动替换`class="ocxq-ai-text"`的文字，所以在要显示摘要的地方添加即可。

比如：（不要在意memos相关，那是历史遗留的shi山）
```html
<style>
    i.icon-ordchaos-blog-robot, span.ocxq-ai-title {
    font-weight: bold;
    font-size: 1.2em;
    }

    span.ocxq-ai-warn {
    font-weight: bold;
    }

    .ocxq-ai-text.typing::after {
    content: "_";
    margin-left: 2px;
    animation: blink 0.7s infinite;
    }

    @keyframes blink {
    50% {
        opacity: 0;
    }
    }
</style>
<script>
    let ordchaosGPT_postSelector = '#board .post-content .markdown-body';
    let ordchaosGPT_apiurl = 'https://summary.ordchaos.top/';
</script>
<div class="ocxqntcontainer">
    <div class="ocxqnt">
    <span id='memos-t'>
        <i class="iconfont icon-ordchaos-blog-robot"></i><span id="memos-index-space"> </span><span class="ocxq-ai-title">AI摘要</span>
        <br>
        <span class="ocxq-ai-text">
        加载中...
        </span>
        <br>
        <span class="ocxq-ai-warn">摘要由AI自动生成，仅供参考！</span>
    </span>
    </div>
</div>
```

ENJOY！

## ONR MORE THING

欢迎PR，可以修改与增减任何内容（前端部署、AI模型、持久化数据等）

~~有没有人提一个用mongodb的PR？我没什么时间~~

感觉MySQL还是有点臃肿
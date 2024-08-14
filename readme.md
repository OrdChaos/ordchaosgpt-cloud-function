# OrdChaosGPT

TianliGPT的下位代替品（大概）

使用阿里云通义千问（qwen-long）作为摘要生成引擎，vercel部署，mysql数据库持久化数据储存

优势是无服务器（？真的是优势吗）

缺点是稳定性（至少我不提供SLA保证）

## 调用

`GET https://your.deployment.address/api/index.js?content=正文&url=对应页面`即可

url相同而再次请求时，不再重复生成内容而直接访问数据库

## 部署-云函数

点击以下按钮以自动部署到Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FOrdChaos%2Fordchaosgpt-cloud-function&env=API_KEY,ORIGIN,POSTGRES_HOST,POSTGRES_USER,POSTGRES_PASSWORD,POSTGRES_DATABASE&project-name=qwen-long-ordchaosgpt&repository-name=qwen-long-ordchaosgpt)

环境变量：

- API_KEY: 阿里云DashScope模型服务灵积apikey，在[这里](https://dashscope.console.aliyun.com/apiKey)申请
- ORIGIN: 要使用api的域名，支持多个（用`,`分割）与泛域名（用`*`）
- POSTGRES_HOST: mysql数据库地址
- POSTGRES_USER: mysql数据库用户名
- POSTGRES_PASSWORD: mysql数据库用户密码
- POSTGRES_DATABASE: mysql数据库名称

## 部署-前端

复制并保存以下js：

```javascript
//改写自TianliGPT前端

var ordchaosGPT = {
  //读取文章中的所有文本
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
        // 移除包含'http'的链接
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
    const timeout = 30000; // 设置超时时间（毫秒）

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

  // 显示光标
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

感觉mysql还是有点臃肿
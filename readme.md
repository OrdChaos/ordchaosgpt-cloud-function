# OrdChaosGPT

TianliGPT的下位代替品（大概）

使用阿里云通义千问作为摘要生成引擎，vercel部署，mysql数据库持久化数据储存

优势是无服务器（？真的是优势吗）

## 调用

`GET https://your.deployment.address/api?content=正文&url=对应页面`即可

url相同而再次请求时，不再重复生成内容而直接访问数据库

## 部署

点击以下按钮以自动部署到Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FOrdChaos%2Fordchaosgpt-cloud-function&env=API_KEY,ORIGIN,POSTGRES_HOST,POSTGRES_USER,POSTGRES_PASSWORD,POSTGRES_DATABASE&project-name=qwen-long-ordchaosgpt&repository-name=qwen-long-ordchaosgpt)

环境变量：

- API_KEY: 阿里云DashScope模型服务灵积apikey，在[这里](https://dashscope.console.aliyun.com/apiKey)申请
- ORIGIN: 要使用api的域名，支持多个（用`,`分割）与泛域名（用`*`）
- POSTGRES_HOST: mysql数据库地址
- POSTGRES_USER: mysql数据库用户名
- POSTGRES_PASSWORD: mysql数据库用户密码
- POSTGRES_DATABASE: mysql数据库名称

## ONR MORE THING

欢迎PR，可以修改与增减任何内容（前端部署、AI模型、持久化数据等）

~~有没有人提一个用mongodb的PR？我没什么时间~~

感觉mysql还是有点臃肿
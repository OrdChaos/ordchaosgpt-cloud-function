# OrdChaosGPT

TianliGPT的下位代替品（大概）

使用阿里云通义千问作为摘要生成引擎，vercel部署，mysql数据库持久化数据储存

## 调用

`GET https://your.deployment.address/api?content=正文&url=对应页面`即可

url相同而再次请求时，不再重复生成内容而直接访问数据库

## 部署



## ONR MORE THING

有没有人提一个用mongodb的PR？我没什么时间

感觉mysql还是有点臃肿
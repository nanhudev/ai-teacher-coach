# bubbleapp.cn/aiteacher 部署说明

## 静态 Demo（CloudBase Hosting）

线上由静态 SPA + `aiteacher-api` 云托管服务组成。教师生成入口强制调用
DeepSeek 统一课程包，不再静默降级为空框架。

```powershell
cd frontend
$env:VITE_BASE="/aiteacher/"
$env:VITE_API_BASE="/aiteacher/api/v1"
npm run build
tcb hosting deploy "dist" "aiteacher" -e bubble-8g3kzhr57e693e49
```

访问：https://bubbleapp.cn/aiteacher/

## DeepSeek API（必需）

- CloudBase Run 服务名：`aiteacher-api`
- 自定义路由：`/aiteacher/api` → `aiteacher-api`，路径透传
- 服务端环境变量：`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`
- 密钥只配置为云托管环境变量，禁止复制进镜像或 Git
- `ROOT_PATH=`，由路由透传 `/aiteacher/api/v1/...`

健康检查（仅后端在线时）：https://bubbleapp.cn/aiteacher/health

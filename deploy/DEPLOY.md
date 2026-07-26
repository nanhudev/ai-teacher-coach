# bubbleapp.cn/aiteacher 部署说明

## 静态 Demo（CloudBase Hosting）

当前线上为静态 SPA：DeepSeek 流水线不可用时自动走《赤壁赋》离线精品包 + 7 套模板换肤。

```powershell
cd frontend
$env:VITE_BASE="/aiteacher/"
$env:VITE_API_BASE="/aiteacher/api/v1"
npm run build
tcb hosting deploy "dist" "aiteacher" -e bubble-8g3kzhr57e693e49
```

访问：https://bubbleapp.cn/aiteacher/

## 可选：完整 API（需自备后端）

- `ROOT_PATH=`（nginx 剥掉 `/aiteacher`）或 `ROOT_PATH=/aiteacher`
- 参考 `deploy/nginx-aiteacher.conf.example`
- 流式生成需 `proxy_buffering off`

健康检查（仅后端在线时）：https://bubbleapp.cn/aiteacher/health

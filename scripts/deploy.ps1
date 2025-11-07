# 部署脚本（Windows PowerShell）

Write-Host "开始部署..." -ForegroundColor Green

# 安装依赖
Write-Host "安装依赖..." -ForegroundColor Yellow
npm install

# 构建项目
Write-Host "构建项目..." -ForegroundColor Yellow
npm run build

# 检查构建是否成功
if ($LASTEXITCODE -eq 0) {
    Write-Host "构建成功！" -ForegroundColor Green
    Write-Host "运行 npm start 启动服务器" -ForegroundColor Cyan
} else {
    Write-Host "构建失败，请检查错误信息" -ForegroundColor Red
    exit 1
}


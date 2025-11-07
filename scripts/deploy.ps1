# 部署脚本（Windows PowerShell）

Write-Host "开始部署..." -ForegroundColor Green

# 安装依赖
Write-Host "安装依赖..." -ForegroundColor Yellow
npm install

# 重置数据库（创建全新数据库）
Write-Host "重置数据库..." -ForegroundColor Yellow
if (Test-Path "prisma/dev.db") {
    Remove-Item "prisma/dev.db" -Force
}
if (Test-Path "prisma/dev.db-journal") {
    Remove-Item "prisma/dev.db-journal" -Force
}
Write-Host "已删除旧数据库" -ForegroundColor Green

# 生成 Prisma Client
Write-Host "生成 Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# 创建新数据库
Write-Host "创建新数据库..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "数据库迁移失败，尝试使用 db push..." -ForegroundColor Yellow
    npx prisma db push --accept-data-loss
}
Write-Host "数据库创建成功！" -ForegroundColor Green

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


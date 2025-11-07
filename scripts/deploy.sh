#!/bin/bash
# 部署脚本示例（Linux/Mac）

echo "开始部署..."

# 安装依赖
echo "安装依赖..."
npm install

# 重置数据库（创建全新数据库）
echo "重置数据库..."
rm -f prisma/dev.db prisma/dev.db-journal
echo "已删除旧数据库"

# 生成 Prisma Client
echo "生成 Prisma Client..."
npx prisma generate

# 创建新数据库
echo "创建新数据库..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo "数据库迁移失败，尝试使用 db push..."
    npx prisma db push --accept-data-loss
fi
echo "数据库创建成功！"

# 构建项目
echo "构建项目..."
npm run build

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "构建成功！"
    echo "运行 npm start 启动服务器，或使用 PM2：pm2 start ecosystem.config.js"
else
    echo "构建失败，请检查错误信息"
    exit 1
fi


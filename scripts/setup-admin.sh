#!/bin/bash

# 后台管理员密码设置脚本
# 用于快速配置 ADMIN_PASSWORD 环境变量

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}后台管理员密码设置工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$PROJECT_DIR"

# 1. 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo -e "${YELLOW}警告: .env 文件不存在，正在创建...${NC}"
    cat > .env << EOF
# 数据库配置（SQLite）
DATABASE_URL="file:$PROJECT_DIR/prisma/prisma/dev.db"

# Node.js 环境
NODE_ENV=production
PORT=3000

# 后台管理配置
ADMIN_PASSWORD=
ADMIN_SECRET=hffx-secret-change-me
EOF
    echo -e "${GREEN}.env 文件已创建${NC}"
fi

# 2. 检查是否已设置密码
CURRENT_PASSWORD=$(grep "^ADMIN_PASSWORD=" .env 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -n "$CURRENT_PASSWORD" ] && [ "$CURRENT_PASSWORD" != "your_secure_password_here" ]; then
    echo -e "${YELLOW}当前已设置管理员密码${NC}"
    read -p "是否要修改密码？(y/n): " CHANGE_PASSWORD
    if [ "$CHANGE_PASSWORD" != "y" ] && [ "$CHANGE_PASSWORD" != "Y" ]; then
        echo -e "${GREEN}保持当前密码不变${NC}"
        exit 0
    fi
fi

# 3. 提示输入新密码
echo ""
echo -e "${YELLOW}请设置后台管理员密码：${NC}"
echo -e "${YELLOW}提示：密码应包含字母、数字和特殊字符，长度至少 8 位${NC}"
echo ""

# 读取密码（隐藏输入）
read -s -p "请输入新密码: " NEW_PASSWORD
echo ""
read -s -p "请再次输入密码: " NEW_PASSWORD_CONFIRM
echo ""

# 4. 验证密码
if [ -z "$NEW_PASSWORD" ]; then
    echo -e "${RED}错误: 密码不能为空${NC}"
    exit 1
fi

if [ "$NEW_PASSWORD" != "$NEW_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}错误: 两次输入的密码不一致${NC}"
    exit 1
fi

if [ ${#NEW_PASSWORD} -lt 8 ]; then
    echo -e "${YELLOW}警告: 密码长度少于 8 位，建议使用更强的密码${NC}"
    read -p "是否继续？(y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        echo -e "${YELLOW}已取消${NC}"
        exit 0
    fi
fi

# 5. 更新 .env 文件
echo ""
echo -e "${GREEN}正在更新 .env 文件...${NC}"

# 检查是否已存在 ADMIN_PASSWORD 配置
if grep -q "^ADMIN_PASSWORD=" .env; then
    # 替换现有配置
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=\"$NEW_PASSWORD\"|" .env
    else
        # Linux
        sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=\"$NEW_PASSWORD\"|" .env
    fi
else
    # 添加新配置
    echo "" >> .env
    echo "# 后台管理配置" >> .env
    echo "ADMIN_PASSWORD=\"$NEW_PASSWORD\"" >> .env
    echo "ADMIN_SECRET=hffx-secret-change-me" >> .env
fi

echo -e "${GREEN}密码已设置${NC}"

# 6. 验证配置
echo ""
echo -e "${GREEN}[验证配置]${NC}"
if grep -q "^ADMIN_PASSWORD=" .env; then
    echo -e "${GREEN}✓ ADMIN_PASSWORD 已配置${NC}"
else
    echo -e "${RED}✗ ADMIN_PASSWORD 配置失败${NC}"
    exit 1
fi

# 7. 提示下一步操作
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}配置完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}下一步操作：${NC}"
echo ""
echo -e "1. 重新构建项目（如果已构建）："
echo -e "   ${GREEN}npm run build${NC}"
echo ""
echo -e "2. 重启 PM2 进程（如果已启动）："
echo -e "   ${GREEN}pm2 restart hsfx-site${NC}"
echo ""
echo -e "3. 访问后台管理："
echo -e "   ${GREEN}http://your-domain.com/admin/login${NC}"
echo ""
echo -e "${YELLOW}使用刚才设置的密码登录${NC}"
echo ""

# 8. 询问是否立即重启 PM2
if command -v pm2 &> /dev/null; then
    read -p "是否立即重启 PM2 进程？(y/n): " RESTART_PM2
    if [ "$RESTART_PM2" = "y" ] || [ "$RESTART_PM2" = "Y" ]; then
        echo ""
        echo -e "${GREEN}正在重启 PM2...${NC}"
        pm2 restart hsfx-site 2>/dev/null || pm2 restart all
        echo -e "${GREEN}PM2 已重启${NC}"
    fi
fi

echo ""
echo -e "${GREEN}完成！${NC}"


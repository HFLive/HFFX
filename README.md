# 华南师大附中返校团队官方网站

## 部署教程

1. **安装宝塔面板**  
2. **进入网站根目录**  
    ```bash
    cd /www/wwwroot
    ```

3. **克隆仓库**

    ```bash
    git clone 本仓库
    ```

4. **进入项目目录**

    ```bash
    cd hsfzfx
    ```
5. **安装依赖**

    ```bash
    npm install
    ```
6. **创建 `.env` 文件**
    内容格式如下：

    ```env
    DATABASE_URL="file:./prisma/dev.db"
    ADMIN_PASSWORD="PASSWORD"
    ADMIN_SECRET="e9DFxGYouPoQt0rBuv0J/Ip9pqN6M4NnT+8KBb4W6jsGwjWKpALFwq6PEgyZ0tXc"
    ```

7. **删除旧数据库文件**

    ```bash
    rm -f prisma/dev.db prisma/dev.db-journal
    ```

8. **生成 Prisma 文件**

    ```bash
    npm run prisma:generate
    ```

9. **执行数据库迁移**

    ```bash
    npx prisma migrate deploy
    ```

10. **构建项目**

    ```bash
    npm run build
    ```

11. **启动项目（测试用）**

    ```bash
    npm start
    ```

12. **使用 PM2 后台启动项目**

    ```bash
    pm2 start npm --name "hffx-site" -- start
    ```

13. **创建网站并启动反向代理**

    * **目标 URL：** `http://127.0.0.1:3000`
    * **发送域名：** `您的域名`

14. **申请 SSL 证书**
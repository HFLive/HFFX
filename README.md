# 华南师大附中返校团队官方网站

git clone ....
npm install
.env
rm -f prisma/dev.db prisma/dev.db-journal
npm run prisma:generate
npx prisma migrate deploy
npm run build
npm start
pm2 start npm --name "hffx-site" -- start
pm2 save
pm2 startup
创建网站并启动反向代理
目标 URL http://127.0.0.1:3000
发送域名 2025fx.hsfz.live

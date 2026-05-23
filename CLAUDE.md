# Carton CRM — AI全自动外贸获客助手

## 项目结构

```
├── backend/              Express + TypeScript + Prisma
│   ├── prisma/schema.prisma
│   └── src/
│       ├── config/          环境配置
│       ├── controllers/     控制器
│       ├── middleware/       auth, errorHandler
│       ├── routes/          路由
│       ├── services/        业务逻辑
│       └── utils/           工具 (prisma, crypto, importMapping)
├── frontend/             React 18 + Vite + Tailwind CSS v3
│   ├── src/
│   │   ├── components/       UI组件 (ui/ 下为 shadcn-style 基础组件)
│   │   │   ├── ui/          button, card, input, badge, progress, separator, label, avatar
│   │   │   └── layout/      AppLayout, Sidebar, TopNav
│   │   ├── contexts/        Auth, Theme, Toast
│   │   ├── pages/           Customers, Dashboard, Analytics, Campaigns, Tasks, ...
│   │   └── types/           lucide-react.d.ts (图标类型声明)
│   └── tailwind.config.js
├── *.json                 客户数据备份 (carton-crm-backup-*.json)
├── CLAUDE.md              项目指南
└── package.json            monorepo (npm workspaces)
```

## 开发命令

```bash
npm run dev            # 同时启动前后端
npm run dev:backend    # 仅后端 (localhost:3001)
npm run dev:frontend   # 仅前端 (localhost:5173)
npm run build          # 构建前后端
npm run db:push        # Prisma schema → DB (不生成迁移)
npm run db:migrate     # Prisma 迁移
npm run db:generate    # 生成 Prisma Client
npm run db:studio      # Prisma Studio
```

## 技术栈

- **Monorepo**: npm workspaces
- **后端**: Express 4 + TypeScript 5 + Prisma 5 + PostgreSQL
- **前端**: React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + shadcn/ui
- **认证**: JWT (bcryptjs + jsonwebtoken)
- **图表**: Recharts (懒加载 Analytics 页面)

## 关键约定

### Apple 设计系统
所有颜色通过 CSS 变量控制，支持暗色模式自动切换：
- `text-apple-black` / `bg-apple-background` / `bg-apple-card` / `border-apple-border`
- 变量定义在 `frontend/src/index.css` (:root + .dark)
- 不使用 `dark:` Tailwind 前缀，所有颜色通过 CSS 变量自动响应
- 圆角: 10px (input/button), 12px (card)
- 字体: Inter, 字体大小 system: display(28px) / heading(20px) / subheading(16px) / body(14px) / caption(12px)
- 动画: `animate-fade-in` (300ms ease-out)

### 后端规范
- 路由定义在 `routes/`，认证通过 `authenticate` 中间件
- `AuthRequest` 扩展 Express Request，包含 `userId?`
- 错误处理: `AppError` class + `errorHandler` 中间件
- 数据校验: zod schemas
- 数据库列名: Prisma 默认使用 camelCase

### 前端规范
- 路径别名: `@/` 映射到 `src/`
- API 调用: 直接 `fetch('/api/...')`，通过 Vite proxy 转发
- Token: `localStorage.getItem('token')`，通过 Authorization header 传递
- Toast通知: `useToast()` hook → `toast('success'|'error'|'info'|'warning', message)`
- 主题: `useTheme()` hook → `{ theme, toggle, setTheme }`
- 认证: `useAuth()` → `{ user, login, register, logout }`
- 图标: lucide-react (类型声明在 `src/types/lucide-react.d.ts`，新增图标需同时添加)

### 代码风格
- 不写多余注释，只注释 WHY（隐藏约束、微妙的不变量、特殊 bug 的 workaround）
- 不使用 emoji
- 默认不使用 `dark:` Tailwind 类名（CSS 变量已处理）
- 同名导入优先使用 `@/` 别名而非相对路径

### 客户数据导入导出
- 导入字段映射: `backend/src/utils/importMapping.ts`
- 备份 JSON 格式字段（`name`, `mainProduct`, `contactPerson`, `stage`, `priority` 等）→ Prisma Customer 模型
- 扩展字段存储在 `notes` 字段（JSON 字符串）
- 导出兼容原始备份格式（JSON / XLSX）
- 导入去重: 按 company + userId 判断

## 数据库

- PostgreSQL on localhost:5432, database: `carton_crm`
- 核心模型: User, Customer, Contact, Interaction, EmailCampaign, AutomationTask, Quote
- 详见 `backend/prisma/schema.prisma`

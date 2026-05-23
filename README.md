# AI 膳食眼镜

AI 膳食眼镜是一套面向智能饮食管理场景的软硬件协同项目，包含 Spring Boot 后端服务与 UniApp 微信小程序端。项目围绕膳食图像识别、营养估算、饮食记录、报告统计、用户账户管理和个性化膳食建议展开，适用于智能眼镜采集饮食图像后进行云端识别与健康管理的应用场景。

## 项目信息

- 中文名称：AI 膳食眼镜
- 仓库名称：`ai-diet-glasses`
- 仓库描述：基于 AI 膳食识别的智能眼镜饮食管理系统，包含 Spring Boot 后端与 UniApp 微信小程序端。

## 功能特性

- 支持食物图片识别与热量估算
- 支持饮食记录保存、查询与删除
- 支持每日摄入热量统计与目标热量计算
- 支持蛋白质、脂肪、碳水等营养数据展示
- 支持 AI 饮食助手，根据用户饮食数据提供建议
- 支持用户登录、注册、邮箱绑定、验证码与密码重置
- 支持微信小程序端的首页、识别、报告、设备管理和个人中心页面
- 支持智能眼镜设备端上传图片到后端进行识别

## 技术栈

### 后端

- Java 17
- Spring Boot
- Spring Web MVC
- Spring JDBC
- MySQL
- Aliyun OSS
- DashScope 通义千问模型 API

### 小程序端

- UniApp
- Vue 3
- Pinia
- 微信小程序构建目标

## 项目结构

```text
.
|-- Food-system2/          # Spring Boot 后端服务
|   |-- database/          # 数据库建表脚本
|   `-- src/               # 后端源码与配置
|-- food-wexin/            # UniApp 微信小程序
|   |-- api/               # 接口请求封装
|   |-- components/        # 通用组件
|   |-- pages/             # 主包页面
|   |-- subpackages/       # 分包页面
|   `-- static/            # 静态资源
|-- .env.example           # 环境变量示例
|-- SECURITY.md            # 安全说明
`-- README.md
```

## 配置说明

项目不应把真实密码、云服务密钥、邮箱授权码或模型 API Key 提交到 GitHub。后端已改为从环境变量读取敏感配置。

后端常用环境变量如下：

```text
DB_URL=jdbc:mysql://localhost:3306/diet_system?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf-8
DB_USERNAME=diet_admin
DB_PASSWORD=your_mysql_password
ALIYUN_OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_OSS_BUCKET_NAME=your_bucket_name
MAIL_HOST=smtp.qq.com
MAIL_PORT=587
MAIL_USERNAME=your_email@qq.com
MAIL_PASSWORD=your_email_authorization_code
QWEN_API_KEY=your_dashscope_api_key
```

可以参考根目录的 `.env.example` 和后端目录下的 `Food-system2/src/main/resources/application.example.properties`。

## 后端启动

1. 创建 MySQL 数据库：

```sql
CREATE DATABASE diet_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据库表结构：

```powershell
mysql -u root -p diet_system < Food-system2/database/minimal_schema.sql
```

3. 启动后端服务：

```powershell
cd Food-system2
.\mvnw.cmd spring-boot:run
```

默认服务地址：

```text
http://localhost:8080
```

## 小程序端启动

1. 安装依赖：

```powershell
cd food-wexin
npm install
```

2. 启动 H5 开发环境：

```powershell
npm run serve
```

3. 构建微信小程序：

```powershell
npm run build:mp-weixin
```

构建完成后，可以使用微信开发者工具打开生成的小程序项目。

## 接口地址配置

小程序端的接口请求封装在 `food-wexin/api/request.js` 中，支持运行时与构建时配置接口地址。

- H5 开发环境默认使用 `/backend`
- 小程序本地开发默认使用 `http://localhost:8080`
- 生产环境会使用当前配置的远程服务地址

可以通过以下环境变量覆盖默认接口地址：

```text
VUE_APP_API_BASE_URL=http://localhost:8080
VUE_APP_MP_WEIXIN_API_BASE_URL=http://your-lan-ip:8080
```

## 安全注意事项

- 不要提交真实数据库密码、OSS Key、邮箱授权码和模型 API Key
- 如果密钥曾经出现在源码、截图、聊天记录或 Git 历史中，应立即到对应平台重置
- 本地私密配置建议放在 `.env` 或 `application-local.properties`
- 不要提交 `node_modules`、`target`、`unpackage`、IDE 配置和本地构建产物

## 当前状态

- 后端 Maven 测试已通过
- 前端 `package.json` 已修复为合法 JSON
- 前端依赖未随仓库提交，需要在本地执行 `npm install`

## 开源许可

当前仓库尚未声明开源许可证。如需公开复用或分发代码，建议后续补充合适的 License。

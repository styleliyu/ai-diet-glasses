# AI Diet Glasses

AI Diet Glasses is an AI-powered dietary management project for smart glasses scenarios. It combines a Spring Boot backend with a UniApp WeChat mini program to support meal image recognition, nutrition estimation, diet records, reports, account management, and personalized dietary guidance.

## Project Name

- Chinese name: AI 膳食眼镜
- Repository name: `ai-diet-glasses`
- GitHub description: 基于 AI 膳食识别的智能眼镜饮食管理系统，包含 Spring Boot 后端与 UniApp 微信小程序端。

## Features

- AI food image recognition and calorie estimation
- Meal record storage and daily intake statistics
- Nutrition data including calories, protein, fat, and carbohydrates
- Personalized diet advice through an AI assistant
- User login, registration, email verification, and password reset
- WeChat mini program pages for home, recognition, reports, device management, and profile settings
- Backend APIs for mini program and smart glasses device uploads

## Tech Stack

### Backend

- Java 17
- Spring Boot
- Spring Web MVC
- Spring JDBC
- MySQL
- Aliyun OSS
- DashScope Qwen model API

### Mini Program

- UniApp
- Vue 3
- Pinia
- WeChat Mini Program build target

## Repository Structure

```text
.
├── Food-system2/          # Spring Boot backend service
│   ├── database/          # Database schema
│   └── src/               # Backend source code and resources
├── food-wexin/            # UniApp WeChat mini program
│   ├── api/               # API request helpers
│   ├── components/        # Shared UI components
│   ├── pages/             # Main mini program pages
│   ├── subpackages/       # Feature subpackages
│   └── static/            # Static assets
└── README.md
```

## Configuration

Do not commit real passwords, cloud keys, or model API keys to GitHub. The backend reads sensitive values from environment variables.

Required backend environment variables:

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

## Backend Setup

1. Create a MySQL database:

```sql
CREATE DATABASE diet_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import the schema:

```powershell
mysql -u root -p diet_system < Food-system2/database/minimal_schema.sql
```

3. Start the backend:

```powershell
cd Food-system2
.\mvnw.cmd spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

## Mini Program Setup

1. Install dependencies:

```powershell
cd food-wexin
npm install
```

2. Run the H5 development server:

```powershell
npm run serve
```

3. Build WeChat mini program output:

```powershell
npm run build:mp-weixin
```

Then open the generated mini program project with WeChat DevTools.

## API Base URL

The mini program API helper supports runtime and build-time API base URLs.

- H5 development uses `/backend`
- Local mini program development uses `http://localhost:8080`
- Production fallback currently points to the configured remote server

You can override it with environment variables such as:

```text
VUE_APP_API_BASE_URL=http://localhost:8080
VUE_APP_MP_WEIXIN_API_BASE_URL=http://your-lan-ip:8080
```

## Security Notes

- Rotate any credentials that were previously stored in source files.
- Use local environment variables or `application-local.properties` for private configuration.
- Do not commit build output, local IDE files, `node_modules`, or generated mini program bundles.

## License

This repository does not currently declare an open-source license.

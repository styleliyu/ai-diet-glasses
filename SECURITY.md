# Security Policy

## Secrets

Do not commit real credentials to this repository.

Sensitive values must be provided through environment variables or local-only configuration files such as:

- `.env`
- `.env.local`
- `Food-system2/src/main/resources/application-local.properties`

The repository includes `.env.example` and `Food-system2/src/main/resources/application.example.properties` as safe templates.

## Credential Rotation

If a credential has ever been committed, shared, or exposed in logs, rotate it immediately from the provider console. This includes:

- MySQL passwords
- Aliyun OSS access keys
- Email authorization codes
- DashScope Qwen API keys

## Reporting Issues

For private security issues, contact the project owner directly instead of opening a public GitHub issue.

# Development Environment Setup Guide

## Task 1.4 - Setup development environment configuration

Este guia descreve como configurar e usar o ambiente de desenvolvimento do
Advanced Document Management System.

## 📋 Pré-requisitos

- Node.js 18+ e npm 9+
- Docker Desktop ou Docker Engine
- Git
- VS Code (recomendado)

## 🚀 Configuração Inicial

### 1. Instalação de Dependências

```bash
# Instalar dependências do projeto
npm install

# Configurar hooks do Git
npm run prepare
```

### 2. Configuração do Ambiente

```bash
# Configurar hot reload para desenvolvimento
npm run setup:hot-reload

# Configurar ambiente Docker
npm run docker:setup
```

### 3. Iniciar Ambiente de Desenvolvimento

```bash
# Opção 1: Usar o gerenciador interativo
npm run docker:manager

# Opção 2: Comandos diretos
npm run docker:dev          # Iniciar todos os serviços
npm run docker:dev:build    # Iniciar com rebuild
npm run docker:dev:logs     # Ver logs
```

## 🔧 Configurações de Qualidade de Código

### ESLint e Prettier

O projeto está configurado com:

- **ESLint**: Análise estática de código
- **Prettier**: Formatação automática
- **Lint-staged**: Execução automática em commits

```bash
# Executar linting
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Formatar código
npm run format

# Verificar formatação
npm run format:check
```

### Git Hooks (Husky)

Hooks automáticos configurados:

- **pre-commit**: Executa lint-staged
- **commit-msg**: Valida mensagens de commit

### Padrão de Commits (Commitlint)

Formato: `type(scope): description`

**Tipos permitidos:**

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Escopos disponíveis:**

- `auth`, `document`, `python`, `web`, `shared`, `docker`, `ci`, etc.

**Exemplos:**

```bash
git commit -m "feat(auth): adicionar autenticação JWT"
git commit -m "fix(document): corrigir upload de arquivos"
git commit -m "docs(readme): atualizar guia de instalação"
```

## 🐳 Gerenciamento Docker

### Scripts Disponíveis

```bash
# Gerenciador interativo
npm run docker:manager

# Comandos específicos
node scripts/dev-docker.js start [--build]
node scripts/dev-docker.js stop [--volumes]
node scripts/dev-docker.js restart <service>
node scripts/dev-docker.js logs <service> [--follow]
node scripts/dev-docker.js status
node scripts/dev-docker.js cleanup [--images]
```

### Serviços Disponíveis

| Serviço          | Porta | Descrição                   |
| ---------------- | ----- | --------------------------- |
| postgres         | 5433  | Banco de dados PostgreSQL   |
| redis            | 6379  | Cache e sessões             |
| elasticsearch    | 9200  | Motor de busca              |
| minio            | 9000  | Armazenamento S3-compatível |
| auth-service     | 3001  | Serviço de autenticação     |
| document-service | 3002  | Serviço de documentos       |
| python-analysis  | 8001  | Serviço de análise Python   |
| web-client       | 3000  | Cliente web React           |

## 🔥 Hot Reload

### Configuração Automática

O hot reload é configurado automaticamente para:

- **Node.js Services**: Usando Nodemon
- **React Client**: Usando Vite HMR
- **Python Service**: Usando Uvicorn reload

### Volumes Docker

Os containers de desenvolvimento montam volumes para:

```yaml
volumes:
  - ./packages/auth-service:/app/packages/auth-service
  - ./packages/shared:/app/packages/shared
  - /app/packages/auth-service/node_modules # Preserva node_modules
```

### Variáveis de Ambiente

```bash
# Hot reload habilitado
HOT_RELOAD=true
CHOKIDAR_USEPOLLING=true
CHOKIDAR_INTERVAL=1000

# Para Vite (React)
VITE_HMR_HOST=localhost
VITE_HMR_PORT=5173

# Para Python
PYTHONUNBUFFERED=1
RELOAD=true
```

## 🐛 Debug

### VS Code Debug

Configurações automáticas criadas em `.vscode/launch.json`:

1. **Debug Auth Service (Docker)** - Porta 9229
2. **Debug Document Service (Docker)** - Porta 9230
3. **Debug Python Analysis (Docker)** - Porta 5678

### Comandos de Debug

```bash
# Executar com debug habilitado
npm run dev:debug:auth
npm run dev:debug:document

# Para Python, usar debugpy
python -m debugpy --listen 0.0.0.0:5678 --wait-for-client -m uvicorn src.main:app --reload
```

## 🌍 Configuração de Ambiente

### Arquivos de Configuração

- `config/development.env` - Configurações de desenvolvimento
- `config/production.env` - Configurações de produção

### Variáveis Principais

```bash
# Aplicação
NODE_ENV=development
APP_NAME=Advanced DMS
DEFAULT_LANGUAGE=pt-PT
SUPPORTED_LANGUAGES=pt-PT,en-US,fr-FR

# Banco de dados
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=adms_dev

# Autenticação
JWT_SECRET=dev_jwt_secret_key
BCRYPT_ROUNDS=10

# Armazenamento
STORAGE_PROVIDER=local
MAX_FILE_SIZE=100MB
```

### Classe de Configuração

```typescript
import { config } from '@adms/shared/config/environment';

// Usar configurações
const dbUrl = config.getDatabaseUrl();
const redisUrl = config.getRedisUrl();
const languages = config.getSupportedLanguages();

// Verificar ambiente
if (config.isDevelopment()) {
  console.log('Modo desenvolvimento');
}
```

## 📊 Monitoramento

### Logs

```bash
# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f auth-service

# Usar o gerenciador
npm run docker:manager
# Selecionar opção 7 ou 8 para logs
```

### Health Checks

```bash
# Verificar status dos serviços
npm run docker:health

# Ou usar o gerenciador
npm run docker:manager
# Selecionar opção 6 para status
```

### Métricas

- **Health endpoints**: `/health` em cada serviço
- **Métricas**: Porta 9090 (quando habilitado)
- **Logs estruturados**: Formato JSON em produção

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm run test:packages
npm run test:auth
npm run test:document
npm run test:web

# Com coverage
npm run test:coverage
```

### Testes de Configuração

```bash
# Testar configurações
npm test -- --testPathPattern="config-utilities"

# Testar Docker
npm test -- --testPathPattern="docker"

# Testar build
npm test -- --testPathPattern="build"
```

## 🔄 Fluxo de Desenvolvimento

### 1. Iniciar Desenvolvimento

```bash
# Configurar ambiente (primeira vez)
npm run setup:hot-reload

# Iniciar serviços
npm run docker:dev
```

### 2. Fazer Alterações

- Editar código em `packages/*/src/`
- Hot reload automático nos containers
- Logs visíveis em tempo real

### 3. Testar

```bash
# Executar testes
npm test

# Verificar linting
npm run lint
```

### 4. Commit

```bash
# Adicionar arquivos
git add .

# Commit (hooks automáticos executam)
git commit -m "feat(auth): nova funcionalidade"
```

## 🚨 Solução de Problemas

### Docker Issues

```bash
# Limpar containers e volumes
npm run docker:clean

# Rebuild completo
npm run docker:dev:build

# Verificar logs
npm run docker:dev:logs
```

### Hot Reload Issues

```bash
# Reconfigurar hot reload
npm run setup:hot-reload

# Verificar volumes no docker-compose.override.yml
# Reiniciar serviço específico
docker compose restart auth-service
```

### Port Conflicts

```bash
# Verificar portas em uso
netstat -an | findstr :5433
netstat -an | findstr :6379

# Parar outros serviços PostgreSQL/Redis
# Ou alterar portas em config/development.env
```

### Permission Issues

```bash
# Windows: Executar como administrador
# Linux/Mac: Verificar permissões Docker
sudo usermod -aG docker $USER
```

## 📚 Recursos Adicionais

### Documentação

- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nodemon Configuration](https://nodemon.io/)
- [Vite HMR](https://vitejs.dev/guide/features.html#hot-module-replacement)
- [Commitlint](https://commitlint.js.org/)

### Scripts Úteis

```bash
# Ver todos os scripts disponíveis
npm run

# Ajuda do gerenciador Docker
node scripts/dev-docker.js --help

# Configurar VS Code
code .vscode/launch.json
```

### Estrutura de Arquivos

```
├── config/                 # Configurações de ambiente
├── scripts/               # Scripts de desenvolvimento
├── .husky/               # Git hooks
├── .vscode/              # Configurações VS Code
├── docker-compose.*.yml  # Configurações Docker
├── .lintstagedrc.js     # Configuração lint-staged
├── .commitlintrc.js     # Configuração commitlint
└── packages/            # Código dos serviços
```

## ✅ Checklist de Configuração

- [ ] Node.js 18+ instalado
- [ ] Docker Desktop rodando
- [ ] Dependências instaladas (`npm install`)
- [ ] Hot reload configurado (`npm run setup:hot-reload`)
- [ ] Ambiente Docker iniciado (`npm run docker:dev`)
- [ ] Testes passando (`npm test`)
- [ ] Git hooks funcionando (fazer um commit teste)
- [ ] VS Code debug configurado
- [ ] Logs visíveis e serviços saudáveis

---

**Próximos passos**: Com o ambiente configurado, você pode prosseguir para a
implementação dos serviços individuais (Tasks 1.5+).

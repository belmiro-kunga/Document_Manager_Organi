# Sistema de Gestão Documental Avançado

> Advanced Document Management System - Multilingual (PT/EN/FR) with AI

Um sistema de gestão documental moderno, colaborativo e seguro, desenvolvido
especificamente para o mercado angolano com suporte multilíngue e
funcionalidades avançadas de IA.

## 🌟 Características Principais

### 🗣️ **Multilíngue Nativo**

- **Português (PT)** - Língua principal, otimizado para Angola
- **English (EN)** - Língua secundária para mercado internacional
- **Français (FR)** - Língua secundária para países francófonos

### 🤖 **IA Avançada**

- Classificação automática de documentos
- OCR multilíngue com Tesseract
- Geração de documentos com OpenAI
- Análise de conteúdo e extração de entidades
- Tradução automática entre idiomas

### 📱 **Acesso Universal**

- Progressive Web App (PWA) com suporte offline
- Interface responsiva para desktop e mobile
- Sincronização automática quando voltar online

### 🔒 **Segurança Enterprise**

- Zero Trust Architecture
- Autenticação biométrica (WebAuthn)
- Data Loss Prevention (DLP)
- Controle de acesso granular (RBAC)

### 🔗 **Integrações Enterprise**

- Microsoft 365 (Office, Teams, SharePoint, Outlook)
- Google Workspace (Drive, Docs, Gmail, Calendar)
- Slack/Teams para notificações
- Webhooks e API para integrações customizadas

## 🏗️ Arquitetura

### Microserviços

```
├── packages/
│   ├── shared/              # Utilitários e tipos compartilhados
│   ├── auth-service/        # Serviço de autenticação
│   ├── document-service/    # Serviço de gestão de documentos
│   ├── python-analysis/     # Serviço Python para OCR e IA
│   └── web-client/          # Interface React
```

### Stack Tecnológica

**Backend:**

- Node.js + TypeScript + NestJS
- Python + FastAPI (para OCR e IA)
- PostgreSQL + Redis + ElasticSearch
- Docker + Kubernetes

**Frontend:**

- React + TypeScript + Tailwind CSS
- PWA com Service Workers
- i18n para multilíngue

**IA e Processamento:**

- OpenAI GPT-4 para geração de texto
- Tesseract OCR para extração de texto
- spaCy para NLP multilíngue
- Transformers para análise avançada

**Armazenamento:**

- Local Storage (filesystem)
- AWS S3 / Cloudflare R2 / Wasabi
- Backup automático e redundância

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- ElasticSearch 8+

### Instalação

1. **Clone o repositório:**

```bash
git clone https://github.com/your-org/advanced-document-management-system.git
cd advanced-document-management-system
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Configure as variáveis de ambiente:**

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Inicie o ambiente de desenvolvimento:**

```bash
npm run docker:dev
```

5. **Acesse a aplicação:**

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000
- Python Analysis: http://localhost:8001

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Inicia todos os serviços
npm run dev:auth           # Apenas serviço de autenticação
npm run dev:document       # Apenas serviço de documentos
npm run dev:python         # Apenas serviço Python
npm run dev:web            # Apenas frontend

# Build
npm run build              # Build de todos os serviços
npm run build:auth         # Build do serviço de autenticação
npm run build:document     # Build do serviço de documentos
npm run build:web          # Build do frontend

# Testes
npm test                   # Executa todos os testes
npm run test:auth          # Testes do serviço de autenticação
npm run test:document      # Testes do serviço de documentos
npm run test:web           # Testes do frontend

# Linting
npm run lint               # Lint de todos os projetos
npm run lint:fix           # Fix automático de problemas de lint

# Docker
npm run docker:dev         # Ambiente de desenvolvimento
npm run docker:prod        # Ambiente de produção
npm run docker:down        # Para todos os containers
```

## 📚 Documentação

### Estrutura do Projeto

```
advanced-document-management-system/
├── .kiro/                          # Especificações e configurações Kiro
│   └── specs/
│       └── advanced-document-management-system/
│           ├── requirements.md     # Requisitos do sistema
│           ├── design.md          # Documento de design
│           └── tasks.md           # Plano de implementação
├── packages/
│   ├── shared/                    # Biblioteca compartilhada
│   │   ├── src/
│   │   │   ├── types/            # Tipos TypeScript
│   │   │   ├── utils/            # Funções utilitárias
│   │   │   ├── constants/        # Constantes do sistema
│   │   │   ├── validation/       # Esquemas de validação (Zod)
│   │   │   └── errors/           # Classes de erro customizadas
│   │   └── package.json
│   ├── auth-service/             # Serviço de autenticação
│   ├── document-service/         # Serviço de gestão de documentos
│   ├── python-analysis/          # Serviço Python para OCR e IA
│   └── web-client/               # Interface React
├── docker-compose.dev.yml        # Docker Compose para desenvolvimento
├── docker-compose.prod.yml       # Docker Compose para produção
├── package.json                  # Configuração do monorepo
├── tsconfig.json                 # Configuração TypeScript compartilhada
├── .eslintrc.js                  # Configuração ESLint
├── .prettierrc                   # Configuração Prettier
└── README.md                     # Este arquivo
```

### Configuração de Idiomas

O sistema suporta três idiomas com configuração automática:

```typescript
// Configuração automática baseada no idioma do utilizador
const LOCALIZATION_CONFIG = {
  defaultLanguage: 'pt-PT', // Português (Angola)
  supportedLanguages: ['pt-PT', 'en-US', 'fr-FR'],
  fallbackLanguage: 'pt-PT',
  dateFormats: {
    'pt-PT': 'DD/MM/YYYY', // Formato angolano
    'en-US': 'MM/DD/YYYY', // Formato americano
    'fr-FR': 'DD/MM/YYYY', // Formato francês
  },
  currencyFormats: {
    'pt-PT': 'AOA', // Kwanza angolano
    'en-US': 'USD', // Dólar americano
    'fr-FR': 'EUR', // Euro
  },
  timezones: {
    'pt-PT': 'Africa/Luanda', // Fuso horário de Angola (WAT)
    'en-US': 'America/New_York', // Fuso horário americano
    'fr-FR': 'Europe/Paris', // Fuso horário francês
  },
};
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Ambiente
NODE_ENV=development
PORT=3000

# Base de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/adms
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=adms
DATABASE_USER=adms_user
DATABASE_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# ElasticSearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h

# Armazenamento
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./storage

# APIs Externas
OPENAI_API_KEY=your-openai-api-key-here

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Segurança
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Compose

O projeto inclui configurações Docker para desenvolvimento e produção:

**Desenvolvimento (`docker-compose.dev.yml`):**

- Hot reload habilitado
- Volumes para desenvolvimento
- Portas expostas para debugging

**Produção (`docker-compose.prod.yml`):**

- Imagens otimizadas
- Configurações de segurança
- Health checks
- Restart policies

## 🧪 Testes

O projeto inclui testes abrangentes para todos os componentes:

```bash
# Executar todos os testes
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch

# Executar testes de integração
npm run test:integration

# Executar testes E2E
npm run test:e2e
```

### Estrutura de Testes

- **Unit Tests**: Testes unitários para funções e classes individuais
- **Integration Tests**: Testes de integração entre serviços
- **E2E Tests**: Testes end-to-end da interface do utilizador
- **Performance Tests**: Testes de carga e performance
- **Security Tests**: Testes de segurança e vulnerabilidades

## 🚀 Deployment

### Desenvolvimento Local

```bash
# Usando Docker Compose
npm run docker:dev

# Ou manualmente
npm run dev
```

### Produção

```bash
# Build das imagens
npm run build

# Deploy com Docker Compose
npm run docker:prod

# Ou usando Kubernetes
kubectl apply -f k8s/
```

### CI/CD

O projeto inclui configurações para GitHub Actions:

- Build automático em push
- Execução de testes
- Deploy automático para staging/produção
- Verificações de segurança
- Análise de código

## 📈 Roadmap

### Fase 1 - Fundação (Q1 2024)

- [x] Estrutura do monorepo
- [x] Configuração Docker
- [x] Biblioteca compartilhada
- [ ] Serviços básicos (Auth, Document)
- [ ] Interface básica

### Fase 2 - Funcionalidades Core (Q2 2024)

- [ ] Sistema de permissões
- [ ] Versionamento de documentos
- [ ] Colaboração básica
- [ ] OCR multilíngue

### Fase 3 - IA e Automação (Q3 2024)

- [ ] Integração OpenAI
- [ ] Classificação automática
- [ ] Workflows avançados
- [ ] Analytics e relatórios

### Fase 4 - Enterprise (Q4 2024)

- [ ] Integrações Microsoft/Google
- [ ] Segurança avançada
- [ ] PWA offline
- [ ] Escalabilidade

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia o
[CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e
processo de submissão de pull requests.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo
[LICENSE](LICENSE) para detalhes.

## 👥 Equipa

- **Arquiteto Principal** - [@your-username](https://github.com/your-username)
- **Desenvolvedor Backend** - [@backend-dev](https://github.com/backend-dev)
- **Desenvolvedor Frontend** - [@frontend-dev](https://github.com/frontend-dev)
- **Especialista IA** - [@ai-specialist](https://github.com/ai-specialist)

## 📞 Suporte

Para suporte, envie um email para support@adms.ao ou crie uma issue no GitHub.

## 🙏 Agradecimentos

- [OpenAI](https://openai.com/) pela API GPT-4
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) pelo OCR open
  source
- [spaCy](https://spacy.io/) pelos modelos de NLP
- Comunidade open source por todas as bibliotecas utilizadas

---

**Desenvolvido com ❤️ em Angola para o mundo** 🇦🇴

# Docker Configuration - Advanced Document Management System

Este diretório contém todas as configurações Docker para o Sistema de Gestão
Documental Avançado.

## 📁 Estrutura

```
docker/
├── postgres/
│   └── init/
│       └── 01-init-database.sql    # Script de inicialização do PostgreSQL
├── redis/
│   └── redis.conf                  # Configuração do Redis
└── scripts/
    ├── dev-setup.sh               # Script de setup (Linux/Mac)
    ├── dev-setup.ps1              # Script de setup (Windows)
    ├── health-check.sh            # Health check (Linux/Mac)
    └── health-check.ps1           # Health check (Windows)
```

## 🚀 Início Rápido

### Windows (PowerShell)

```powershell
# Setup completo do ambiente
npm run docker:setup

# Ou manualmente
.\docker\scripts\dev-setup.ps1
```

### Linux/Mac (Bash)

```bash
# Setup completo do ambiente
./docker/scripts/dev-setup.sh

# Ou manualmente
npm run docker:dev
```

## 🐳 Serviços Docker

### PostgreSQL

- **Porta:** 5432
- **Usuário:** adms_user
- **Senha:** adms_password
- **Database:** adms_dev
- **Volume:** postgres_data

### Redis

- **Porta:** 6379
- **Senha:** redis_password
- **Volume:** redis_data
- **Configuração:** docker/redis/redis.conf

### ElasticSearch

- **Porta:** 9200, 9300
- **Cluster:** adms-cluster
- **Volume:** elasticsearch_data
- **Memória:** 512MB

### MinIO (S3-compatible)

- **API:** http://localhost:9000
- **Console:** http://localhost:9001
- **Usuário:** minioadmin
- **Senha:** minioadmin123
- **Buckets:** adms-documents, adms-backups

### Kibana (Opcional)

- **Porta:** 5601
- **URL:** http://localhost:5601
- **Profile:** monitoring

## 📋 Scripts Disponíveis

### Package.json Scripts

```bash
npm run docker:dev          # Iniciar ambiente de desenvolvimento
npm run docker:dev:build    # Iniciar com rebuild das imagens
npm run docker:dev:logs     # Ver logs dos containers
npm run docker:down         # Parar todos os containers
npm run docker:clean        # Limpar containers e volumes
npm run docker:setup        # Setup completo (Windows)
npm run docker:health       # Health check (Windows)
```

### Scripts Diretos

**Windows:**

```powershell
# Setup do ambiente
.\docker\scripts\dev-setup.ps1

# Health check
.\docker\scripts\health-check.ps1

# Health check de serviço específico
.\docker\scripts\health-check.ps1 postgres
.\docker\scripts\health-check.ps1 redis
.\docker\scripts\health-check.ps1 elasticsearch
.\docker\scripts\health-check.ps1 minio
```

**Linux/Mac:**

```bash
# Setup do ambiente
./docker/scripts/dev-setup.sh

# Health check
./docker/scripts/health-check.sh

# Health check de serviço específico
./docker/scripts/health-check.sh postgres
./docker/scripts/health-check.sh redis
./docker/scripts/health-check.sh elasticsearch
./docker/scripts/health-check.sh minio
```

## 🔧 Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste as configurações:

```bash
cp .env.example .env
```

### Volumes Persistentes

Os dados são armazenados em volumes Docker nomeados:

- `adms-postgres-data` - Dados do PostgreSQL
- `adms-redis-data` - Dados do Redis
- `adms-elasticsearch-data` - Dados do ElasticSearch
- `adms-minio-data` - Dados do MinIO

### Storage Local

Diretórios locais para desenvolvimento:

- `storage/documents/` - Documentos locais
- `storage/backups/` - Backups locais
- `storage/uploads/` - Uploads temporários

## 🔍 Monitorização

### Health Checks

Todos os serviços têm health checks configurados:

- **PostgreSQL:** `pg_isready`
- **Redis:** `redis-cli ping`
- **ElasticSearch:** `/_cluster/health`
- **MinIO:** `/minio/health/live`

### Logs

```bash
# Ver logs de todos os serviços
npm run docker:dev:logs

# Ver logs de um serviço específico
docker logs adms-postgres-dev
docker logs adms-redis-dev
docker logs adms-elasticsearch-dev
docker logs adms-minio-dev
```

### Status dos Containers

```bash
# Ver status de todos os containers
docker ps

# Ver apenas containers do ADMS
docker ps --filter "name=adms-"
```

## 🛠️ Troubleshooting

### Problemas Comuns

**1. Porta já em uso:**

```bash
# Verificar que processo está usando a porta
netstat -ano | findstr :5432
netstat -ano | findstr :6379
netstat -ano | findstr :9200
```

**2. Volumes com permissões incorretas:**

```bash
# Remover volumes e recriar
docker compose -f docker-compose.dev.yml down -v
docker volume prune
npm run docker:dev
```

**3. ElasticSearch não inicia (pouca memória):**

```bash
# No Windows, aumentar memória do Docker Desktop
# Settings > Resources > Memory > 4GB+
```

**4. Containers não param:**

```bash
# Forçar parada
docker compose -f docker-compose.dev.yml kill
docker compose -f docker-compose.dev.yml down -v
```

### Limpeza Completa

```bash
# Parar tudo e limpar
npm run docker:clean

# Limpeza mais agressiva (cuidado!)
docker system prune -a --volumes
```

## 🔒 Segurança

### Desenvolvimento vs Produção

- **Desenvolvimento:** Senhas simples, portas expostas
- **Produção:** Usar secrets, redes internas, TLS

### Credenciais Padrão (APENAS DESENVOLVIMENTO)

- PostgreSQL: `adms_user` / `adms_password`
- Redis: `redis_password`
- MinIO: `minioadmin` / `minioadmin123`

**⚠️ IMPORTANTE:** Altere todas as senhas em produção!

## 📚 Recursos Adicionais

### URLs Úteis

- **PostgreSQL Admin:** Use pgAdmin ou DBeaver
- **Redis Admin:** http://localhost:8001 (RedisInsight)
- **ElasticSearch:** http://localhost:9200
- **Kibana:** http://localhost:5601
- **MinIO Console:** http://localhost:9001

### Comandos Docker Úteis

```bash
# Entrar no container PostgreSQL
docker exec -it adms-postgres-dev psql -U adms_user -d adms_dev

# Entrar no container Redis
docker exec -it adms-redis-dev redis-cli -a redis_password

# Ver configuração do ElasticSearch
docker exec adms-elasticsearch-dev curl http://localhost:9200/_cluster/settings

# Listar buckets do MinIO
docker exec adms-minio-dev mc ls minio/
```

## 🤝 Contribuição

Para adicionar novos serviços ao Docker Compose:

1. Adicione o serviço ao `docker-compose.dev.yml`
2. Configure health checks apropriados
3. Adicione verificações aos scripts de health check
4. Documente as configurações aqui
5. Teste o setup completo

---

**Desenvolvido com ❤️ para o Advanced Document Management System** 🇦🇴

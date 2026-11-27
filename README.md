# Docker — руководство и шпаргалка

Практическое руководство по Docker: основные понятия, работа с образами и контейнерами, написание `Dockerfile`, `.dockerignore`, `docker-compose.yml`, работа с volumes, сетями, переменными окружения и отладка.

В качестве практического примера используется проект:

- **Backend:** NestJS + Sequelize
- **Database:** PostgreSQL
- **Frontend:** React + Vite
- **Web Server:** Nginx
- **Orchestration:** Docker Compose

Цель документа — не просто запустить проект в Docker, а понимать, что происходит внутри, зачем нужны конкретные настройки и как самостоятельно создавать Docker-окружение для других проектов.

---

# 1. Что такое Docker

**Docker** — платформа для упаковки, распространения и запуска приложений в изолированных окружениях, которые называются контейнерами.

Обычная проблема разработки:

1. На компьютере разработчика установлена одна версия Node.js.
2. На сервере установлена другая версия.
3. У одного разработчика PostgreSQL работает на порту 5432, у другого — нет.
4. Приложение зависит от определённых библиотек и системных настроек.
5. При переносе проекта на другой компьютер возникают ошибки.

Docker решает эту проблему: приложение запускается в заранее подготовленном окружении.

Например, вместо того чтобы вручную устанавливать PostgreSQL, Node.js и Nginx на каждом компьютере, можно описать их конфигурацию и запускать через Docker.

## 1.1. Основные понятия

| Понятие | Что означает |
|---|---|
| Docker Engine | Движок, который создаёт и запускает контейнеры |
| Dockerfile | Инструкция по созданию Docker-образа |
| Image (образ) | Шаблон, из которого создаются контейнеры |
| Container (контейнер) | Запущенный экземпляр образа |
| Volume | Хранилище данных, сохраняющееся независимо от контейнера |
| Network | Сеть, через которую контейнеры взаимодействуют друг с другом |
| Docker Compose | Инструмент для управления несколькими контейнерами |
| Registry | Хранилище Docker-образов, например Docker Hub |
| Build context | Файлы, доступные Docker при сборке образа |

## 1.2. Как Docker работает

Упрощённая схема:

```text
Dockerfile
    |
    v
docker build
    |
    v
Docker Image
    |
    v
docker run
    |
    v
Docker Container
```

Разберём:

1. Создаём `Dockerfile` с инструкциями.
2. Выполняем `docker build`.
3. Docker собирает образ.
4. Из образа создаётся контейнер.
5. Контейнер запускает приложение.

**Важно различать образ и контейнер.**

Образ — это шаблон приложения. Контейнер — конкретный экземпляр этого шаблона, который может работать, останавливаться и удаляться.

Из одного образа можно создать несколько контейнеров.

## 1.3. Docker и виртуальные машины

Docker использует механизмы изоляции операционной системы и не требует отдельной полноценной гостевой ОС для каждого контейнера.

Виртуальная машина обычно содержит собственную гостевую ОС.

```text
Виртуальные машины:

Компьютер
  |
  +-- Гипервизор
        |
        +-- VM 1 (ОС + приложение)
        +-- VM 2 (ОС + приложение)


Docker:

Компьютер
  |
  +-- Docker Engine
        |
        +-- Container 1 (приложение)
        +-- Container 2 (приложение)
        +-- Container 3 (приложение)
```

Контейнеры обычно легче виртуальных машин, быстрее создаются и удобны для разработки и развёртывания приложений.

---

# 2. Установка и проверка Docker

Для Windows удобно использовать Docker Desktop с WSL 2.

Официальный сайт:

https://www.docker.com/products/docker-desktop/

После установки открой Docker Desktop и дождись запуска Docker Engine.

Проверка установки:

```powershell
# Версия Docker
docker --version

# Версия Docker Compose
docker compose version

# Информация о Docker Engine
docker info

# Проверка запуска тестового контейнера
docker run hello-world
```

Если `hello-world` успешно запускается, Docker работает.

## 2.1. Docker CLI

Docker CLI — интерфейс командной строки, через который мы управляем Docker.

Например:

```powershell
docker ps
docker images
docker run nginx
docker stop container_name
```

Docker Desktop предоставляет графический интерфейс, но основные рабочие команды удобнее запоминать именно через терминал.

---

# 3. Работа с Docker-образами (Images)

Образ — основа контейнера.

Можно использовать готовые образы из Docker Hub или создавать собственные.

Docker Hub:

https://hub.docker.com/

Например, готовые образы:

- `node:24-alpine` — Node.js на Alpine Linux.
- `postgres:16-alpine` — PostgreSQL.
- `nginx:alpine` — Nginx.
- `redis:alpine` — Redis.

## 3.1. Основные команды

```powershell
# Скачать образ
docker pull nginx:alpine

# Посмотреть скачанные образы
docker images

# Более подробный список
docker image ls

# Посмотреть информацию об образе
docker image inspect nginx:alpine

# Удалить образ
docker rmi nginx:alpine

# Удалить неиспользуемые образы
docker image prune

# Удалить все неиспользуемые образы
docker image prune -a
```

Обрати внимание:

`nginx` — имя образа.

`alpine` — тег, обозначающий конкретный вариант образа.

Тег позволяет использовать определённую версию или разновидность образа.

Например:

```text
node:24-alpine
node:22-alpine
node:20-alpine
postgres:16-alpine
nginx:alpine
```

Для воспроизводимых сборок желательно указывать конкретную версию, а не использовать `latest`.

---

# 4. Работа с контейнерами

Контейнер — запущенный экземпляр Docker-образа.

## 4.1. Создание и запуск контейнера

```powershell
# Запустить Nginx
docker run nginx

# Запустить в фоновом режиме
docker run -d nginx

# Запустить с именем
docker run -d --name my-nginx nginx

# Запустить с пробросом портов
docker run -d --name my-nginx -p 8080:80 nginx
```

Последняя команда означает:

```text
-p HOST_PORT:CONTAINER_PORT
```

В нашем примере:

- `8080` — порт компьютера.
- `80` — порт внутри контейнера.

Теперь Nginx доступен по адресу:

http://localhost:8080

## 4.2. Основные команды управления

```powershell
# Посмотреть работающие контейнеры
docker ps

# Посмотреть все контейнеры, включая остановленные
docker ps -a

# Остановить контейнер
docker stop my-nginx

# Запустить остановленный контейнер
docker start my-nginx

# Перезапустить контейнер
docker restart my-nginx

# Удалить остановленный контейнер
docker rm my-nginx

# Остановить и удалить контейнер
docker rm -f my-nginx
```

## 4.3. Просмотр логов

```powershell
# Посмотреть логи
docker logs my-nginx

# Следить за логами в реальном времени
docker logs -f my-nginx

# Последние 100 строк
docker logs --tail=100 my-nginx

# Последние строки с временными метками
docker logs -t --tail=50 my-nginx
```

Логи особенно полезны, если приложение не запускается или завершается с ошибкой.

## 4.4. Подключение к контейнеру

Иногда нужно попасть внутрь контейнера и выполнить команды.

```powershell
# Открыть терминал внутри контейнера
docker exec -it my-nginx sh
```

Пояснение:

- `exec` — выполнить команду внутри работающего контейнера.
- `-i` — оставить ввод открытым.
- `-t` — выделить терминал.
- `sh` — запустить командную оболочку.

Если внутри образа установлен Bash:

```powershell
docker exec -it my-nginx bash
```

В Alpine-образах обычно используется `sh`, а не `bash`.

Выйти из контейнера:

```bash
exit
```

Посмотреть процессы внутри контейнера:

```powershell
docker top my-nginx
```

Посмотреть использование ресурсов:

```powershell
docker stats
```

---

# 5. Dockerfile — создание собственного образа

`Dockerfile` — текстовый файл с инструкциями, по которым Docker собирает образ.

Например, если у нас есть NestJS-приложение, мы можем описать:

1. Какой базовый образ использовать.
2. В какую директорию поместить проект.
3. Какие файлы скопировать.
4. Как установить зависимости.
5. Как собрать приложение.
6. Какую команду выполнить при запуске контейнера.

## 5.1. Основные инструкции Dockerfile

| Инструкция | Назначение |
|---|---|
| `FROM` | Выбирает базовый образ |
| `WORKDIR` | Устанавливает рабочую директорию |
| `COPY` | Копирует файлы в образ |
| `ADD` | Копирует файлы с дополнительными возможностями |
| `RUN` | Выполняет команду во время сборки |
| `ENV` | Устанавливает переменную окружения |
| `ARG` | Создаёт переменную для этапа сборки |
| `EXPOSE` | Документирует порт приложения |
| `CMD` | Задаёт команду запуска по умолчанию |
| `ENTRYPOINT` | Задаёт основную исполняемую команду |
| `USER` | Выбирает пользователя |
| `VOLUME` | Объявляет точку монтирования |
| `HEALTHCHECK` | Настраивает проверку состояния контейнера |

## 5.2. Простой Dockerfile для Node.js

Допустим, у нас есть обычное Node.js-приложение:

```text
project/
├── package.json
├── package-lock.json
├── index.js
└── Dockerfile
```

Пример `index.js`:

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
    res.end('Hello from Docker!');
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Server started on port 3000');
});
```

Dockerfile:

```dockerfile
# Выбираем базовый образ Node.js
FROM node:24-alpine

# Рабочая директория внутри контейнера
WORKDIR /app

# Сначала копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальной код
COPY . .

# Документируем используемый порт
EXPOSE 3000

# Команда запуска приложения
CMD ["node", "index.js"]
```

## 5.3. Разбор Dockerfile

**FROM**

```dockerfile
FROM node:24-alpine
```

Выбирает базовый образ, на котором будет строиться наш образ.

В данном случае это Node.js версии 24 на Alpine Linux.

**WORKDIR**

```dockerfile
WORKDIR /app
```

Создаёт рабочую директорию `/app` и делает её текущей.

Все последующие относительные пути будут рассчитываться от неё.

**COPY**

```dockerfile
COPY package*.json ./
```

Копирует `package.json` и `package-lock.json` из build context в рабочую директорию контейнера.

**RUN**

```dockerfile
RUN npm ci
```

Выполняет команду во время сборки образа.

`npm ci` устанавливает зависимости строго по lock-файлу.

Для воспроизводимых сборок предпочтительнее использовать его, если в проекте есть актуальный `package-lock.json`.

**EXPOSE**

```dockerfile
EXPOSE 3000
```

Документирует порт, который использует приложение.

Важно: `EXPOSE` сам по себе не открывает порт на компьютере.

Для доступа с хоста нужен `-p` при `docker run` или `ports` в Compose.

**CMD**

```dockerfile
CMD ["node", "index.js"]
```

Определяет команду, которая выполняется при запуске контейнера.

Формат JSON-массива называется exec form.

## 5.4. Сборка собственного образа

Выполняем из директории, где находится Dockerfile:

```powershell
# Собрать образ
docker build -t my-node-app .

# Посмотреть созданный образ
docker images

# Запустить контейнер
docker run -d --name my-node-container -p 3000:3000 my-node-app

# Посмотреть логи
docker logs my-node-container
```

Разберём команду:

```powershell
docker build -t my-node-app .
```

- `docker build` — собрать образ.
- `-t` — задать имя и тег образа.
- `my-node-app` — имя образа.
- `.` — текущая директория, которая используется как build context.

Точка в конце обязательна для указания текущей директории в данном примере.

---

# 6. Multi-stage builds

Multi-stage build — способ создавать образы с несколькими стадиями сборки.

Например, для NestJS нам нужны все зависимости и TypeScript-компилятор, чтобы собрать проект.

Но для запуска готового приложения компилятор и dev-зависимости обычно не нужны.

Поэтому можно разделить сборку на две стадии:

```text
Stage 1: builder
    |
    | Установка всех зависимостей
    | Компиляция TypeScript
    | Получение dist/
    |
    v
Stage 2: runner
    |
    | Установка production-зависимостей
    | Копирование dist/
    | Запуск приложения
    |
    v
Готовый образ
```

Пример Dockerfile для NestJS:

```dockerfile
# -------------------------
# Stage 1: Builder
# -------------------------

FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# -------------------------
# Stage 2: Runner
# -------------------------

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

Здесь:

- `AS builder` — присваивает имя первой стадии.
- `AS runner` — создаёт вторую стадию.
- `COPY --from=builder` — копирует файлы из предыдущей стадии.
- `npm ci --omit=dev` — устанавливает только production-зависимости.

Итоговый образ не содержит исходники TypeScript, dev-зависимости и инструменты сборки.

Это уменьшает размер образа и количество ненужных компонентов.

**Когда использовать Multi-stage:**

- NestJS и другие TypeScript-приложения.
- React + Vite.
- Next.js (в зависимости от выбранной стратегии сборки).
- Приложения, которым для сборки нужны дополнительные инструменты.

---

# 7. .dockerignore — исключение файлов

`.dockerignore` — файл, который определяет, какие файлы и директории не нужно передавать в build context.

Он похож на `.gitignore`, но работает при сборке Docker-образа.

Например, нам не нужно копировать локальный `node_modules` в контейнер, потому что зависимости должны устанавливаться внутри Docker.

Пример `.dockerignore` для Node.js:

```dockerignore
node_modules
dist
coverage

.git
.gitignore

.env
.env.*
!.env.example

npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

Dockerfile*
docker-compose*
.dockerignore

.vscode
.idea

*.log
.DS_Store
```

## 7.1. Зачем нужен .dockerignore

Предположим, у нас есть:

```text
project/
├── node_modules/       # 500 MB
├── src/
├── dist/
├── .git/
├── package.json
└── Dockerfile
```

Если не использовать `.dockerignore`, Docker может передавать лишние файлы в контекст сборки.

Это приводит к:

- Увеличению времени сборки.
- Увеличению объёма передаваемых данных.
- Проблемам с кэшированием.
- Попаданию локальных файлов в образ.
- Риску случайно включить секреты.

## 7.2. Важный момент

`.dockerignore` действует на build context, а не просто на весь компьютер.

Если в Dockerfile указано:

```dockerfile
COPY . .
```

Docker копирует содержимое контекста сборки с учётом `.dockerignore`.

Поэтому важно понимать, откуда именно выполняется `docker build` и какую директорию ты передаёшь в качестве контекста.

---

# 8. Docker Compose

Docker Compose — инструмент для описания и управления несколькими связанными контейнерами.

Без Compose нам пришлось бы запускать каждый сервис отдельно:

```powershell
docker run -d --name database postgres:16-alpine

docker run -d --name backend -p 3001:3001 my-api

docker run -d --name frontend -p 5173:80 my-web
```

Также пришлось бы вручную настраивать сети, переменные окружения, volumes и другие параметры.

Compose позволяет описать всё это в одном YAML-файле.

Обычно используется файл:

```text
docker-compose.yml
```

Современная команда:

```powershell
docker compose
```

Важно: сейчас не нужно указывать устаревшую отдельную команду `docker-compose`, если у тебя установлен актуальный Docker Compose Plugin.

## 8.1. Основные понятия Compose

| Параметр | Назначение |
|---|---|
| `services` | Описывает контейнеры приложения |
| `image` | Использует готовый образ |
| `build` | Собирает образ из Dockerfile |
| `container_name` | Задаёт имя контейнера |
| `ports` | Пробрасывает порты |
| `environment` | Передаёт переменные окружения |
| `env_file` | Загружает переменные из файла |
| `volumes` | Подключает хранилища или директории |
| `networks` | Настраивает сети |
| `depends_on` | Определяет порядок запуска и зависимости |
| `restart` | Настраивает автоматический перезапуск |
| `healthcheck` | Проверяет состояние сервиса |

## 8.2. Простейший docker-compose.yml

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
```

Запуск:

```powershell
docker compose up -d
```

Открываем:

http://localhost:8080

Остановка:

```powershell
docker compose down
```

Compose автоматически создаёт сеть проекта и запускает описанный сервис.

---

# 9. Порты и сети Docker

## 9.1. Проброс портов

Контейнеры имеют собственные сетевые интерфейсы.

Чтобы обращаться к приложению из браузера на компьютере, обычно нужно пробросить порт.

Формат:

```yaml
ports:
  - "HOST_PORT:CONTAINER_PORT"
```

Например:

```yaml
ports:
  - "3001:3001"
```

Это означает:

```text
Компьютер:3001
       |
       v
Контейнер:3001
       |
       v
NestJS
```

Если PostgreSQL работает внутри Docker на порту 5432, а на компьютере этот порт уже занят, можно использовать:

```yaml
ports:
  - "5433:5432"
```

Тогда:

- Из компьютера подключаемся к `localhost:5433`.
- Из другого контейнера подключаемся к `db:5432`.

Это важное различие.

## 9.2. Docker Network

Compose по умолчанию создаёт общую сеть для сервисов проекта.

Допустим, есть:

```yaml
services:
  db:
    image: postgres:16-alpine

  api:
    image: my-api
```

Контейнер `api` может обращаться к базе по адресу:

```text
db:5432
```

Почему?

Потому что `db` — имя сервиса, которое Docker DNS разрешает внутри сети.

Не нужно использовать `localhost` для обращения к другому контейнеру.

**Правильно внутри API-контейнера:**

```env
DB_HOST=db
DB_PORT=5432
```

**Неправильно:**

```env
DB_HOST=localhost
DB_PORT=5433
```

`localhost` внутри контейнера указывает на сам контейнер, а не на компьютер или соседний контейнер.

## 9.3. Ручное создание сети

```powershell
# Создать сеть
docker network create app-network

# Посмотреть сети
docker network ls

# Посмотреть информацию о сети
docker network inspect app-network

# Удалить сеть
docker network rm app-network
```

Запустить контейнер в определённой сети:

```powershell
docker run -d --name database --network app-network postgres:16-alpine
```

---

# 10. Volumes — хранение данных

Контейнеры могут быть удалены и созданы заново.

Если данные хранятся только внутри файловой системы контейнера, при его удалении они могут потеряться.

Для хранения данных используются volumes.

Особенно важно это для баз данных.

## 10.1. Типы хранения

**Named volume**

Управляемое Docker хранилище:

```yaml
volumes:
  - pg_data:/var/lib/postgresql/data
```

**Bind mount**

Подключение конкретной директории компьютера:

```yaml
volumes:
  - ./server:/app
```

**Anonymous volume**

Том без явно заданного имени:

```yaml
volumes:
  - /app/node_modules
```

## 10.2. Создание и просмотр volumes

```powershell
# Создать volume
docker volume create pg_data

# Список volumes
docker volume ls

# Информация о volume
docker volume inspect pg_data

# Удалить volume
docker volume rm pg_data

# Удалить неиспользуемые volumes
docker volume prune
```

**Внимание:** удаление volume может привести к безвозвратной потере данных базы.

## 10.3. Bind mount для разработки

Например:

```yaml
services:
  api:
    build: ./server
    volumes:
      - ./server:/app
      - /app/node_modules
```

Первый mount синхронизирует код с компьютера в контейнер.

Второй сохраняет отдельную директорию `node_modules` внутри Docker, чтобы локальная папка с зависимостями не перезаписывала контейнерную.

Такой подход удобен для разработки с hot reload.

Для production обычно не монтируют исходный код с компьютера в контейнер.

---

# 11. Переменные окружения (.env)

Переменные окружения позволяют передавать настройки приложению без жёсткого прописывания их в исходниках.

Например:

```env
DB_HOST=db
DB_PORT=5432
DB_DATABASE=app_db
DB_USERNAME=postgres
DB_PASSWORD=secret
```

В Compose можно использовать:

```yaml
services:
  api:
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
```

Или:

```yaml
services:
  api:
    env_file:
      - .env.docker
```

## 11.1. Разница между env_file и --env-file

Это важный момент.

**env_file в docker-compose.yml**

```yaml
services:
  api:
    env_file:
      - .env.docker
```

Передаёт переменные непосредственно внутрь контейнера.

**--env-file в командной строке**

```powershell
docker compose --env-file .env.docker up -d
```

Использует файл для подстановки переменных в сам Compose YAML.

Например:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

В этом случае Compose подставляет значения из `.env.docker`.

Эти механизмы можно использовать одновременно.

## 11.2. Безопасность

Не нужно хранить реальные пароли, API-ключи и токены в Git.

Добавь в `.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

Если используешь `.env.docker`, добавь его в исключения.

Для production-среды лучше использовать секреты и механизмы управления конфиденциальными данными, предусмотренные платформой развёртывания.

---

# 12. Практический проект: NestJS + PostgreSQL + React

Теперь соберём всё вместе.

## 12.1. Структура проекта

```text
project/
│
├── docker/
│   ├── docker-compose.yml
│   ├── .env.docker
│   │
│   ├── server/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   │
│   └── client/
│       ├── Dockerfile
│       └── .dockerignore
│
├── server/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
└── client/
    ├── src/
    ├── package.json
    └── package-lock.json
```

Здесь `docker/` содержит инфраструктурные файлы.

Backend и frontend остаются самостоятельными проектами.

## 12.2. Backend Dockerfile

Файл `docker/server/Dockerfile`:

```dockerfile
# Stage 1: сборка
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# Stage 2: запуск
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

Backend `.dockerignore`:

```dockerignore
node_modules
dist
coverage
.git
.env
.env.*
!.env.example
*.log
```

Важно: этот пример предполагает, что NestJS собирается в `dist/main.js`, а production-зависимости достаточны для запуска приложения.

## 12.3. Frontend Dockerfile

Файл `docker/client/Dockerfile`:

```dockerfile
# Stage 1: сборка React + Vite
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# Stage 2: Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Frontend `.dockerignore`:

```dockerignore
node_modules
dist
coverage
.git
.env.local
.env.*.local
*.log
```

Nginx используется для раздачи готовой статической сборки React.

Если в React используется клиентская маршрутизация, например React Router, дополнительно потребуется настроить Nginx с fallback на `index.html`.

## 12.4. Файл переменных окружения

Файл `docker/.env.docker`:

```env
# PostgreSQL
DB_DATABASE=app_db
DB_USERNAME=postgres
DB_PASSWORD=change_me

# Backend
PORT=3001
NODE_ENV=production
DB_HOST=db
DB_PORT=5432
```

Это пример для локальной демонстрации. Для реального проекта используй собственные надёжные секреты.

## 12.5. Docker Compose

Файл `docker/docker-compose.yml`:

```yaml
services:

  # -------------------------
  # PostgreSQL
  # -------------------------
  db:
    image: postgres:16-alpine
    container_name: project-db

    restart: unless-stopped

    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

    ports:
      - "5433:5432"

    volumes:
      - pg_data:/var/lib/postgresql/data

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME} -d ${DB_DATABASE}"]
      interval: 10s
      timeout: 5s
      retries: 5


  # -------------------------
  # NestJS API
  # -------------------------
  api:
    build:
      context: ../server
      dockerfile: ../docker/server/Dockerfile

    container_name: project-api

    restart: unless-stopped

    env_file:
      - .env.docker

    environment:
      DB_HOST: db
      DB_PORT: 5432

    ports:
      - "3001:3001"

    depends_on:
      db:
        condition: service_healthy


  # -------------------------
  # React + Nginx
  # -------------------------
  web:
    build:
      context: ../client
      dockerfile: ../docker/client/Dockerfile

    container_name: project-web

    restart: unless-stopped

    ports:
      - "5173:80"

    depends_on:
      - api


# -------------------------
# Volumes
# -------------------------
volumes:
  pg_data:
```

Обрати внимание: здесь `build.context` указывает на корневую директорию соответствующего приложения, а `dockerfile` задаёт путь к Dockerfile относительно build context. Для Dockerfile, лежащего вне build context, такая конфигурация некорректна.

Для данной структуры нужно использовать Dockerfile внутри контекста приложения либо перенести Dockerfile в соответствующую директорию. Например, более простой и надёжный вариант:

```yaml
api:
  build:
    context: ../server
    dockerfile: Dockerfile
```

И аналогично для frontend:

```yaml
web:
  build:
    context: ../client
    dockerfile: Dockerfile
```

В таком случае Dockerfile должны находиться в `server/Dockerfile` и `client/Dockerfile`. Если хочешь хранить их в `docker/server/` и `docker/client/`, нужно изменить build context так, чтобы Dockerfile и необходимые файлы были доступны при сборке.

**Важное замечание по frontend:** переменные `VITE_*` подставляются во время сборки Vite, а не автоматически при запуске Nginx. Если меняешь адрес API, frontend нужно пересобрать или отдельно реализовать runtime-конфигурацию.

Также проверь, что API слушает `0.0.0.0`, а не только `localhost`, и что CORS разрешает адрес frontend.

---

# 13. Основные команды Docker Compose

Команды выполняются из директории, где расположен `docker-compose.yml`.

В нашем случае — `docker/`.

## 13.1. Запуск проекта

```powershell
# Собрать образы и запустить все сервисы
docker compose --env-file .env.docker up -d --build

# Запустить без пересборки
docker compose --env-file .env.docker up -d

# Запустить конкретный сервис
docker compose --env-file .env.docker up -d api
```

Параметры:

- `up` — создать и запустить сервисы.
- `-d` — запустить в фоновом режиме.
- `--build` — пересобрать образы перед запуском.

## 13.2. Проверка состояния

```powershell
# Состояние сервисов
docker compose --env-file .env.docker ps

# Список всех контейнеров
docker ps -a

# Список образов
docker images

# Использование ресурсов
docker stats
```

## 13.3. Логи

```powershell
# Логи всех сервисов
docker compose --env-file .env.docker logs

# Следить за логами
docker compose --env-file .env.docker logs -f

# Логи API
docker compose --env-file .env.docker logs -f api

# Последние 50 строк API
docker compose --env-file .env.docker logs --tail=50 api

# Логи базы данных
docker compose --env-file .env.docker logs -f db
```

## 13.4. Остановка

```powershell
# Остановить и удалить контейнеры и сеть проекта
docker compose --env-file .env.docker down

# Остановить сервисы, не удаляя контейнеры
docker compose --env-file .env.docker stop

# Запустить остановленные сервисы
docker compose --env-file .env.docker start

# Перезапустить сервисы
docker compose --env-file .env.docker restart
```

## 13.5. Пересборка

```powershell
# Пересобрать все образы
docker compose --env-file .env.docker build

# Пересобрать только API
docker compose --env-file .env.docker build api

# Пересобрать API без использования кэша
docker compose --env-file .env.docker build --no-cache api

# Пересобрать и запустить API
docker compose --env-file .env.docker up -d --build api
```

## 13.6. Полный сброс

```powershell
# Удалить контейнеры и сеть
docker compose --env-file .env.docker down

# Удалить контейнеры, сеть и volumes
docker compose --env-file .env.docker down -v
```

**Осторожно:** `down -v` удаляет именованные volumes проекта, в том числе `pg_data`. Данные PostgreSQL будут потеряны.

---

# 14. Полезные команды для диагностики

```powershell
# Информация о контейнере
docker inspect project-api

# Информация об образе
docker image inspect my-api

# Список сетей
docker network ls

# Список volumes
docker volume ls

# Использование диска Docker
docker system df

# Очистить неиспользуемые ресурсы
docker system prune

# Очистить неиспользуемые образы, контейнеры и сети
docker system prune -a

# Проверить конфигурацию Compose
docker compose --env-file .env.docker config

# Посмотреть итоговую конфигурацию с подставленными переменными
docker compose --env-file .env.docker config
```

Не запускай команды очистки без понимания последствий.

`docker system prune -a` удаляет неиспользуемые образы, поэтому в следующий раз некоторые образы придётся скачивать или собирать заново.

---

# 15. Типичные ошибки и способы решения

## 15.1. Port is already allocated

Ошибка:

```text
Bind for 0.0.0.0:5433 failed:
port is already allocated
```

Причина: порт уже занят другим процессом или контейнером.

Проверяем контейнеры:

```powershell
docker ps
```

Останавливаем ненужный контейнер:

```powershell
docker stop container_name
```

Либо меняем внешний порт:

```yaml
ports:
  - "5434:5432"
```

## 15.2. ENOTFOUND db

Ошибка:

```text
SequelizeHostNotFoundError:
getaddrinfo ENOTFOUND db
```

Причина: API не может найти сервис `db` в Docker-сети.

Проверяем:

```env
DB_HOST=db
DB_PORT=5432
```

Проверяем сеть:

```powershell
docker network ls
docker inspect project-api
```

Убеждаемся, что сервисы подключены к общей сети Compose.

## 15.3. Connection refused

Ошибка:

```text
ECONNREFUSED
```

Возможные причины:

- База данных ещё не запустилась.
- Приложение слушает неправильный порт.
- Неправильно настроен адрес подключения.
- Сервис завершился с ошибкой.

Проверяем:

```powershell
docker compose ps

docker compose logs db

docker compose logs api
```

Для PostgreSQL полезен `healthcheck` и `depends_on` с `condition: service_healthy`.

## 15.4. Изменения кода не отображаются

Если используется production Dockerfile, исходный код копируется в образ при сборке.

После изменения кода необходимо пересобрать образ:

```powershell
docker compose up -d --build api
```

Для frontend:

```powershell
docker compose up -d --build web
```

## 15.5. Ошибка при установке зависимостей

Проверь:

- Существует ли `package-lock.json`.
- Совпадает ли он с `package.json`.
- Правильно ли настроен `.dockerignore`.
- Доступен ли npm registry.
- Подходит ли версия Node.js.

Если используешь `npm ci`, lock-файл обязателен.

## 15.6. Frontend не может обратиться к API

Проверь адрес API, зашитый в Vite.

Например:

```env
VITE_API_URL=http://localhost:3001/api
```

Если запрос выполняется браузером пользователя, `localhost` — это компьютер пользователя, а не контейнер frontend.

Если frontend и API доступны через разные внешние порты, браузер может обращаться к API через `http://localhost:3001`.

Если запрос выполняется серверным кодом внутри контейнера, используй имя сервиса:

```text
http://api:3001
```

Не путай браузерную сеть и внутреннюю Docker-сеть.

---

# 16. Практические задания для закрепления

Чтобы действительно научиться Docker, рекомендую не просто читать команды, а выполнять задания самостоятельно.

## Уровень 1. Основы

- [ ] Скачать образ Nginx.
- [ ] Запустить контейнер.
- [ ] Пробросить порт 8080:80.
- [ ] Открыть Nginx в браузере.
- [ ] Посмотреть логи.
- [ ] Остановить контейнер.
- [ ] Удалить контейнер.
- [ ] Удалить образ.

## Уровень 2. Dockerfile

- [ ] Создать простое Node.js-приложение.
- [ ] Написать Dockerfile.
- [ ] Собрать собственный образ.
- [ ] Запустить контейнер.
- [ ] Изменить код и пересобрать образ.
- [ ] Добавить `.dockerignore`.
- [ ] Проверить разницу в размере build context.

## Уровень 3. Docker Compose

- [ ] Создать `docker-compose.yml`.
- [ ] Подключить Nginx.
- [ ] Подключить PostgreSQL.
- [ ] Настроить проброс портов.
- [ ] Создать именованный volume.
- [ ] Настроить общую сеть.
- [ ] Подключить backend к PostgreSQL.
- [ ] Передать настройки через `.env`.

## Уровень 4. Production

- [ ] Написать Multi-stage Dockerfile для NestJS.
- [ ] Написать Multi-stage Dockerfile для React + Vite.
- [ ] Использовать Nginx для frontend.
- [ ] Добавить healthcheck.
- [ ] Настроить restart policy.
- [ ] Проверить работу приложения после пересоздания контейнеров.
- [ ] Убедиться, что данные PostgreSQL сохраняются после `docker compose down`.
- [ ] Проверить, что секреты не попадают в Git и Docker-образы.

---

# 17. Полезные официальные ресурсы

| Ресурс | Для чего нужен |
|---|---|
| https://docs.docker.com/ | Основная документация Docker |
| https://docs.docker.com/get-started/ | Начало работы с Docker |
| https://docs.docker.com/reference/dockerfile/ | Все инструкции Dockerfile |
| https://docs.docker.com/compose/ | Docker Compose |
| https://docs.docker.com/engine/storage/volumes/ | Volumes |
| https://docs.docker.com/engine/network/ | Сети Docker |
| https://hub.docker.com/ | Готовые Docker-образы |

---

# 18. Краткая шпаргалка

| Что нужно сделать | Команда |
|---|---|
| Скачать образ | `docker pull nginx` |
| Посмотреть образы | `docker images` |
| Запустить контейнер | `docker run nginx` |
| Запустить в фоне | `docker run -d nginx` |
| Пробросить порт | `docker run -p 8080:80 nginx` |
| Список контейнеров | `docker ps -a` |
| Остановить контейнер | `docker stop name` |
| Запустить контейнер | `docker start name` |
| Удалить контейнер | `docker rm name` |
| Посмотреть логи | `docker logs name` |
| Войти в контейнер | `docker exec -it name sh` |
| Собрать образ | `docker build -t app .` |
| Запустить Compose | `docker compose up -d` |
| Собрать и запустить | `docker compose up -d --build` |
| Остановить Compose | `docker compose down` |
| Посмотреть Compose | `docker compose ps` |
| Посмотреть логи Compose | `docker compose logs -f` |
| Посмотреть volumes | `docker volume ls` |
| Посмотреть сети | `docker network ls` |
| Проверить конфигурацию | `docker compose config` |

---

# 19. Как правильно думать о Docker

При работе с Docker полезно разделять ответственность:

- **Dockerfile** отвечает за то, как собрать образ приложения.
- **.dockerignore** отвечает за то, какие файлы не попадут в build context.
- **docker-compose.yml** отвечает за то, какие сервисы запускать и как они взаимодействуют.
- **.env** отвечает за настройки и переменные окружения.
- **Volumes** отвечают за сохранение данных.
- **Networks** отвечают за взаимодействие контейнеров.

Главная идея:

Не нужно вручную настраивать каждый компьютер, сервер или контейнер. Нужно один раз описать окружение в конфигурационных файлах, а затем воспроизводимо запускать его командами Docker.

**Хороший результат обучения:** ты должен уметь взять новый Node.js-проект, самостоятельно написать Dockerfile, исключить ненужные файлы через .dockerignore, подключить PostgreSQL через Docker Compose, настроить переменные окружения и объяснить, почему каждый параметр находится именно там.
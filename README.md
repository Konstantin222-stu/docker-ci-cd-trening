

# CD — Docker Publish и Deployment

Документация по настройке и развитию этапа **CD (Continuous Delivery / Continuous Deployment)** в учебном монорепозитории.

Проект состоит из двух приложений:

- **Client** — Vite + React + TypeScript.
- **Server** — NestJS + TypeScript.

Автоматизация выполняется через GitHub Actions.

## 1. Текущее состояние CD

На данный момент реализована непрерывная доставка Docker-образов в **GitHub Container Registry (GHCR)**.

После успешного прохождения проверок GitHub Actions:

1. Подготавливает Docker Buildx.
2. Авторизуется в GitHub Container Registry.
3. Собирает Docker-образ сервера.
4. Публикует образ сервера.
5. Собирает Docker-образ клиента.
6. Публикует образ клиента.

Важно различать два этапа:

| Этап | Назначение | Статус |
|---|---|---|
| Docker Build | Создание Docker-образов | Реализован |
| Docker Push | Публикация образов в GHCR | Реализован |
| Docker Deploy | Развёртывание на сервере | Пока не реализован |

Таким образом, сейчас настроена доставка готовых Docker-образов, но не автоматический запуск приложения на VPS.

---

## 2. Структура проекта

```text
docker/
│
├── .github/
│   └── workflows/
│       └── pipeline.yml          # Общий CI/CD pipeline
│
├── client/
│   ├── src/
│   ├── Dockerfile                # Сборка Client image
│   └── package.json
│
├── server/
│   ├── src/
│   ├── Dockerfile                # Сборка Server image
│   └── package.json
│
├── docker-compose.yml
├── .env
└── README.md
```

Основная конфигурация автоматизации находится в:

```text
.github/workflows/pipeline.yml
```

Именно в этом файле описаны зависимости между задачами, условия публикации и действия Docker.

---

## 3. Как устроен текущий CD pipeline

Общая последовательность:

```text
                 GitHub Repository
                         |
                         v
                  Push в master
                         |
                         v
                 GitHub Actions
                         |
             +-----------+-----------+
             |                       |
             v                       v
          Server CI              Client CI
             |                       |
             +-----------+-----------+
                         |
                         v
                 Успешные проверки
                         |
                         v
                  Docker Publish
                         |
             +-----------+-----------+
             |                       |
             v                       v
       Build Server Image      Build Client Image
             |                       |
             v                       v
        Push в GHCR              Push в GHCR
             |                       |
             +-----------+-----------+
                         |
                         v
                Docker-образы готовы
```

Важный момент: публикация Docker-образов не должна выполняться, если проверки сервера или клиента завершились ошибкой.

### 3.1. Зависимости между jobs

В `pipeline.yml` используется:

```yaml
needs:
  - server-ci
  - client-ci
```

`needs` определяет зависимость одной задачи от других.

В нашем случае `docker-publish` зависит сразу от двух задач:

- `server-ci`;
- `client-ci`.

Это означает, что публикация начнётся только после успешного выполнения обеих задач.

Если одна из них завершится ошибкой, `docker-publish` будет пропущен.

### 3.2. Условие запуска публикации

В конфигурации используется:

```yaml
if: github.event_name == 'push' && github.ref == 'refs/heads/master'
```

Разберём условие:

- `github.event_name` — событие, которое запустило workflow.
- `push` — отправка изменений в репозиторий.
- `github.ref` — ссылка на ветку или тег.
- `refs/heads/master` — конкретная ветка `master`.
- `&&` — логическое И.

Следовательно, Docker Publish запускается только при одновременном выполнении двух условий:

1. Workflow запущен событием `push`.
2. Изменения отправлены непосредственно в `master`.

При запуске через `pull_request` публикация не выполняется.

Это защищает GHCR от публикации образов при каждом промежуточном изменении в Pull Request.

---

## 4. GitHub Container Registry (GHCR)

**GitHub Container Registry** — хранилище Docker-образов, интегрированное с GitHub.

Оно позволяет хранить готовые образы приложений и получать их с помощью Docker.

Вместо того чтобы каждый раз собирать приложение непосредственно на сервере, можно заранее создать Docker-образ и опубликовать его в реестре.

После этого VPS сможет скачать готовый образ и запустить контейнер.

### 4.1. Адрес реестра

Для GHCR используется:

```text
ghcr.io
```

Полный адрес Docker-образа состоит из нескольких частей:

```text
ghcr.io/OWNER/IMAGE:TAG
```

Где:

- `ghcr.io` — адрес реестра.
- `OWNER` — владелец репозитория или организация.
- `IMAGE` — название Docker-образа.
- `TAG` — версия образа.

### 4.2. Образы текущего проекта

Сервер:

```text
ghcr.io/konstantin222-stu/docker-ci-cd-trening-server
```

Клиент:

```text
ghcr.io/konstantin222-stu/docker-ci-cd-trening-client
```

Для каждого приложения публикуются два тега:

```text
latest
sha-<COMMIT_SHA>
```

Например:

```text
ghcr.io/konstantin222-stu/docker-ci-cd-trening-server:latest

ghcr.io/konstantin222-stu/docker-ci-cd-trening-server:sha-01fcec1...
```

### 4.3. Зачем нужны два тега?

**latest**

Указывает на последний опубликованный образ с таким тегом.

Например:

```bash
docker pull ghcr.io/konstantin222-stu/docker-ci-cd-trening-server:latest
```

Удобен для получения актуальной версии приложения.

**sha-...**

Содержит идентификатор конкретного Git-коммита, из которого был собран образ.

Например:

```bash
docker pull ghcr.io/konstantin222-stu/docker-ci-cd-trening-server:sha-01fcec1...
```

Позволяет получить конкретную версию приложения.

Это особенно полезно для отката: если новая версия работает неправильно, можно запустить предыдущий образ по его SHA-тегу.

Рекомендуется использовать SHA-теги для воспроизводимых развёртываний, а `latest` — для удобного получения последней версии.

---

## 5. Разбор Docker Publish

В текущем `pipeline.yml` публикация состоит из нескольких шагов.

### 5.1. Разрешения workflow

На уровне всего workflow:

```yaml
permissions:
  contents: read
```

Это минимальное разрешение, необходимое для чтения содержимого репозитория.

Но для публикации Docker-образов этого недостаточно.

Поэтому внутри `docker-publish` задаются дополнительные права:

```yaml
permissions:
  contents: read
  packages: write
```

`packages: write` разрешает workflow публиковать пакеты в GitHub Packages, включая Docker-образы в GHCR.

Важно: права задаются непосредственно для задачи публикации, поскольку именно ей требуется доступ на запись.

### 5.2. Подготовка Docker Buildx

```yaml
- name: Setup Docker Buildx
  uses: docker/setup-buildx-action@v3
```

Docker Buildx — инструмент для расширенной сборки Docker-образов.

Он используется вместе с Docker BuildKit и предоставляет дополнительные возможности сборки.

В нашем pipeline Buildx подготавливает окружение, в котором следующие шаги смогут собирать Docker-образы.

### 5.3. Авторизация в GHCR

```yaml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

Перед публикацией Docker должен авторизоваться в реестре.

Разберём параметры:

| Параметр | Назначение |
|---|---|
| `registry` | Адрес реестра |
| `username` | Пользователь, от имени которого выполняется авторизация |
| `password` | Токен для авторизации |

`github.actor` — пользователь или субъект, от имени которого запущен workflow.

`secrets.GITHUB_TOKEN` — автоматически предоставляемый GitHub токен для текущего workflow.

Отдельно создавать этот токен вручную не требуется.

Важное условие: у задачи должны быть права `packages: write`.

### 5.4. Сборка и публикация Server

```yaml
- name: Build and push Server image
  uses: docker/build-push-action@v6
  with:
    context: ./server
    push: true
    tags: |
      ghcr.io/konstantin222-stu/docker-ci-cd-trening-server:latest
      ghcr.io/konstantin222-stu/docker-ci-cd-trening-server:sha-${{ github.sha }}
```

Разберём параметры:

**context**

```yaml
context: ./server
```

Указывает директорию, которую Docker будет использовать как контекст сборки.

В ней находится `Dockerfile` сервера и необходимые для сборки файлы.

**push**

```yaml
push: true
```

Разрешает отправить собранный Docker-образ в указанный реестр.

Если установить `false`, образ будет собран, но не опубликован.

**tags**

```yaml
tags: |
  ...:latest
  ...:sha-${{ github.sha }}
```

Указывает теги, под которыми образ будет опубликован.

`github.sha` — полный SHA-идентификатор коммита, который запустил workflow.

Таким образом, один и тот же образ публикуется сразу под двумя тегами.

### 5.5. Сборка и публикация Client

```yaml
- name: Build and push Client image
  uses: docker/build-push-action@v6
  with:
    context: ./client
    push: true
    tags: |
      ghcr.io/konstantin222-stu/docker-ci-cd-trening-client:latest
      ghcr.io/konstantin222-stu/docker-ci-cd-trening-client:sha-${{ github.sha }}
```

Логика аналогична серверу.

Отличается только:

```yaml
context: ./client
```

Теперь Docker использует Dockerfile и файлы фронтенда.

В результате в GHCR публикуются два самостоятельных образа:

- Server;
- Client.

Они могут обновляться независимо друг от друга, хотя в текущем pipeline публикация выполняется в рамках одной задачи.

---

## 6. Как проверить опубликованные Docker-образы

После успешного выполнения pipeline нужно проверить, появились ли образы в GHCR.

### 6.1. Через GitHub

1. Открыть репозиторий.
2. Перейти в раздел Packages.
3. Найти опубликованные пакеты.
4. Открыть Server и Client.
5. Проверить доступные версии и теги.

### 6.2. Через Docker CLI

Скачать сервер:

```bash
docker pull ghcr.io/konstantin222-stu/docker-ci-cd-trening-server:latest
```

Скачать клиент:

```bash
docker pull ghcr.io/konstantin222-stu/docker-ci-cd-trening-client:latest
```

Посмотреть скачанные образы:

```bash
docker images
```

Если образы скачались успешно, значит публикация в GHCR работает.

Если пакеты приватные, перед скачиванием потребуется авторизация:

```bash
docker login ghcr.io
```

Для входа используется GitHub username и подходящий токен с правом чтения пакетов (`read:packages`).

Не хранить токен непосредственно в командах, конфигурациях или Git-репозитории.

---

## 7. Как работает CD с Docker Compose

В проекте уже используется `docker-compose.yml`.

Docker Compose позволяет описывать несколько контейнеров и управлять ими как одним приложением.

Например, приложение может состоять из:

- PostgreSQL;
- NestJS API;
- React Client.

На текущем этапе Compose используется для локального запуска проекта.

В дальнейшем его можно будет использовать и на VPS.

Общая схема будущего развёртывания:

```text
              GitHub Actions
                     |
                     v
              CI завершился
                успешно
                     |
                     v
              Docker Build
                     |
                     v
               Docker Push
                     |
                     v
                  GHCR
                     |
                     v
              VPS получает
               новую версию
                     |
                     v
              docker compose
                  pull
                     |
                     v
              docker compose
                    up
                     |
                     v
              Приложение работает
```

Главная идея: GitHub Actions создаёт и публикует образы, а VPS получает их и запускает.

Это позволяет разделить ответственность:

- GitHub Actions отвечает за сборку и доставку.
- GHCR отвечает за хранение образов.
- VPS отвечает за запуск приложения.

---

## 8. Будущий этап: автоматический Deploy на VPS

Следующий этап развития проекта — добавить автоматическое развёртывание после публикации Docker-образов.

Для этого понадобится VPS с установленными:

- Docker;
- Docker Compose;
- SSH-сервером.

Также необходимо подготовить конфигурацию приложения на сервере.

### 8.1. Что нужно подготовить на VPS

Пример будущей структуры:

```text
/opt/docker-project/
│
├── docker-compose.yml
└── .env
```

`docker-compose.yml` должен использовать образы из GHCR.

Например, для API:

```yaml
services:
  api:
    image: ghcr.io/konstantin222-stu/docker-ci-cd-trening-server:latest
    restart: unless-stopped
    ports:
      - "3001:3000"
```

Для клиента:

```yaml
  web:
    image: ghcr.io/konstantin222-stu/docker-ci-cd-trening-client:latest
    restart: unless-stopped
```

Это только иллюстрация принципа. Перед реальным деплоем Compose нужно привести в соответствие с текущими Dockerfile, переменными окружения, портами, PostgreSQL и сетевой конфигурацией проекта.

### 8.2. Secrets для подключения к VPS

GitHub Actions должен получить возможность подключиться к серверу.

Для этого можно использовать SSH.

В GitHub:

1. Открыть Settings репозитория.
2. Перейти в Secrets and variables.
3. Выбрать Actions.
4. Создать необходимые secrets.

Например:

| Secret | Назначение |
|---|---|
| `VPS_HOST` | IP-адрес или домен сервера |
| `VPS_USER` | Пользователь Linux |
| `VPS_SSH_KEY` | Приватный SSH-ключ |
| `VPS_PORT` | SSH-порт, если отличается от стандартного |

Приватный ключ нельзя помещать в YAML или коммитить в репозиторий.

Также перед подключением необходимо настроить проверку SSH host key, чтобы не отключать проверку подлинности сервера.

### 8.3. Добавление Deploy job

В будущем в `pipeline.yml` можно добавить отдельную задачу:

```yaml
deploy:
  name: Deploy to VPS
  runs-on: ubuntu-latest

  needs:
    - docker-publish

  if: github.event_name == 'push' && github.ref == 'refs/heads/master'

  steps:
    - name: Deploy application
      run: |
        # SSH connection to VPS
        # Pull new Docker images
        # Restart application
```

Это схема будущей задачи, а не готовый рабочий деплой.

Внутри неё предстоит реализовать:

1. Подключение к VPS через SSH.
2. Переход в директорию проекта.
3. Авторизацию в GHCR при необходимости.
4. Получение новых Docker-образов.
5. Перезапуск контейнеров.
6. Проверку состояния приложения.

Основные команды на сервере будут выглядеть примерно так:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

**Что делают команды:**

`docker compose pull` — скачивает новые версии образов, указанные в Compose.

`docker compose up -d` — создаёт или обновляет контейнеры и запускает их в фоновом режиме.

`docker compose ps` — показывает состояние контейнеров.

Важно: команда `docker compose pull` не пересобирает образы. Она получает уже опубликованные образы из реестра.

### 8.4. Порядок выполнения после добавления Deploy

В результате pipeline будет выглядеть так:

```text
             Server CI
                 |
                 |
             Client CI
                 |
                 v
          Docker Publish
                 |
                 v
                GHCR
                 |
                 v
             Deploy VPS
                 |
                 v
          Docker Compose
                 |
                 v
            Production
```

Благодаря `needs` задача Deploy будет ждать успешной публикации Docker-образов.

Если публикация завершится ошибкой, развёртывание автоматически будет пропущено.

---

## 9. Типичные проблемы CD

### 9.1. Ошибка авторизации в GHCR

Возможные причины:

- Неправильно указан registry.
- Не хватает `packages: write`.
- Используется неверный токен.
- Пакет имеет ограничения доступа.

Проверить:

```yaml
permissions:
  contents: read
  packages: write
```

И настройки шага авторизации.

### 9.2. Ошибка при сборке Docker-образа

Возможные причины:

- Неправильный `context`.
- Отсутствует Dockerfile.
- Ошибка в командах Dockerfile.
- Файл исключён через `.dockerignore`.
- Не хватает необходимых файлов для сборки.

Проверить, что:

```yaml
context: ./server
```

соответствует расположению Dockerfile сервера.

Для клиента:

```yaml
context: ./client
```

### 9.3. Docker Publish пропускается

Проверить:

- Успешно ли завершился Server CI.
- Успешно ли завершился Client CI.
- Выполнено ли условие `if`.
- Запущен ли workflow через `push`.
- Отправлен ли коммит в `master`.

Помнить: `needs` блокирует публикацию при ошибке зависимых задач.

### 9.4. Образ не скачивается с VPS

Возможные причины:

- VPS не авторизован в GHCR.
- Пакет приватный.
- Неправильно указано имя образа.
- Используется несуществующий тег.
- На сервере нет доступа к интернету.

Проверить адрес образа и выполнить авторизацию через Docker CLI.

---

## 10. Алгоритм написания CD с нуля

Этот раздел нужен как последовательность действий при добавлении CD в другой проект.

### Шаг 1. Определить, что именно доставляем

Например:

- Docker-образ Backend;
- Docker-образ Frontend;
- готовую сборку;
- архив приложения.

В нашем проекте доставляются два Docker-образа.

### Шаг 2. Определить место хранения

Например:

- GitHub Container Registry;
- Docker Hub;
- другой Container Registry.

В нашем проекте используется GHCR.

### Шаг 3. Определить условие публикации

Нужно решить:

- На какой ветке публиковать?
- При каком событии?
- Нужно ли ждать успешного CI?
- Нужно ли публиковать образы при Pull Request?

В нашем проекте публикация выполняется только при `push` в `master`.

### Шаг 4. Настроить права доступа

Определить, какие разрешения нужны workflow.

Для GHCR:

```yaml
permissions:
  contents: read
  packages: write
```

### Шаг 5. Авторизоваться в реестре

Использовать подходящий Docker login action и безопасный токен.

### Шаг 6. Собрать Docker-образы

Указать:

- Dockerfile;
- build context;
- необходимые build arguments;
- платформы, если требуется.

### Шаг 7. Определить теги

Например:

```text
latest
sha-<COMMIT_SHA>
```

### Шаг 8. Опубликовать образы

Использовать Docker Build Push Action с:

```yaml
push: true
```

### Шаг 9. Проверить результат

Убедиться, что образы появились в реестре и доступны для скачивания.

### Шаг 10. Добавить Deploy

Если требуется автоматический запуск приложения на сервере, добавить отдельный job, который зависит от публикации.

---

## 11. Полезные официальные ресурсы

- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Buildx](https://docs.docker.com/build/)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Docker Login Action](https://github.com/docker/login-action)
- [Docker Compose](https://docs.docker.com/compose/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)

---

## 12. Главное, что нужно запомнить

При написании CD нужно ответить на следующие вопросы:

1. **Что доставляем?** — Docker-образ или другой артефакт.
2. **Куда доставляем?** — GHCR, Docker Hub или другой реестр.
3. **Когда публикуем?** — `on`, `if`.
4. **Какие проверки должны завершиться успешно?** — `needs`.
5. **Какие права нужны?** — `permissions`.
6. **Как авторизоваться?** — Docker Login и Secrets.
7. **Как собрать образ?** — Docker Buildx и Docker Build Push Action.
8. **Как назвать версию?** — Docker tags.
9. **Как проверить публикацию?** — GHCR и `docker pull`.
10. **Как запустить приложение?** — Docker Compose на целевом сервере.

**Главная идея:** CD — это автоматизированная доставка подготовленной версии приложения до места, откуда её можно развернуть. В нашем проекте этот процесс уже включает сборку и публикацию Docker-образов. Следующий логичный этап — автоматическое получение этих образов и запуск приложения на VPS.


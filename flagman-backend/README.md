# Flagman — монорепозиторий

React/Vite интерфейс и Java 17 / Spring Boot REST API в одном репозитории. Node.js и Maven остаются отдельными инструментами сборки; общий контракт описан в `contracts/openapi.yaml`.

## Требования
- Node.js 20.19+ (рекомендуется 22+)
- npm 10+
- Java 17
- Maven 3.9+

## Запуск в разработке
1. В корне: `npm install`
2. В отдельном терминале: `npm run backend:run`
3. В корне: `npm run dev`
4. Откройте `http://localhost:5173`. Vite проксирует `/api` на `http://localhost:8080`.

В dev-профиле начальные учётные данные заданы в `backend/src/main/resources/application.yml`: логин `admin`, пароль `admin123`; логин `staff`, пароль `staff123`. Это только локальные демонстрационные значения — для реального развертывания задайте секреты через окружение и замените их.

## Проверки
- `npm run build` — сборка фронтенда.
- `npm run backend:test` — тесты Java.
- `npm test` — обе проверки последовательно.
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`.

## Структура
- `apps/web` — React + Vite.
- `backend` — Spring Boot + Maven.
- `contracts/openapi.yaml` — документированный API-контракт.

Фронтенд использует серверные данные для каталога, партий, заказов, поставок, стоп-листа, горячих предложений и списаний. Учётные данные HTTP Basic хранятся только в памяти вкладки, а не в `localStorage`.

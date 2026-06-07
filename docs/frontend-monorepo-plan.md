# План: Frontend (Next.js + TanStack Query + TS) + Nx-монорепо для Events API

## Context

У нас є зрілий NestJS API (RealWorld-подібний «Conduit», розширений доменом **Events**). Мета — побудувати **фронтенд** і перетворити репозиторій на **Nx-монорепо** (backend + frontend + спільні бібліотеки).

Продуктова ідея (з уточнень користувача):
- Головна сутність — **Events** (івенти). Є список івентів, сторінка івента.
- На івент можна **зареєструватися** — і авторизовані, і анонімні (гостьові) користувачі. API під це вже готове.
- **Коментарі до івента йдуть через статті**: `Event → Articles → Comments`. Стаття **прив'язана до івента**, але також показується у **статтях автора на профілі**, і з картки статті можна **перейти на сторінку її івента**.
- Користувачі коментують статті (вкладені відповіді + лайки), ставлять рейтинг івентам, фоловлять авторів.

Цей план навмисно структурований як **специфікація-контракт**: кожна фіча — самодостатній «work package» (екрани, ендпоінти, хуки, компоненти, acceptance criteria), щоб його можна було віддати агенту і використати для дизайну.

---

## 1. Архітектурні рішення (рекомендації; правимо на апруві)

| # | Рішення | Рекомендація | Альтернатива |
|---|---------|--------------|--------------|
| R1 | **Scope** | Повний застосунок навколо івентів: Events + Articles + Comments + Profiles + Auth + Tags (Registrations/Ratings на івентах). Порядок — Events спершу. | Тільки Events-MVP без profiles/articles |
| R2 | **Nx adoption** | **Інкрементально**: Nx у корені, API лишається на місці (`project.json` поверх наявного `src/`), додаємо `apps/web` + `libs/*`. Фізичний перенос API в `apps/api` — окремий пізніший крок (щоб не ламати Docker/Helm/Argo/CI одразу). | Одразу повний перенос API в `apps/api` (ризик для інфри) |
| R3 | **Типи/клієнт** | Спершу **hand-written `libs/shared-types`** як єдине джерело правди (швидко розблоковує фронт) + тонкий typed `api-client`. Паралельно дозбагатити Swagger response-DTO і **пізніше** перейти на кодоген (orval, `react-query` mode). | Одразу orval/openapi-typescript (блокується неповними `@ApiResponse` без `type`) |
| R4 | **Рендеринг** | Next.js **App Router**. Публічний контент (списки/деталі/коментарі-GET) — SSR + `HydrationBoundary`. Авторизовані дії — клієнтські. | Повний CSR SPA |
| R5 | **Auth/token** | API чекає нестандартний `Authorization: Token <jwt>`. Токен у **cookie** (читається і на сервері для SSR-персоналізації, і клієнтом). | localStorage (простіше, але без SSR-персоналізації) або httpOnly+BFF-проксі (безпечніше, більше плумбінгу) |
| R6 | **Стилі/UI-kit** | **Tailwind CSS + shadcn/ui** (Radix), іконки lucide, темізація через CSS-змінні (light/dark). | MUI/Chakra |
| R7 | **Форми/валідація** | **react-hook-form + zod**; zod-схеми дзеркалять DTO-валідатори (`@IsEmail`, `@IsNotEmpty`, `Min/Max`, `score 1..5`, `endDate > startDate`). | Нативні форми |
| R8 | **Дати/час** | `date-fns` (форматування, діапазони, isPast/isUpcoming). Усі дати з API — ISO-рядки. | dayjs |

---

## 2. Backend prep (єдині зміни бекенду — малі, локальні)

Робимо в наявному `src/` (до або під час Nx-adoption). Кожне — окремий комміт + оновлення e2e.

**B1 — Фільтр статей по івенту (потрібно для розділу статей на сторінці івента).** ✅ зроблено
- `src/article/types/article.interfaces.ts`: додати `event?: string` (eventId) в `ArticlesQueryInterface`.
- `src/article/article.service.ts` (`getArticles`, ~рядок 47): додати гілку
  `if (query.event) queryBuilder.andWhere('articles.eventId = :eventId', { eventId: query.event })`.
- `src/article/article.controller.ts`: додати `@ApiQuery({ name: 'event', required: false, type: Number })`.

**B2 — Повертати `event` у відповіді статті (щоб картка статті лінкувала на свій івент).** ✅ зроблено
- `getArticle` (`article.service.ts:193`): `findOne({ where: { slug }, relations: ['event'] })`.
- `getArticles`: `.leftJoinAndSelect('articles.event', 'event')`.
- У відповідь віддавати щонайменше `event: { id, title } | null` (можна мапити, щоб не тягнути зайве).

**B3 (опційно, рекомендовано) — стан реєстрації/лайків для UI:**
- `GET /api/events/:id`: коли є `currentUser`, додати `registered: boolean` (за аналогією з `liked` у коментарях, `favorited` у статтях) — щоб коректно показувати кнопку Register/Cancel.
- (опц.) `GET /api/events/:id/registrations` (тільки автор івента) — список учасників.
- (опц.) `GET /api/me/registrations` — «мої івенти, на які я записаний».
> Без B3 MVP працює: стан кнопки визначаємо оптимістично + по 400 «already registered»; списку учасників немає.

**B4 (опційно) — кодоген-готовність Swagger:** додати класи-DTO відповідей з `@ApiProperty` і `@ApiOkResponse({ type })` на ендпоінтах. Розблоковує перехід R3 на orval. Робити поступово.

---

## 3. Структура Nx-монорепо (цільова)

```
nest-js-api-practice/                # стає Nx workspace (nx.json, корінь)
├── apps/
│   ├── api/            # NestJS — ЗАЛИШАЄТЬСЯ як є у src/ (project.json поверх), перенос пізніше
│   └── web/            # Next.js (App Router) — НОВЕ
├── libs/
│   ├── shared-types/   # TS-інтерфейси домену + envelope + query params (єдине джерело правди)
│   ├── api-client/     # typed fetch-клієнт (Token-схема, envelope unwrap, error mapper)
│   ├── query/          # TanStack Query: queryKeys + хуки (useEvents, useEvent, useRegister, ...)
│   └── ui/             # shared-ui (shadcn-компоненти, design tokens) — опційно
├── src/                # наявний NestJS код (поки тут; Nx таргети через apps/api/project.json)
├── infra (helm/k8s/docker/.github) — без змін на етапі R2-інкремент
└── nx.json, tsconfig.base.json, package.json (pnpm workspaces)
```

**Кроки adoption (інкрементально, R2):**
1. `pnpm dlx nx@latest init` у корені (package-based → integrated). Зберегти `pnpm-workspace.yaml`.
2. Додати `apps/web` через `nx g @nx/next:app web` (App Router, Tailwind = yes).
3. Винести спільні `paths` у `tsconfig.base.json` (`@app/*` → `src/*`, `@events/shared-types`, `@events/api-client`, `@events/query`).
4. `nx g @nx/js:lib shared-types|api-client|query` (bundler: none/tsc, unitTestRunner: vitest).
5. Обгорнути наявні backend-скрипти Nx-таргетами (`api:serve/build/test/lint`) через `apps/api/project.json` з `nx:run-commands`, що делегують на існуючі pnpm-скрипти. **Інфру (Dockerfile/helm/CI) не чіпаємо.**
6. Перевірка: `nx run-many -t lint test` зелене; backend e2e (`pnpm test:e2e`) зелене.

> Повний перенос `src/ → apps/api/src/` — окремий гейтований крок (оновити `@app/*` baseUrl, `nest-cli.json` sourceRoot, jest `rootDir`/`moduleNameMapper`, `_moduleAliases`, Dockerfile/helm/CI шляхи). Робити **після** того, як фронт працює, з повним прогоном e2e + CI.

---

## 4. Доменні типи (контракт для `libs/shared-types`)

> Усі **відповіді обгорнуті** (`{ event }`, `{ events, eventsCount }`, `{ user }`, `{ article }`, `{ comment }`, `{ comments }`, `{ registration }`, `{ profile }`, `{ tags }`).
> Усі **запити обгорнуті**: `{ user }`, `{ event }`, `{ article }`, `{ comment }`, `{ registration }`, `{ rating: { score } }`.
> Auth header: **`Authorization: Token <jwt>`** (не `Bearer`).

```ts
export interface User { id:number; email:string; username:string; bio:string; image:string; token:string } // token лише в auth-відповідях і GET /user
export interface Author { id:number; username:string; email:string; bio:string; image:string } // User без token
export interface Profile { username:string; bio:string; image:string; following:boolean }

export interface Event {
  id:number; title:string; description:string; location:string;
  startDate:string; endDate:string; image:string; tags:string[];
  registeredCount:number; maxGuests:number; /* 0 = безліміт */ rating:number; /* 0..5 */
  createdAt:string; updatedAt:string; author:Author;
  registered?:boolean; // якщо реалізуємо B3
}
export interface Registration { id:number; email:string; name:string; additionalInfo:string|null; createdAt:string; user?:Author|null; event?:Event }

export interface Article {
  id:number; title:string; slug:string; description:string; body:string;
  tagList:string[]; favoritesCount:number; favorited?:boolean;
  createdAt:string; updatedAt:string; author:Author;
  event?:{ id:number; title:string }|null; // B2
}
export interface Comment {
  id:number; body:string; likesCount:number; liked:boolean;
  createdAt:string; updatedAt:string;
  author:{ username:string; bio:string; image:string }; replies:Comment[];
}

// Query params
export interface EventsQuery { tag?:string; location?:string; author?:string; limit?:number; offset?:number }
export interface ArticlesQuery { tag?:string; author?:string; favorited?:string; event?:number; limit?:number; offset?:number }

// Помилки 422 (RealWorld-конвенція) — підтвердити точну форму з BackendValidationPipe + ExceptionService
export interface ApiErrorResponse { errors: Record<string,string[]> }
```

---

## 5. `libs/api-client` (тонкий typed-клієнт)

- Базовий `request(method, path, { body, query, auth })`:
  - base URL з env (`NEXT_PUBLIC_API_URL` → `http://localhost:3000/api`);
  - додає `Authorization: Token <jwt>` (токен з cookie — на сервері через `next/headers cookies()`, на клієнті через cookie-helper);
  - обгортає body у потрібний envelope, розгортає відповідь;
  - **error mapper**: 422 → `{ field: messages[] }` для прив'язки до полів форм; 401 → тригер логауту; 403/404/400 → typed помилки.
- Експортує по-ресурсні функції: `auth.login/register/me/update`, `events.list/get/create/update/remove/register/cancel/rate/updateRating/removeRating`, `articles.list/get/create/update/remove/favorite/unfavorite`, `comments.list/create/update/remove/like/unlike`, `profiles.get/follow/unfollow`, `tags.list`.

## 6. `libs/query` (TanStack Query)

- **Query key factory** (стабільні ключі): `qk.events.list(query)`, `qk.events.detail(id)`, `qk.articles.list(query)`, `qk.articles.detail(slug)`, `qk.comments.list(slug)`, `qk.profile(username)`, `qk.currentUser`, `qk.tags`.
- **SSR**: у server-компонентах `prefetchQuery` → `dehydrate` → `<HydrationBoundary>`; провайдер `QueryClient` у `app/providers.tsx`.
- **Мутації**: оптимістичні апдейти + точкова інвалідизація:
  - register/cancel → інвалідизує `events.detail` (+ оновлює `registeredCount`/`registered`);
  - rate → `events.detail`; favorite/unfavorite → `articles.detail`+`articles.list`;
  - comment create/delete → `comments.list(slug)`; like/unlike → оптимістично `liked`/`likesCount`.
- Конвенції: `staleTime` ~30s для списків, retry off для 4xx, `placeholderData: keepPreviousData` для пагінації.

---

## 7. Маршрути (App Router, `apps/web/app`)

| Route | Доступ | Дані (ендпоінти) |
|-------|--------|------------------|
| `/` (events list) | публічний | `GET /events` (filters: tag, location, author, search, pagination) + `GET /tags` |
| `/events/[id]` | публічний | `GET /events/:id`; статті івента `GET /articles?event=:id`; register/cancel/rate (auth/guest) |
| `/events/new` | auth | `POST /events` |
| `/events/[id]/edit` | auth(author) | `GET /events/:id`, `PATCH /events/:id`, `DELETE` |
| `/articles/[slug]` | публічний | `GET /articles/:slug`; коментарі `GET/POST/PATCH/DELETE /articles/:slug/comments`; like `/comments/:id/like`; favorite |
| `/articles/[slug]/edit` | auth(author) | `PATCH/DELETE /articles/:slug` |
| (create article) | auth | `POST /articles` — вхід зі сторінки івента, `eventId` пресет |
| `/profile/[username]` | публічний | `GET /profiles/:username`; їх статті `GET /articles?author=username` (кожна лінкує на свій івент); follow |
| `/login`, `/register` | гість | `POST /users/login`, `POST /users` |
| `/settings` | auth | `GET /user`, `PATCH /user`, logout |
| `/me` (дашборд) | auth | мої івенти `GET /events?author=me`; (мої реєстрації — лише з B3) |

---

## 8. Work packages (для агентів — кожен самодостатній)

Формат кожного: **Екрани → Ендпоінти → Хуки/стан → Компоненти → Acceptance**.

### WP-0 — Каркас web-app
- App Router скелет, `providers.tsx` (QueryClient), root layout (header з навігацією/станом auth, footer), Tailwind+shadcn init, тема light/dark, toaster.
- `libs/shared-types` заповнено (розділ 4); `libs/api-client` базовий request+error mapper; `libs/query` keys+провайдер.
- **Acceptance**: `nx serve web` рендерить layout; SSR-фетч одного публічного списку працює з hydration.

### WP-1 — Auth
- Екрани: `/login`, `/register`, `/settings`; хедер-стан (avatar/username ↔ Login/Register).
- Ендпоінти: `POST /users`, `POST /users/login`, `GET /user`, `PATCH /user`.
- Стан: токен у cookie; `useCurrentUser()`; `useLogin/useRegister/useLogout/useUpdateUser`; guard для protected routes (redirect).
- Acceptance: реєстрація/логін зберігає токен, `GET /user` гідрейтиться на сервері, логаут чистить cookie+кеш; 422 показує помилки полів.

### WP-2 — Events list (home)
- Екран `/`: грід/список карток івентів, фільтри (tag-chips з `/tags`, location, author, текстовий пошук), пагінація (limit/offset), стан empty/loading/error.
- Ендпоінти: `GET /events`, `GET /tags`.
- Картка: cover image, title, дата/діапазон (date-fns), location, tags, `registeredCount/maxGuests`, середній `rating` (зірки), upcoming/past badge.
- Acceptance: SSR перший екран, фільтри ↔ URL searchParams, пагінація `keepPreviousData`, deep-link відтворює стан.

### WP-3 — Event detail + реєстрація (auth + guest)
- Екран `/events/[id]`: hero (image/title/dates/location/tags), опис, capacity-індикатор, rating-widget, author-actions (edit/delete) якщо автор.
- **Register CTA → модалка**: для гостя — поля `name`, `email`, `additionalInfo` (валідація як в `RegisterEventDto`); для авторизованого — лише `additionalInfo` (name/email беруться з профілю). Cancel (auth) = `DELETE /events/:id/register`.
- Ендпоінти: `GET /events/:id`, `POST/DELETE /events/:id/register`, `POST/PATCH/DELETE /events/:id/rating`.
- Стан кнопки: якщо B3 — по `event.registered`; інакше оптимістично + обробка 400 «already registered»/«event full».
- Acceptance: гість реєструється без логіна; авторизований — у один клік; повний/уже-зареєстрований кейси показують зрозумілі тости; rating оновлює середнє.

### WP-4 — Статті івента + перехід Event↔Article
- На `/events/[id]`: секція **«Статті/Обговорення»** — `GET /articles?event=:id` (потрібен **B1**), кнопка «Написати статтю для цього івента» (auth) → форма з пресетом `eventId`.
- На картці/сторінці статті — лінк **«Частина івента: <title>»** → `/events/[id]` (потрібен **B2**).
- Ендпоінти: `GET /articles?event=:id`, `POST /articles` (`eventId`).
- Acceptance: статті івента видно на його сторінці; нова стаття одразу з'являється; з будь-якої статті є перехід на її івент.

### WP-5 — Article detail + Comments (коментарі до івента)
- Екран `/articles/[slug]`: тіло, автор, теги, favorite-кнопка (`favoritesCount`), лінк на івент, author-actions.
- **Коментарі**: дерево з `replies`, форма додавання (auth), reply, edit/delete своїх (або автора статті), like/unlike (`POST/DELETE /comments/:id/like`, оптимістично `liked`/`likesCount`).
- Ендпоінти: `GET /articles/:slug`, `GET/POST/PATCH/DELETE /articles/:slug/comments`, `/comments/:id/like`, favorite.
- Acceptance: вкладені відповіді рендеряться рекурсивно; лайк миттєвий і консистентний; неавторизований бачить CTA «увійти, щоб коментувати».

### WP-6 — Event create/edit (author)
- Екрани `/events/new`, `/events/[id]/edit`: форма (title, description, location, startDate, endDate, image URL, tags, maxGuests). Валідація zod = `CreateEventDto` + `endDate > startDate`.
- Ендпоінти: `POST /events`, `PATCH /events/:id`, `DELETE /events/:id` (з confirm).
- Acceptance: 422/«endDate after startDate» мапиться на поля; редагувати/видаляти може лише автор; після save — редірект на деталь.

### WP-7 — Profiles + follow
- Екран `/profile/[username]`: інфо (bio/image), follow/unfollow (auth), список **статей автора** `GET /articles?author=username` (кожна лінкує на свій івент).
- Ендпоінти: `GET /profiles/:username`, `POST/DELETE /profiles/:username/follow`, `GET /articles?author=`.
- Acceptance: статті користувача видно на профілі та ведуть на відповідні івенти; follow-стан оптимістичний.

### WP-8 — Дашборд `/me` + (опц.) реєстрації
- Мої івенти (як автор): `GET /events?author=<me>`; edit/delete shortcuts.
- (Якщо B3) мої реєстрації / список учасників для організатора.
- Acceptance: автор бачить свої івенти; за наявності B3 — свої реєстрації.

### WP-9 — Поліш: skeletons, empty states, error boundaries, SEO/OG для івентів, A11y, responsive, i18n-ready (UA/EN).

---

## 9. Design system / UX (для дизайн-фази)

- **Мова дизайну**: чистий, «event-first». Референси (через наявні lazyweb-скіли: `/lazyweb-design-research`, `/lazyweb-quick-references`): Luma, Partiful, Meetup, Eventbrite, Dice.
- **Tokens** (CSS-змінні, light/dark): кольори (brand/accent/success/warning/destructive, surface/muted), типографіка (Inter/Geist), радіуси, spacing scale, тіні, container widths.
- **Компонентний інвентар (shadcn)**: Button, Input/Textarea, Select, Combobox (tags), DatePicker/Range, Dialog (register modal), Card (EventCard/ArticleCard), Badge/Chip (tags, upcoming/past), Avatar, Tabs (profile), Pagination, RatingStars, CommentThread, Toast, Skeleton, EmptyState, ConfirmDialog.
- **Ключові екрани** (макети): Events grid (фільтр-бар + картки), Event detail (hero + sticky register-панель + capacity + rating + articles), Register modal (toggle guest/auth), Article + comment thread, Profile (tabs), Auth, Settings.
- **Стани**: loading (skeleton), empty, error, повний-івент, уже-зареєстрований, гість-vs-авторизований.
- **Якість**: responsive (mobile-first), a11y (focus-trap у модалках, aria для рейтингу/дерева коментарів, контраст), dark mode, оптимізація зображень (`next/image`).
- **Deliverable дизайну**: токени + сторінка-«styleguide» в Storybook (опц.) або `/_design` route з усіма компонентами.

---

## 10. Tooling / залежності (web + libs)

next, react, @tanstack/react-query (+ devtools), tailwindcss, shadcn-ui (radix), lucide-react, react-hook-form, zod, date-fns, js-cookie (або next cookies), clsx/cva. Dev: vitest + @testing-library/react, msw (моки API в тестах), playwright (e2e), @nx/next, @nx/js, @nx/eslint, @nx/vite. (Опц. пізніше: orval для кодогену з OpenAPI — R3/B4.)

## 11. CI/CD & Docker (після того, як фронт стабільний)

- Оновити `.github/workflows/ci.yml`: `nx affected -t lint test build` (кеш Nx), окремі джоби web/api.
- `apps/web`: Dockerfile (standalone output) + (опц.) Helm-чарт/Service за аналогією з API.
- Backend Dockerfile/helm/argo не чіпаємо до фази повного переносу API.

---

## 12. Roadmap (послідовність)

1. **B1–B2** (backend: фільтр статей по івенту + event у відповіді) + e2e. ✅
2. **Nx adoption** (R2 інкремент) + `libs/shared-types|api-client|query` каркас.
3. **WP-0 → WP-1 → WP-2 → WP-3** (каркас, auth, список, деталь+реєстрація) — це вже робочий MVP.
4. **WP-4 → WP-5** (статті івента + коментарі) — закриває «коментарі до івента».
5. **WP-6 → WP-7 → WP-8** (CRUD івентів, профілі, дашборд).
6. **B3** (стан реєстрації/учасники) за потреби.
7. **WP-9** поліш + дизайн-система + CI/Docker для web.
8. (Пізніше, опц.) повний перенос API в `apps/api` + B4 (кодоген).

---

## 13. Верифікація (end-to-end)

- **Backend локально**: `docker compose up -d postgres` → `pnpm db:migrate` (+ seed) → `pnpm start`. Swagger: `http://localhost:3000/api/docs`. Прогнати `pnpm test` + `pnpm test:e2e` (зокрема нові B1/B2).
- **Frontend**: `NEXT_PUBLIC_API_URL=http://localhost:3000/api nx serve web` → ручні флоу:
  1. Реєстрація/логін → хедер показує користувача; `GET /user` гідрейтиться.
  2. Список івентів: фільтри по tag/location, пошук, пагінація, deep-link.
  3. Деталь івента: **гостьова** реєстрація (name/email), **авторизована** реєстрація, cancel, кейси full/already-registered; rating.
  4. Стаття для івента (create з пресетом eventId) → видно в секції івента і в статтях профілю; перехід стаття→івент.
  5. Коментарі: додати/відповісти/редагувати/видалити/лайк; вкладеність.
  6. Профіль: статті автора лінкують на свої івенти; follow/unfollow.
- **Автотести**: vitest (хуки query/api-client з msw), Playwright e2e на 2-3 критичні флоу (guest-register, comment, create-event) проти seed-БД.
- **Типи/ліз**: `nx run-many -t typecheck lint test`; `nx affected` зелене у CI.

---

## 14. Дефолти, які підтверджуємо на апруві (R1–R8 вище)

Найважливіші: **R2** (інкрементальний Nx, API поки на місці), **R3** (спершу hand-written типи, кодоген пізніше), **R5** (токен у cookie), **B3** (чи робимо стан реєстрації/список учасників зараз).

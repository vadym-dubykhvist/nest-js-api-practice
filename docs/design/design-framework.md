# Design Framework — Events platform (dark / loud)

Дизайн-система під ваш Next.js + Tailwind v4 + shadcn/ui додаток. Напрямок — **dark-first, «Partiful / Dice»**: near-black полотно, велика афішна типографіка (Anton), кислотний акцент (acid lime) + hot-pink для live, насичені постер-градієнти, легкий grain. Еталон — `mockup.html` поряд.

---

## 1. Принципи
1. **Dark-first, poster-led** — фон near-black; кожен івент — афіша (велика обкладинка + тайтл-постер).
2. **One loud action** — головна дія (Register/Create) завжди **acid lime** зі світінням; більше нічого таким кольором не фарбуємо.
3. **Signals are components** — capacity / status / rating кодуються кольором і компонентами, не сірим текстом.
4. **Guest-friendly** — гостьова реєстрація у 2–3 поля.
5. **Loud, but legible** — Anton тільки для дисплейних/постерних тайтлів; основний текст — чистий Inter; числа/час — Space Mono. Контраст ≥ 4.5:1, статус ніколи лише кольором, focus-ring завжди видно.

---

## 2. Кольори (dark — це дефолт застосунку)

| Токен | Hex | Призначення |
|---|---|---|
| `background` | `#0a090e` | основний фон (+ grain) |
| `surface` | `#100e16` | секції/інпут-фон |
| `card` | `#16141d` | картки, панелі, модалки |
| `elevated` | `#1c1a26` | hover-поверхні, вторинні фони |
| `foreground` | `#f4f2fb` | основний текст |
| `muted-foreground` | `#928da6` | метадані, captions |
| `primary` (acid) | `#cdff3a` | головна дія (Register/Create); текст на ній — `#0a090e` |
| `live` (pink) | `#ff3d8b` | Live now, майже-фул, акцент-2; текст `#fff` |
| `rating` (gold) | `#ffc53a` | зірки рейтингу |
| `success` | `#34d17c` | «✓ Registered», підтверджено |
| `warning` | `#ffc53a` | capacity 80–99% |
| `destructive` | `#ff5470` | видалення/помилки |
| `border` | `#272433` | бордери карток/секцій |
| `border-strong` / `input` | `#332f42` | інпути, виразніші бордери |
| `ring` | `#cdff3a` | focus-ring (acid) |

**Event-status:** Upcoming → бейдж `primary`/acid (текст ink). Live → `live`/pink + пульс. Sold out → outline `border-strong`, текст muted. Past → `elevated` фон, текст muted.

**Cover-пресети** (для івентів без `image` — постерний градієнт + Anton-тайтл):
- magenta→orange `#ff3d8b → #ff8a3d` (text #fff)
- violet→cyan `#7b5cff → #3dcbff` (text #fff)
- lime→teal `#cdff3a → #19c39c` (text #0a090e)
- ink→violet `#1c1a26 → #3a2150` (text acid)

> Правило: різнобарв'я — **тільки в обкладинках**. Хром = near-black + acid. Один loud-акцент.

---

## 3. Токени для коду (`apps/web/app/globals.css`)

```css
@import "tailwindcss";

:root{
  --background:#0a090e; --foreground:#f4f2fb;
  --surface:#100e16; --card:#16141d; --card-foreground:#f4f2fb; --elevated:#1c1a26;
  --popover:#16141d; --popover-foreground:#f4f2fb;
  --primary:#cdff3a; --primary-foreground:#0a090e;
  --secondary:#1c1a26; --secondary-foreground:#f4f2fb;
  --muted:#1c1a26; --muted-foreground:#928da6;
  --accent:#1c1a26; --accent-foreground:#f4f2fb;
  --live:#ff3d8b; --live-foreground:#ffffff; --rating:#ffc53a;
  --destructive:#ff5470; --destructive-foreground:#0a090e;
  --success:#34d17c; --warning:#ffc53a;
  --border:#272433; --border-strong:#332f42; --input:#332f42; --ring:#cdff3a;
  --radius:0.875rem;
  --shadow-md:0 18px 40px -16px rgb(0 0 0/.7);
  --shadow-lg:0 40px 90px -30px rgb(0 0 0/.85);
  --glow:0 0 0 1px rgb(205 255 58/.25),0 10px 40px -8px rgb(205 255 58/.35);
}

@theme inline{
  --color-background:var(--background); --color-foreground:var(--foreground);
  --color-card:var(--card); --color-card-foreground:var(--card-foreground);
  --color-popover:var(--popover); --color-popover-foreground:var(--popover-foreground);
  --color-primary:var(--primary); --color-primary-foreground:var(--primary-foreground);
  --color-secondary:var(--secondary); --color-secondary-foreground:var(--secondary-foreground);
  --color-muted:var(--muted); --color-muted-foreground:var(--muted-foreground);
  --color-accent:var(--accent); --color-accent-foreground:var(--accent-foreground);
  --color-live:var(--live); --color-rating:var(--rating);
  --color-success:var(--success); --color-warning:var(--warning);
  --color-destructive:var(--destructive); --color-destructive-foreground:var(--destructive-foreground);
  --color-border:var(--border); --color-input:var(--input); --color-ring:var(--ring);
  --radius-sm:calc(var(--radius) - 4px); --radius-md:calc(var(--radius) - 2px);
  --radius-lg:var(--radius); --radius-xl:calc(var(--radius) + 8px);
  --font-display:var(--font-anton); --font-sans:var(--font-inter); --font-mono:var(--font-space-mono);
}

*{border-color:var(--border)}
body{background:var(--background);color:var(--foreground);font-family:var(--font-sans),system-ui,sans-serif;
  background-image:url("/grain.svg");}
```

> Поки **dark-only** (як Partiful/Dice). Якщо знадобиться світла тема — додамо `.light` з окремими значеннями (acid лишається акцентом, але кнопки в light — ink, бо lime на білому має поганий контраст).

---

## 4. Типографіка

`next/font` → CSS-змінні `--font-anton`, `--font-inter`, `--font-space-mono`.

- **Display / постери:** **Anton** — `text-transform:uppercase`, `line-height:.9`, tracking `+.01em`. Тільки для hero/постер-тайтлів, великих секцій, назв у модалках/квитку.
- **UI / body:** **Inter** (400–700) — увесь інтерфейс і проза.
- **Numeric / labels:** **Space Mono** + `tabular-nums` — дата/час, `42/100`, рейтинг, eyebrow-лейбли (ALL-CAPS, tracking `.18–.22em`).

| Роль | Шрифт / розмір | Прим. |
|---|---|---|
| Hero title | Anton `clamp(2.6→4.6rem)` /.9 | uppercase |
| Poster title (card) | Anton `2.3rem` /.9 | uppercase |
| Section head | Anton `1.7rem` | uppercase + mono-лічильник |
| Card / row title | Inter 600 `1.05rem` | |
| Body | Inter 400 `1rem` /1.65 | |
| Meta / caption | Inter 400–500 `.82rem` | `muted-foreground` |
| Eyebrow / overline | Space Mono `.68rem` | UPPERCASE, tracking .2em |
| Numeric (date/count) | Space Mono `.74–.82rem` | tabular-nums |

---

## 5. Spacing · Radius · Shadow · Motion
- **Spacing** — база 4px. Card padding `16–18`, gap карток `20`, section `54` верт., page padding `28`.
- **Radius** — base `14px`: inputs/buttons `12`, cards `18`, hero/banner `22`, modal `22`, chips/tags `7–8`, профіль-аватар `30` (rounded-square).
- **Shadow/Glow** — тіні глибокі (`--shadow-md/lg`); acid-кнопка на hover отримує `--glow`.
- **Motion** — `cubic-bezier(.2,0,0,1)`; `120ms` hover, `140ms` card-lift (`translateY(-4px)`), live-pulse `1.2s`. `prefers-reduced-motion` → off.
- **Texture** — `grain.svg` як `background-image` на `body` (subtle, ~4% opacity).
- **Containers** — контент `max-1180px`; reading (article) `max-720px`; events-grid `repeat(auto-fill,minmax(290px,1fr))`.

---

## 6. Icons

**Бібліотека: `lucide-react`** (line, stroke 1.7). У `mockup.html` вони інлайн-SVG (для file://), у застосунку — імпорт компонентів.

| Призначення | lucide-react | у спрайті макета |
|---|---|---|
| Пошук | `Search` | `#i-search` |
| Дата | `Calendar` | `#i-cal` |
| Час | `Clock` | `#i-clock` |
| Локація | `MapPin` | `#i-pin` |
| Рейтинг (зірка, filled) | `Star` | `#i-star` |
| CTA-стрілка | `ArrowUpRight` | `#i-arrow` |
| Учасники / registered | `Users` | `#i-users` |
| Лайк / favorite | `Heart` | `#i-heart` |
| Коментарі | `MessageCircle` | `#i-msg` |
| Email | `Mail` | `#i-mail` |
| Пароль | `Lock` | `#i-lock` |
| Показати пароль | `Eye` / `EyeOff` | `#i-eye` |
| Обкладинка (upload) | `ImagePlus` (або `Image`) | `#i-image` |
| Теги | `Hash` | `#i-hash` |
| Прибрати чіп / закрити | `X` | `#i-x` |
| Follow | `UserPlus` | `#i-userplus` |
| Редагувати профіль | `SquarePen` (Pencil) | `#i-edit` |
| Stepper +/− | `Plus` / `Minus` | (текст у макеті) |
| Дропдаун | `ChevronDown` | (picker) |

Встановити: `pnpm --filter @events/web add lucide-react`. Використання: `import { Calendar, MapPin } from 'lucide-react'` → `<Calendar size={16} />`.

---

## 7. Assets

Кастомна графіка лежить у **`apps/web/public/`** (статика Next):
- **`logo.svg`** — бренд-мітка (acid-spark). У nav: `<img src="/logo.svg">` + wordmark Anton. Файл у `assets/logo.svg` поряд з макетом — скопіюй у `public/`.
- **`grain.svg`** — текстура шуму для `body background-image: url('/grain.svg')`. Скопіюй у `public/`.
- (опц.) `favicon` / OG-зображення — згенерувати з логотипа пізніше.

**Растрові зображення** в дизайні **не баняться**:
- **обкладинки івентів** — це `event.image` з API (`next/image`); якщо порожнє → **cover-пресет** (градієнт + Anton-тайтл, §2).
- **аватари** — `user.image` / `author.image` з API; фолбек — ініціали на `elevated`.
- Скріншоти в `references/` — це матеріали дослідження, **не** ассети застосунку.

---

## 8. Компоненти (специфікації)

### Nav (app shell)
Sticky top (`h66`), напівпрозорий near-black фон + `backdrop-blur`, нижній бордер `border`. Зліва — лого (`logo.svg`, acid-spark + drop-shadow) і wordmark **Eventino** (Anton). По центру — `searchf` (поле пошуку, іконка Search). Справа — стан auth: гість → outline **Log in** + acid **Create event** (ArrowUpRight); авторизований → avatar + меню. Усе в `.wrap` (max 1180).

### Button
`acid` (primary, ink-текст, glow на hover) · `outline` (border-strong) · `ghost` (hover `elevated`) · `destructive`. Розміри sm32/md40/lg46, radius 12, focus-ring acid.

### EventCard (poster)
Постер 4:5 (cover-пресет або `event.image`) з Anton-тайтлом і date-табом (mono) → body: `StatusBadge` + `RatingStars`, `metarow` (Calendar/MapPin), `CapacityMeter`. Hover: lift −4px + border-strong + shadow.

### EventHero (detail)
Full-bleed cover 16:10 (radius 22) з eyebrow (дата·місце) + Anton-тайтл `clamp(2.6→4.6rem)`. Праворуч — sticky **Ticket**.

### Ticket (sticky register)
Картка з **перфорацією** (`dashed` + бічні круглі насічки кольору фону). Top: дата (Anton) + час (mono), MapPin-локація, `CapacityMeter`, `AttendeeStack`. Bot (під перфорацією): `acid` Register + note + outline «Rate event». Mobile — фіксований bottom-bar.

### RegisterModal (guest/auth)
Segmented `As guest | Sign in` (активний — acid). Guest: Name+Email; обидва: Note. «X of N spots left» (mono) + acid Confirm. Mobile — bottom-sheet.

### CapacityMeter / RatingStars / StatusBadge / Tag / AttendeeStack
Бар 5px (`primary`→`warning`@80%→`live`@full). Зірки `rating`+mono. Бейджі — Space Mono uppercase. Tag — mono в outline-чіпі. Стек аватарів overlap −10px, +N.

### Login (`/login`)
**Split 1.1:1**: ліворуч `authposter` (градієнт magenta→violet + Anton «DON'T MISS OUT»), праворуч `authwrap` — Anton «WELCOME BACK», поля з іконками (`inrow`: Mail / Lock+Eye), acid Log in, лінк на реєстрацію. Mobile — стек.

### Create event (`/events/new`)
**Form-grid 1:360**: ліворуч `fieldset` — Cover (`cover-drop`, ImagePlus), Title, Description (textarea), Starts/Ends (two), Location, Tags (`chips-in` з X), Max guests (`stepper`), acid «Publish». Праворуч — **sticky Live preview** (EventCard оновлюється). Валідація 422 → під полями.

### Profile (`/profile/[username]`)
Хедер у 3 ряди, щоб високий Anton-текст не вилітав у банер:
1. **`profbanner`** — градієнт-смуга `h150`, radius `22` (cover-пресет автора; дефолт violet→cyan `#7b5cff → #3dcbff`).
2. **`profhead`** (`display:flex; align-items:flex-end; gap:22px; margin-top:-56px`) — три елементи в одному ряду, вирівняні по низу:
   - **аватар** — `128×128`, **rounded-square** radius `30`, бордер `4px solid var(--background)`, заходить у банер (через `margin-top` хедера), `flex:none`; фолбек — градієнт / ініціали;
   - **`profname`** (`flex:1`) — лише Anton-імʼя (`clamp(1.9→2.6rem)/.95`, uppercase) + `@handle` (Space Mono, muted); блок трохи зсунутий вниз (`transform:translateY(8px)`), щоб базова лінія імені сиділа майже на низі аватара, а не злітала в банер;
   - **`profactions`** (`flex:none`, у правий край) — acid **Follow** (UserPlus) + outline icon-кнопка **Edit** (SquarePen).
3. Під хедером, на всю ширину, окремими рядками: **`statline`** (hosting / followers / going; числа — Space Mono) і **`profbio`** (Inter, `max-62ch`).

Далі `tabs` (Articles / Hosting / Going, acid-індикатор знизу) → `grid` карток-статей; кожна має eyebrow «↳ <Event title>» (acid) і лінкує на свій івент.
**Ключове:** ім'я — коротким блоком **поряд** з аватаром (тільки name+handle), а стати/біо виносимо окремим рядком нижче — інакше високий Anton штовхається в банер. Mobile — `profhead` `flex-wrap`, `profactions` на всю ширину під низ.

### Допоміжні
Avatar — два формати: **круглі** малі (stack/host, 32–40px, radius full, ініціали, бордер кольору картки) і **великий профільний** (128px, rounded-square radius 30). Input/Textarea/`inrow`/Combobox/Stepper · Toast (success/destructive) · Skeleton (`elevated` + shimmer) · EmptyState · ConfirmDialog.

---

## 9. Підключення (shadcn + Tailwind v4)
1. `next/font` → Anton + Inter + Space Mono (`--font-anton/inter/space-mono`).
2. Токени §3 у `globals.css`; `logo.svg` + `grain.svg` → `public/`.
3. `pnpm --filter @events/web add lucide-react`.
4. `npx shadcn@latest init` (CSS-variables) + `add button card dialog badge avatar tabs sonner skeleton input textarea`.
5. Signal-компоненти (CapacityMeter, RatingStars, StatusBadge, AttendeeStack, Ticket, EventCard poster) поверх примітивів.
6. Сторінка `/_design` — живий styleguide (= `mockup.html`).

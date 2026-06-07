# Design Research: Events platform (web, event-first)

> Дослідження під ваш Next.js-додаток (список івентів → деталь+реєстрація гостя/юзера → статті+коментарі → профілі). Повний дизайн-фреймворк з токенами — у сусідньому файлі **[design-framework.md](design-framework.md)**.

## TL;DR
Найкращі event-продукти (Luma, Partiful, Eventbrite) роблять **обкладинку івента героєм сторінки**, а весь хром тримають нейтральним і тихим. Беремо цю модель: чистий нейтральний UI + один впевнений акцентний колір для **Register**, а колір на екран приносять самі івенти. Реєстрацію виносимо в **липку панель** (десктоп — збоку, мобайл — знизу), з тогглом «гість ↔ увійти», бо у вас гостьова реєстрація — ключова фіча.

## Recommendations / Next Steps

### 1. Event detail = «обкладинка-герой + липка панель реєстрації»
Luma і Partiful будують сторінку навколо великого cover-зображення; ключові дії (Register/RSVP) завжди в полі зору — на десктопі праворуч окремою карткою, на мобайлі — у нижньому action-sheet. Це прямо лягає на ваш `WP-3`.

```
DESKTOP /events/[id]                          MOBILE
┌───────────────────────────┬────────────┐   ┌──────────────────┐
│  ┌─────────────────────┐  │ ┌────────┐ │   │  ┌────────────┐  │
│  │   COVER  (16:9)     │  │ │ Aug 15 │ │   │  │   COVER    │  │
│  └─────────────────────┘  │ │ 18:00  │ │   │  └────────────┘  │
│  Title · ★4.8             │ │ 📍Kyiv │ │   │  Title  ★4.8     │
│  by Host · [Upcoming]     │ │────────│ │   │  📅 Aug 15 · Kyiv │
│  ──tags──                 │ │ 42/100 │ │   │  ──tags──         │
│                           │ │ ▓▓▓▓░░ │ │   │  About…           │
│  About the event…         │ │        │ │   │  Articles (3) ▸   │
│                           │ │[Register]│ │  └──────────────────┘
│  ## Articles (3)          │ └────────┘ │   ┌──────────────────┐
│  ▸ card ▸ card ▸ card     │  (sticky)  │   │ 42/100 [Register]│ ← sticky
└───────────────────────────┴────────────┘   └──────────────────┘
```

### 2. Register-модалка з тогглом «Гість / Увійти»
Ваша killer-фіча — реєстрація без акаунта. Зробіть її явним вибором у модалці: один сегмент-перемикач, гостю — `name`+`email`+`additionalInfo`, юзеру — лише `additionalInfo`. Apple Invites / 222 показують RSVP як bottom-sheet з мінімумом полів — копіюємо лаконічність.

```
┌─────────────── Register ───────────────┐
│  ( Guest ) ( Sign in )   ← segmented    │
│  Name      [____________________]       │
│  Email     [____________________]       │
│  Note      [____________________]       │
│  42 of 100 spots left                   │
│            [   Confirm RSVP   ]         │
└─────────────────────────────────────────┘
```

### 3. Events list = грід обкладинок + фільтр-бар зверху
Eventbrite/Figma/Userlane: великі карткові обкладинки, метадані під ними (дата · локація · X записалось), теги-чіпи, badge upcoming/past. Фільтри (tag, location, пошук) — горизонтальним баром зверху; вертикальний sidebar (GitHub) лишаємо опційно для десктопу.

```
┌──────────────────────────────────────────────┐
│ [🔍 search] [Tag ▾] [Location ▾]   42 events │
├──────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ │  cover  │ │  cover  │ │  cover  │          │
│ ├─────────┤ ├─────────┤ ├─────────┤          │
│ │Title    │ │Title    │ │Title    │          │
│ │📅·📍·★  │ │📅·📍·★  │ │📅·📍·★  │          │
│ │42/100   │ │ FULL    │ │ 7/20    │          │
│ └─────────┘ └─────────┘ └─────────┘          │
└──────────────────────────────────────────────┘
```

### 4. «Capacity» та «status» — окремі візуальні токени
`registeredCount/maxGuests`, `rating`, upcoming/past/full — це сигнали, які варто кодувати кольором і компонентами (CapacityMeter, StatusBadge, RatingStars), а не сірим текстом. Деталі — у фреймворку.

### 5. Нейтральний хром + один акцент (не строкатий UI)
Luma підкреслює: «keep it minimal, leave breathing room». Тримаємо палітру стриманою (slate-нейтралі), кольори дають обкладинки. Один primary (indigo/violet) для дій, amber для зірок рейтингу.

## Key Examples

![Luma event detail](references/luma-event-detail.png)
*Luma — деталь івента: title/host/date, велика кнопка **Register** в окремій секції, side-panel хоста (contact/report); чисто й тихо [Lazyweb]*

![Luma event detail (mobile)](references/luma-event-detail-mobile.png)
*Luma mobile — постер + Register/Contact host; локація **прихована до реєстрації** (приємний privacy-патерн), нижній таб-бар Home/Discover/Chat [Lazyweb]*

![Partiful discovery](references/partiful-discovery.png)
*Partiful — discovery-стрічка івентів, згрупована по містах; крупні обкладинки, мінімум хрому [Lazyweb]*

![Partiful event detail (mobile)](references/partiful-event-detail-mobile.png)
*Partiful mobile — великий флаєр-cover як герой + bottom action-sheet («Collect RSVPs», «Send digital cards») картками з chevron [Lazyweb]*

![Eventbrite discovery](references/eventbrite-discovery.png)
*Eventbrite — hero + великий пошук, далі секції (Popular, This Weekend, Music…) гридами карток з thumbnail/дата/локація/теги [Lazyweb]*

![Figma events](references/figma-events.png)
*Figma — hero з CTA, список «Upcoming events» (title/desc/date/tags), нижче фільтрований грід on-demand сесій; еталон чистого modern-UI [Lazyweb]*

![Userlane events hub](references/userlane-events-hub.png)
*Userlane — дашборд івентів: грід upcoming, нижче past, і CTA-секція «Create Event»; добрий патерн для вашого `/me` [Lazyweb]*

![GitHub events filters](references/github-events-filters.png)
*GitHub — sidebar-фільтри (формат/тип/тема, clear/apply) + featured-картка; патерн для розширених фільтрів на десктопі [Lazyweb]*

![Apple Invites cards](references/apple-invites-cards.png)
*Apple Invites — інвайт-картки з title/date/location та **стеком аватарів учасників зі статус-бейджами**; модель для AttendeeStack [Lazyweb]*

![222 event RSVP](references/222-event-detail-rsvp.png)
*222 — деталь події з expandable-секціями та bottom-sheet RSVP (Yes/No); мінімалістична відповідь у один тап [Lazyweb]*

## Patterns (table stakes)
- **Cover-обкладинка як герой** сторінки/картки; метадані — компактним рядком під нею.
- **Дата/час/локація** завжди разом, біля заголовка; іконки 📅 📍 ⏰.
- **Постійно видима головна дія** (Register/RSVP): sticky збоку (desktop) / знизу (mobile).
- **Статус-бейджі**: upcoming / past / full / sold-out — кольоровим чіпом.
- **Соц-докази**: стек аватарів + «X going», host-блок.
- **Теги-чіпи** для категорій, клікабельні → фільтр.
- **Light/dark**; нейтральний хром, акцент лише на діях.

## Anti-Patterns (чого уникати)
- **Строкатий хром**: кілька яскравих кольорів у самому UI б'ються з різнобарвними обкладинками. Один акцент.
- **Реєстрація-«стіна»**: довгі форми вбивають гостьовий флоу. Гостю — максимум 2-3 поля.
- **Дата сірим дрібним текстом** серед іншого тексту — головний сигнал має бути помітним (mono/вага).
- **Ховати кнопку реєстрації під фолд** на мобайлі — завжди sticky-bar.
- **Залежність від кольору** для статусу без тексту/іконки (a11y).

## Unique Angles (X100-деталі)
- **Luma**: локація **прихована до реєстрації** — інтрига + privacy. Легко лягає на ваш `registered`-стан (B3).
- **Partiful**: cover-флаєр на майже весь екран + контекстні дії картками в action-sheet — івент відчувається «постером», а не формою.
- **Apple Invites**: статус-бейджі прямо на аватарах учасників (going / maybe) — щільний соц-сигнал без таблиць.

## Findings
Корпус сильний саме для event-домену (Luma/Partiful/Eventbrite/Figma — matchCount 2-3/3, similarity 0.60-0.68). Спільний знаменник топ-продуктів: **контент-форвардний, тихий інтерфейс**, де візуальну насиченість дають користувацькі обкладинки, а система лишається нейтральною й передбачуваною. Це ідеально підходить вашому стеку (Tailwind v4 + shadcn): нейтральна токен-база, один primary, семантичні кольори, і компоненти-сигнали (capacity/rating/status). Web-джерела підтверджують: «усі деталі в одному екрані», мапа/календар, рейтинги, bold-контраст на CTA, обовʼязково responsive.

Готовий дизайн-фреймворк (палітра light/dark у CSS-змінних + `@theme` для Tailwind v4, типографіка, spacing/radius/shadow, специфікації компонентів) — у файлі **design-framework.md** поряд.

## Sources
- [Luma — Event Themes & Customization](https://help.luma.com/p/event-themes-and-customization)
- [Luma — Event Cover Images](https://help.luma.com/p/event-cover-images)
- [Party.pro — Luma tips (aesthetic/clean)](https://party.pro/luma/)
- [Tubik — UI for Event App (case study)](https://blog.tubikstudio.com/case-study-night-in-berlin-ui-for-event-app/)
- [Subframe — 25 Event Booking Website Design Examples](https://www.subframe.com/tips/event-booking-website-design-examples)
- [EventMobi — Best Practices for Event App Design](https://www.eventmobi.com/blog/best-practices-for-event-app-design/)
- Lazyweb screenshots (cited inline): Luma, Partiful, Eventbrite, Figma, Userlane, GitHub, Apple Invites, 222.

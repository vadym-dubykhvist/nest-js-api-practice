/**
 * Domain types for the Events API frontend.
 *
 * Single source of truth mirroring the NestJS API responses/requests.
 * Conventions:
 *  - All responses are wrapped in an envelope ({ event }, { events, eventsCount }, ...).
 *  - All write payloads are wrapped too ({ event }, { article }, { rating: { score } }, ...).
 *  - Auth header is `Authorization: Token <jwt>` (NOT Bearer).
 *  - Dates are ISO 8601 strings over the wire.
 */

// ---------------------------------------------------------------------------
// Users / auth / profiles
// ---------------------------------------------------------------------------

/** Authenticated user — `token` is present on auth responses and GET /user. */
export interface User {
  id: number;
  email: string;
  username: string;
  bio: string;
  image: string;
  token: string;
}

/** Public author shape embedded in events/articles (no token, no password). */
export interface Author {
  id: number;
  username: string;
  email: string;
  bio: string;
  image: string;
}

export interface Profile {
  username: string;
  bio: string;
  image: string;
  following: boolean;
  followersCount: number;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  image: string;
  tags: string[];
  registeredCount: number;
  /** 0 means unlimited. */
  maxGuests: number;
  /** Average rating, 0..5. */
  rating: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
  /** Total number of ratings. Only on the single-event endpoint. */
  ratingsCount?: number;
  /** Whether the current user is registered. Only on the single-event endpoint. */
  registered?: boolean;
  /** The current user's own rating (null if not rated). Only on the single-event endpoint. */
  myRating?: number | null;
}

export interface Registration {
  id: number;
  email: string;
  name: string;
  additionalInfo: string | null;
  createdAt: string;
  user?: Author | null;
  event?: Event;
}

// ---------------------------------------------------------------------------
// Articles (a post that belongs to an event) and comments
// ---------------------------------------------------------------------------

/** Lightweight event reference returned alongside an article. */
export interface ArticleEventRef {
  id: number;
  title: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  description: string;
  body: string;
  tagList: string[];
  favoritesCount: number;
  commentsCount?: number;
  favorited?: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
  event?: ArticleEventRef | null;
}

export interface Comment {
  id: number;
  body: string;
  likesCount: number;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
  author: Pick<Author, 'username' | 'bio' | 'image'>;
  replies: Comment[];
}

// ---------------------------------------------------------------------------
// Response envelopes
// ---------------------------------------------------------------------------

export interface UserResponse {
  user: User;
}
export interface ProfileResponse {
  profile: Profile;
}
export interface EventResponse {
  event: Event;
}
export interface EventsResponse {
  events: Event[];
  eventsCount: number;
}
export interface RegistrationResponse {
  registration: Registration;
}
export interface ArticleResponse {
  article: Article;
}
export interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}
export interface CommentResponse {
  comment: Comment;
}
export interface CommentsResponse {
  comments: Comment[];
}
export interface TagsResponse {
  tags: string[];
}

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------

export interface EventsQuery {
  tag?: string;
  location?: string;
  author?: string;
  /** Username whose registered ("going") events to return. */
  attending?: string;
  /** Free-text search over title + description. */
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ArticlesQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  event?: number;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Write payloads (the inner objects; the client wraps them in envelopes)
// ---------------------------------------------------------------------------

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}
export interface LoginUserInput {
  email: string;
  password: string;
}
export interface UpdateUserInput {
  email: string;
  bio?: string;
  image?: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  image?: string;
  tags?: string[];
  maxGuests?: number;
}
export type UpdateEventInput = Partial<CreateEventInput>;

export interface RegisterEventInput {
  /** Required for anonymous (guest) registration; ignored when authenticated. */
  email?: string;
  /** Required for anonymous (guest) registration; ignored when authenticated. */
  name?: string;
  additionalInfo?: string;
}

export interface RateEventInput {
  /** 1..5 */
  score: number;
}

export interface CreateArticleInput {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
  eventId?: number;
}
export interface UpdateArticleInput {
  title?: string;
  description?: string;
  body?: string;
  eventId?: number | null;
}

export interface CreateCommentInput {
  body: string;
  parentId?: number;
}
export interface UpdateCommentInput {
  body: string;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Validation/error envelope ({ errors: { field: [messages] } }). */
export interface ApiErrorResponse {
  errors: Record<string, string[]>;
}

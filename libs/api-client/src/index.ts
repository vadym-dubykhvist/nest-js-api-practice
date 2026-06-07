/**
 * Typed client for the Events API.
 *
 * - Auth header is `Authorization: Token <jwt>` (not Bearer).
 * - Requests/responses use the API's envelope convention.
 * - Base URL resolves automatically:
 *     server (SSR)  -> process.env.API_URL + /api   (direct, in-cluster DNS)
 *     browser       -> /api                          (same-origin, proxied by Next)
 *   Override per call via opts.baseUrl.
 */
import type {
  ArticleResponse,
  ArticlesQuery,
  ArticlesResponse,
  CommentResponse,
  CommentsResponse,
  CreateArticleInput,
  CreateCommentInput,
  CreateEventInput,
  CreateUserInput,
  EventResponse,
  EventsQuery,
  EventsResponse,
  LoginUserInput,
  ProfileResponse,
  RateEventInput,
  RegisterEventInput,
  RegistrationResponse,
  TagsResponse,
  UpdateArticleInput,
  UpdateCommentInput,
  UpdateEventInput,
  UpdateUserInput,
  UserResponse,
} from '@events/shared-types';

export interface RequestOptions {
  token?: string | null;
  baseUrl?: string;
  signal?: AbortSignal;
}

/** Thrown for any non-2xx response. `errors` carries the API's 422 field map. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function resolveBaseUrl(opts?: RequestOptions): string {
  if (opts?.baseUrl) return opts.baseUrl;
  if (typeof window === 'undefined') {
    const root = process.env.API_URL ?? 'http://localhost:3000';
    return `${root.replace(/\/$/, '')}/api`;
  }
  return '/api';
}

function toQueryString(query?: object): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

interface CallConfig {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  query?: object;
  body?: unknown;
}

async function request<T>(config: CallConfig, opts?: RequestOptions): Promise<T> {
  const url = resolveBaseUrl(opts) + config.path + toQueryString(config.query);

  const headers: Record<string, string> = {};
  if (config.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts?.token) headers['Authorization'] = `Token ${opts.token}`;

  const res = await fetch(url, {
    method: config.method,
    headers,
    body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
    signal: opts?.signal,
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const errors =
      data && typeof data === 'object' && 'errors' in data
        ? (data as { errors: Record<string, string[]> }).errors
        : undefined;
    throw new ApiError(res.status, `API request failed with ${res.status}`, errors);
  }

  return data as T;
}

export const api = {
  auth: {
    register: (input: CreateUserInput, opts?: RequestOptions) =>
      request<UserResponse>({ method: 'POST', path: '/users', body: { user: input } }, opts),
    login: (input: LoginUserInput, opts?: RequestOptions) =>
      request<UserResponse>(
        { method: 'POST', path: '/users/login', body: { user: input } },
        opts,
      ),
    me: (opts?: RequestOptions) =>
      request<UserResponse>({ method: 'GET', path: '/user' }, opts),
    update: (input: UpdateUserInput, opts?: RequestOptions) =>
      request<UserResponse>({ method: 'PATCH', path: '/user', body: { user: input } }, opts),
  },

  events: {
    list: (query?: EventsQuery, opts?: RequestOptions) =>
      request<EventsResponse>({ method: 'GET', path: '/events', query }, opts),
    get: (id: number, opts?: RequestOptions) =>
      request<EventResponse>({ method: 'GET', path: `/events/${id}` }, opts),
    create: (input: CreateEventInput, opts?: RequestOptions) =>
      request<EventResponse>({ method: 'POST', path: '/events', body: { event: input } }, opts),
    update: (id: number, input: UpdateEventInput, opts?: RequestOptions) =>
      request<EventResponse>(
        { method: 'PATCH', path: `/events/${id}`, body: { event: input } },
        opts,
      ),
    remove: (id: number, opts?: RequestOptions) =>
      request<void>({ method: 'DELETE', path: `/events/${id}` }, opts),
    register: (id: number, input: RegisterEventInput, opts?: RequestOptions) =>
      request<RegistrationResponse>(
        { method: 'POST', path: `/events/${id}/register`, body: { registration: input } },
        opts,
      ),
    cancelRegistration: (id: number, opts?: RequestOptions) =>
      request<void>({ method: 'DELETE', path: `/events/${id}/register` }, opts),
    rate: (id: number, input: RateEventInput, opts?: RequestOptions) =>
      request<EventResponse>(
        { method: 'POST', path: `/events/${id}/rating`, body: { rating: input } },
        opts,
      ),
    updateRating: (id: number, input: RateEventInput, opts?: RequestOptions) =>
      request<EventResponse>(
        { method: 'PATCH', path: `/events/${id}/rating`, body: { rating: input } },
        opts,
      ),
    removeRating: (id: number, opts?: RequestOptions) =>
      request<EventResponse>({ method: 'DELETE', path: `/events/${id}/rating` }, opts),
  },

  articles: {
    list: (query?: ArticlesQuery, opts?: RequestOptions) =>
      request<ArticlesResponse>({ method: 'GET', path: '/articles', query }, opts),
    feed: (query?: { limit?: number; offset?: number }, opts?: RequestOptions) =>
      request<ArticlesResponse>({ method: 'GET', path: '/articles/feed', query }, opts),
    get: (slug: string, opts?: RequestOptions) =>
      request<ArticleResponse>({ method: 'GET', path: `/articles/${slug}` }, opts),
    create: (input: CreateArticleInput, opts?: RequestOptions) =>
      request<ArticleResponse>(
        { method: 'POST', path: '/articles', body: { article: input } },
        opts,
      ),
    update: (slug: string, input: UpdateArticleInput, opts?: RequestOptions) =>
      request<ArticleResponse>(
        { method: 'PATCH', path: `/articles/${slug}`, body: { article: input } },
        opts,
      ),
    remove: (slug: string, opts?: RequestOptions) =>
      request<void>({ method: 'DELETE', path: `/articles/${slug}` }, opts),
    favorite: (slug: string, opts?: RequestOptions) =>
      request<ArticleResponse>({ method: 'POST', path: `/articles/${slug}/favorite` }, opts),
    unfavorite: (slug: string, opts?: RequestOptions) =>
      request<ArticleResponse>({ method: 'DELETE', path: `/articles/${slug}/favorite` }, opts),
  },

  comments: {
    list: (slug: string, opts?: RequestOptions) =>
      request<CommentsResponse>({ method: 'GET', path: `/articles/${slug}/comments` }, opts),
    create: (slug: string, input: CreateCommentInput, opts?: RequestOptions) =>
      request<CommentResponse>(
        { method: 'POST', path: `/articles/${slug}/comments`, body: { comment: input } },
        opts,
      ),
    update: (slug: string, id: number, input: UpdateCommentInput, opts?: RequestOptions) =>
      request<CommentResponse>(
        { method: 'PATCH', path: `/articles/${slug}/comments/${id}`, body: { comment: input } },
        opts,
      ),
    remove: (slug: string, id: number, opts?: RequestOptions) =>
      request<void>({ method: 'DELETE', path: `/articles/${slug}/comments/${id}` }, opts),
    like: (id: number, opts?: RequestOptions) =>
      request<CommentResponse>({ method: 'POST', path: `/comments/${id}/like` }, opts),
    unlike: (id: number, opts?: RequestOptions) =>
      request<CommentResponse>({ method: 'DELETE', path: `/comments/${id}/like` }, opts),
  },

  profiles: {
    get: (username: string, opts?: RequestOptions) =>
      request<ProfileResponse>({ method: 'GET', path: `/profiles/${username}` }, opts),
    follow: (username: string, opts?: RequestOptions) =>
      request<ProfileResponse>({ method: 'POST', path: `/profiles/${username}/follow` }, opts),
    unfollow: (username: string, opts?: RequestOptions) =>
      request<ProfileResponse>({ method: 'DELETE', path: `/profiles/${username}/follow` }, opts),
  },

  tags: {
    list: (opts?: RequestOptions) =>
      request<TagsResponse>({ method: 'GET', path: '/tags' }, opts),
  },
};

export type ApiClient = typeof api;

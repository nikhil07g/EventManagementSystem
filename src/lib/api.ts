/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Frontend API client for communicating with the Express backend.
 * Provides typed helpers for events, bookings, authentication, and health checks.
 */

export type EventType = 'Movie' | 'Sports' | 'Concert' | 'Family';
export type EventStatus = 'draft' | 'active' | 'cancelled' | 'archived';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  category: string;
  date: string;
  time: string;
  venue: string;
  ticketPrice: number;
  capacity: number;
  description?: string;
  image?: string;
  status: EventStatus;
  ticketsSold?: number;
  ticketsAvailable?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  eventId: string;
  userId?: string;
  seats: string[];
  quantity: number;
  pricePerSeat: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  status: 'confirmed' | 'cancelled';
  bookedAt: string;
  createdAt?: string;
  updatedAt?: string;
  userName?: string;
  userEmail?: string;
  notes?: string | null;
  event?: Event;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'organizer' | 'admin';
  avatar?: string | null;
  googleId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'organizer' | 'admin';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateEventPayload {
  name: string;
  type: EventType;
  category: string;
  date: string;
  time: string;
  venue: string;
  ticketPrice: number;
  capacity: number;
  description?: string;
  image?: string;
  status?: EventStatus;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {}

export interface BookingPayload {
  eventId: string;
  quantity: number;
  seats?: string[];
  paymentMethod?: string;
  notes?: string;
}

export interface EventFilters {
  type?: EventType;
  status?: EventStatus;
  category?: string;
  search?: string;
  from?: string;
  to?: string;
}

const trimTrailingSlash = (value: string) => value.replace(/\/?$/, '');

const resolveApiBaseUrl = (): string => {
  // Check for environment variable first (for production)
  const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  if (envBase && typeof envBase === 'string') {
    return trimTrailingSlash(envBase.trim());
  }

  // Fallback for local development
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Use http for localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000/api';
    }
    // For deployed frontend, use https with /api path (assumes backend on same domain)
    return `${protocol}//${hostname}/api`;
  }

  return 'http://localhost:4000/api';
};

const normaliseEvent = (raw: any): Event => ({
  id: String(raw?.id ?? raw?._id ?? ''),
  name: String(raw?.name ?? ''),
  type: raw?.type as EventType,
  category: String(raw?.category ?? ''),
  date: typeof raw?.date === 'string' ? raw.date : new Date(raw?.date ?? Date.now()).toISOString(),
  time: String(raw?.time ?? ''),
  venue: String(raw?.venue ?? ''),
  ticketPrice: Number(raw?.ticketPrice ?? 0),
  capacity: Number(raw?.capacity ?? 0),
  description: raw?.description ?? undefined,
  image: raw?.image ?? undefined,
  status: (raw?.status as EventStatus) ?? 'draft',
  ticketsSold: typeof raw?.ticketsSold === 'number' ? raw.ticketsSold : undefined,
  ticketsAvailable: typeof raw?.ticketsAvailable === 'number' ? raw.ticketsAvailable : undefined,
  createdAt: raw?.createdAt,
  updatedAt: raw?.updatedAt,
});

const normaliseBooking = (raw: any): Booking => ({
  id: String(raw?.id ?? raw?._id ?? ''),
  eventId: String(raw?.eventId?._id ?? raw?.event?.id ?? raw?.eventId ?? ''),
  userId: raw?.userId ? String(raw.userId) : undefined,
  seats: Array.isArray(raw?.seats) ? raw.seats.map((seat: any) => String(seat)) : [],
  quantity: Number(raw?.quantity ?? 0),
  pricePerSeat: Number(raw?.pricePerSeat ?? 0),
  totalPrice: Number(raw?.totalPrice ?? 0),
  paymentMethod: String(raw?.paymentMethod ?? ''),
  paymentStatus: String(raw?.paymentStatus ?? 'paid'),
  status: (raw?.status as Booking['status']) ?? 'confirmed',
  bookedAt: typeof raw?.bookedAt === 'string' ? raw.bookedAt : raw?.createdAt,
  createdAt: raw?.createdAt,
  updatedAt: raw?.updatedAt,
  userName: raw?.userName ?? undefined,
  userEmail: raw?.userEmail ?? undefined,
  notes: raw?.notes ?? undefined,
  event: raw?.eventId || raw?.event ? normaliseEvent(raw.eventId || raw.event) : undefined,
});

export class ApiError extends Error {
  status: number;
  errors?: Record<string, unknown> | undefined;

  constructor(message: string, status = 500, errors?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = resolveApiBaseUrl()) {
    this.baseUrl = trimTrailingSlash(baseUrl);
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const normalisedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalisedPath}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        url.searchParams.set(key, String(value));
      });
    }

    return url.toString();
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal, query } = options;
    const url = this.buildUrl(path, query);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
  body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });

      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get('content-type') ?? '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok || (isJson && payload?.success === false)) {
        const message = (isJson ? payload?.message : payload) || `Request failed with status ${response.status}`;
        const errors = isJson ? payload?.errors : undefined;
        throw new ApiError(String(message), response.status, errors);
      }

      const data = isJson ? payload?.data ?? payload : (payload as T);
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Network error';
      throw new ApiError(message, 0);
    }
  }

  readonly events = {
    list: async (filters?: EventFilters): Promise<Event[]> => {
      const query = filters
        ? (Object.entries(filters).reduce<Record<string, string | number | boolean | undefined>>(
            (acc, [key, value]) => {
              acc[key] = value as string | number | boolean | undefined;
              return acc;
            },
            {}
          ))
        : undefined;

      const data = await this.request<Event[]>('/events', { query });
      return Array.isArray(data) ? data.map(normaliseEvent) : [];
    },
    get: async (id: string): Promise<Event> => {
      const data = await this.request<Event>(`/events/${id}`);
      return normaliseEvent(data);
    },
    create: async (payload: CreateEventPayload, token: string): Promise<Event> => {
      const data = await this.request<Event>('/events', {
        method: 'POST',
        body: payload,
        token,
      });
      return normaliseEvent(data);
    },
    update: async (id: string, payload: UpdateEventPayload, token: string): Promise<Event> => {
      const data = await this.request<Event>(`/events/${id}`, {
        method: 'PUT',
        body: payload,
        token,
      });
      return normaliseEvent(data);
    },
    remove: async (id: string, token: string): Promise<void> => {
      await this.request<void>(`/events/${id}`, {
        method: 'DELETE',
        token,
      });
    },
  } as const;

  readonly bookings = {
    list: async (token: string): Promise<Booking[]> => {
      const data = await this.request<Booking[]>('/bookings', { token });
      return Array.isArray(data) ? data.map(normaliseBooking) : [];
    },
    get: async (id: string, token: string): Promise<Booking> => {
      const data = await this.request<Booking>(`/bookings/${id}`, { token });
      return normaliseBooking(data);
    },
    create: async (payload: BookingPayload, token: string): Promise<Booking> => {
      const data = await this.request<Booking>('/bookings', {
        method: 'POST',
        body: payload,
        token,
      });
      return normaliseBooking(data);
    },
  } as const;

  readonly auth = {
    register: async (payload: RegisterPayload): Promise<AuthResponse> => {
      const data = await this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: payload,
      });
      return data;
    },
    login: async (payload: LoginPayload): Promise<AuthResponse> => {
      const data = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: payload,
      });
      return data;
    },
    google: async (credential: string, role: RegisterPayload['role'] = 'user'): Promise<AuthResponse> => {
      const data = await this.request<AuthResponse>('/auth/google', {
        method: 'POST',
        body: { credential, role },
      });
      return data;
    },
    verify: async (token: string): Promise<{ user: UserProfile }> => {
      return this.request<{ user: UserProfile }>('/auth/verify', { token });
    },
    me: async (token: string): Promise<{ user: UserProfile }> => {
      return this.request<{ user: UserProfile }>('/auth/me', { token });
    },
  } as const;

  readonly health = async (): Promise<{ status: string; message?: string }> => {
    return this.request<{ status: string; message?: string }>('/health');
  };
}

export const api = new ApiClient();
export default api;

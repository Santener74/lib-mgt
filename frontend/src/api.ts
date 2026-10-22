import type {
  Book,
  BookInput,
  BulkTagInput,
  BulkTagResult,
  DashboardStats,
  Loan,
  LoanInput,
  LoanStatus,
  Member,
  MemberInput,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('/api') ? path : `/api${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : String(body.message);
      }
    } catch {
      // non-JSON error body: keep the status text
    }
    throw new ApiError(message, res.status);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const api = {
  getDashboard: () => request<DashboardStats>('/dashboard'),

  getBooks: (search?: string) => request<Book[]>(`/books${query({ search })}`),
  createBook: (input: BookInput) => request<Book>('/books', json('POST', input)),
  updateBook: (id: number, input: Partial<BookInput>) => request<Book>(`/books/${id}`, json('PATCH', input)),
  deleteBook: (id: number) => request<void>(`/books/${id}`, { method: 'DELETE' }),

  getMembers: (search?: string) => request<Member[]>(`/members${query({ search })}`),
  createMember: (input: MemberInput) => request<Member>('/members', json('POST', input)),
  updateMember: (id: number, input: Partial<MemberInput>) =>
    request<Member>(`/members/${id}`, json('PATCH', input)),
  deleteMember: (id: number) => request<void>(`/members/${id}`, { method: 'DELETE' }),
  bulkUpdateMemberTags: (input: BulkTagInput) =>
    request<BulkTagResult>('/v1/members/bulk-tag', json('POST', input)),
  bulkUpdateTags: (input: BulkTagInput) =>
    request<BulkTagResult>('/v1/members/bulk-tag', json('POST', input)),

  getLoans: (status?: LoanStatus) => request<Loan[]>(`/loans${query({ status })}`),
  borrowBook: (input: LoanInput) => request<Loan>('/loans', json('POST', input)),
  returnLoan: (id: number) => request<Loan>(`/loans/${id}/return`, { method: 'PATCH' }),
};

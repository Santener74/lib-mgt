import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './api';

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('api client', () => {
  it('builds search query strings', async () => {
    const fetchMock = mockFetch(200, []);
    await api.getBooks('harry potter');
    expect(fetchMock).toHaveBeenCalledWith('/api/books?search=harry+potter', expect.any(Object));
  });

  it('omits empty query params', async () => {
    const fetchMock = mockFetch(200, []);
    await api.getLoans();
    expect(fetchMock).toHaveBeenCalledWith('/api/loans', expect.any(Object));
  });

  it('sends JSON bodies for mutations', async () => {
    const fetchMock = mockFetch(201, { id: 1 });
    await api.borrowBook({ bookId: 2, memberId: 3, loanDays: 7 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/loans');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ bookId: 2, memberId: 3, loanDays: 7 });
  });

  it('handles 204 No Content', async () => {
    mockFetch(204);
    await expect(api.deleteBook(1)).resolves.toBeUndefined();
  });

  it('throws ApiError with the server message', async () => {
    mockFetch(400, { message: ['title should not be empty', 'isbn must be longer'] });
    const error = await api.createBook({} as never).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('title should not be empty, isbn must be longer');
  });
});

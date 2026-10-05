import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { sampleBooks } from '../src/database/sample-data';

describe('Library API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register({ dbPath: ':memory:', serveFrontend: false, autoSeed: true })],
    }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());

  it('GET /api/books returns the seeded catalogue', async () => {
    const res = await http().get('/api/books').expect(200);
    expect(res.body).toHaveLength(sampleBooks.length);
  });

  it('GET /api/books?search= filters results', async () => {
    const res = await http().get('/api/books').query({ search: 'orwell' }).expect(200);
    expect(res.body.map((b: { title: string }) => b.title)).toEqual(['1984']);
  });

  it('POST /api/books validates the payload', async () => {
    const res = await http().post('/api/books').send({ title: '', totalCopies: 0 }).expect(400);
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('runs a full create → borrow → return → delete flow', async () => {
    const book = (
      await http()
        .post('/api/books')
        .send({ title: 'Refactoring', author: 'Martin Fowler', isbn: '9780134757599', category: 'Technology', totalCopies: 1 })
        .expect(201)
    ).body;
    expect(book.availableCopies).toBe(1);

    const member = (
      await http().post('/api/members').send({ name: 'Test Reader', email: 'reader@example.com' }).expect(201)
    ).body;

    const loan = (await http().post('/api/loans').send({ bookId: book.id, memberId: member.id }).expect(201)).body;
    expect(loan.status).toBe('active');
    expect(loan.book.id).toBe(book.id);

    await http().get(`/api/books/${book.id}`).expect(200).expect((res) => expect(res.body.availableCopies).toBe(0));
    await http().post('/api/loans').send({ bookId: book.id, memberId: member.id }).expect(400);
    await http().delete(`/api/books/${book.id}`).expect(400);

    const returned = (await http().patch(`/api/loans/${loan.id}/return`).expect(200)).body;
    expect(returned.status).toBe('returned');
    expect(returned.fine).toBe(0);

    await http().delete(`/api/books/${book.id}`).expect(204);
    await http().get(`/api/books/${book.id}`).expect(404);
  });

  it('GET /api/loans?status=overdue only returns overdue loans', async () => {
    const res = await http().get('/api/loans').query({ status: 'overdue' }).expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((l: { status: string }) => l.status === 'overdue')).toBe(true);
  });

  it('GET /api/loans rejects an invalid status', async () => {
    await http().get('/api/loans').query({ status: 'lost' }).expect(400);
  });

  it('GET /api/dashboard returns statistics', async () => {
    const res = await http().get('/api/dashboard').expect(200);
    expect(res.body).toMatchObject({ totalTitles: sampleBooks.length });
    expect(res.body.overdueLoans).toBeGreaterThan(0);
    expect(res.body.recentLoans).toHaveLength(5);
  });

  it('returns 404 for unknown resources', async () => {
    await http().get('/api/members/9999').expect(404);
    await http().patch('/api/loans/9999/return').expect(404);
  });
});

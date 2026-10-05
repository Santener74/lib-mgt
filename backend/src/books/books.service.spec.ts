import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { LoansService } from '../loans/loans.service';
import { MembersService } from '../members/members.service';
import { createTestingModule } from '../testing/test-db';
import { BooksService } from './books.service';

describe('BooksService', () => {
  let moduleRef: TestingModule;
  let books: BooksService;
  let members: MembersService;
  let loans: LoansService;

  const base = { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', totalCopies: 3 };

  beforeEach(async () => {
    moduleRef = await createTestingModule([BooksService, MembersService, LoansService]);
    books = moduleRef.get(BooksService);
    members = moduleRef.get(MembersService);
    loans = moduleRef.get(LoansService);
  });

  afterEach(() => moduleRef.close());

  it('creates a book with all copies available', async () => {
    const book = await books.create(base);
    expect(book.id).toBeDefined();
    expect(book.availableCopies).toBe(3);
    expect(book.category).toBe('General');
  });

  it('rejects a duplicate ISBN', async () => {
    await books.create(base);
    await expect(books.create({ ...base, title: 'Copy' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('searches by title, author, ISBN and category', async () => {
    await books.create(base);
    await books.create({ title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', category: 'Sci-Fi', totalCopies: 1 });

    expect((await books.findAll()).map((b) => b.title)).toEqual(['Clean Code', 'Dune']);
    expect((await books.findAll('herbert')).map((b) => b.title)).toEqual(['Dune']);
    expect((await books.findAll('0132350884')).map((b) => b.title)).toEqual(['Clean Code']);
    expect((await books.findAll('sci-fi')).map((b) => b.title)).toEqual(['Dune']);
    expect(await books.findAll('nothing-matches')).toEqual([]);
  });

  it('throws NotFound for an unknown id', async () => {
    await expect(books.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps available copies consistent when total copies change', async () => {
    const book = await books.create(base);
    const member = await members.create({ name: 'Ann', email: 'ann@example.com' });
    await loans.borrow({ bookId: book.id, memberId: member.id });

    const updated = await books.update(book.id, { totalCopies: 5 });
    expect(updated.totalCopies).toBe(5);
    expect(updated.availableCopies).toBe(4);
  });

  it('refuses to reduce total copies below the number on loan', async () => {
    const book = await books.create({ ...base, totalCopies: 1 });
    const member = await members.create({ name: 'Ann', email: 'ann@example.com' });
    await loans.borrow({ bookId: book.id, memberId: member.id });

    await expect(books.update(book.id, { totalCopies: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses to delete a book that is on loan, but allows it after return', async () => {
    const book = await books.create(base);
    const member = await members.create({ name: 'Ann', email: 'ann@example.com' });
    const loan = await loans.borrow({ bookId: book.id, memberId: member.id });

    await expect(books.remove(book.id)).rejects.toBeInstanceOf(BadRequestException);

    await loans.returnLoan(loan.id);
    await books.remove(book.id);
    await expect(books.findOne(book.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(await loans.findAll()).toEqual([]);
  });
});

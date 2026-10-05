import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { BooksService } from '../books/books.service';
import { Member } from '../members/member.entity';
import { MembersService } from '../members/members.service';
import { createTestingModule } from '../testing/test-db';
import { Loan } from './loan.entity';
import { DEFAULT_LOAN_DAYS, FINE_PER_DAY, MAX_ACTIVE_LOANS, addDays } from './loan.rules';
import { LoansService } from './loans.service';

describe('LoansService', () => {
  let moduleRef: TestingModule;
  let loans: LoansService;
  let books: BooksService;
  let members: MembersService;
  let loanRepo: Repository<Loan>;
  let book: Book;
  let member: Member;

  let isbnCounter = 1000000000;
  const newBook = (totalCopies = 2) =>
    books.create({ title: `Book ${isbnCounter}`, author: 'Author', isbn: String(isbnCounter++), totalCopies });

  beforeEach(async () => {
    moduleRef = await createTestingModule([BooksService, MembersService, LoansService]);
    loans = moduleRef.get(LoansService);
    books = moduleRef.get(BooksService);
    members = moduleRef.get(MembersService);
    loanRepo = moduleRef.get(getRepositoryToken(Loan));
    book = await newBook(2);
    member = await members.create({ name: 'Ann', email: 'ann@example.com' });
  });

  afterEach(() => moduleRef.close());

  it('borrows a book, decrements availability and sets the due date', async () => {
    const loan = await loans.borrow({ bookId: book.id, memberId: member.id });

    expect(loan.status).toBe('active');
    expect(loan.returnDate).toBeNull();
    const days = (loan.dueDate.getTime() - loan.loanDate.getTime()) / 86_400_000;
    expect(days).toBe(DEFAULT_LOAN_DAYS);
    expect((await books.findOne(book.id)).availableCopies).toBe(1);
  });

  it('honours a custom loan period', async () => {
    const loan = await loans.borrow({ bookId: book.id, memberId: member.id, loanDays: 7 });
    expect((loan.dueDate.getTime() - loan.loanDate.getTime()) / 86_400_000).toBe(7);
  });

  it('fails when no copies are available', async () => {
    const single = await newBook(1);
    const other = await members.create({ name: 'Bob', email: 'bob@example.com' });
    await loans.borrow({ bookId: single.id, memberId: member.id });

    await expect(loans.borrow({ bookId: single.id, memberId: other.id })).rejects.toThrow(/No copies/);
  });

  it('fails for unknown book or member', async () => {
    await expect(loans.borrow({ bookId: 999, memberId: member.id })).rejects.toBeInstanceOf(NotFoundException);
    await expect(loans.borrow({ bookId: book.id, memberId: 999 })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('fails for an inactive member', async () => {
    await members.update(member.id, { active: false });
    await expect(loans.borrow({ bookId: book.id, memberId: member.id })).rejects.toThrow(/inactive/);
  });

  it('prevents borrowing the same title twice at once', async () => {
    await loans.borrow({ bookId: book.id, memberId: member.id });
    await expect(loans.borrow({ bookId: book.id, memberId: member.id })).rejects.toThrow(/already has/);
  });

  it(`limits members to ${MAX_ACTIVE_LOANS} active loans`, async () => {
    for (let i = 0; i < MAX_ACTIVE_LOANS; i++) {
      await loans.borrow({ bookId: (await newBook()).id, memberId: member.id });
    }
    await expect(loans.borrow({ bookId: book.id, memberId: member.id })).rejects.toThrow(/limit/);
  });

  it('does not change availability when borrowing fails', async () => {
    await members.update(member.id, { active: false });
    await expect(loans.borrow({ bookId: book.id, memberId: member.id })).rejects.toBeInstanceOf(BadRequestException);
    expect((await books.findOne(book.id)).availableCopies).toBe(2);
  });

  it('returns a book on time with no fine', async () => {
    const loan = await loans.borrow({ bookId: book.id, memberId: member.id });
    const returned = await loans.returnLoan(loan.id);

    expect(returned.status).toBe('returned');
    expect(returned.returnDate).toBeInstanceOf(Date);
    expect(returned.fine).toBe(0);
    expect((await books.findOne(book.id)).availableCopies).toBe(2);
  });

  it('charges a fine for a late return', async () => {
    const loan = await loans.borrow({ bookId: book.id, memberId: member.id });
    await loanRepo.update(loan.id, { dueDate: addDays(new Date(), -3) });

    expect((await loans.findOne(loan.id)).status).toBe('overdue');
    const returned = await loans.returnLoan(loan.id);
    expect(returned.fine).toBe(3 * FINE_PER_DAY);
  });

  it('cannot return the same loan twice', async () => {
    const loan = await loans.borrow({ bookId: book.id, memberId: member.id });
    await loans.returnLoan(loan.id);
    await expect(loans.returnLoan(loan.id)).rejects.toThrow(/already been returned/);
    await expect(loans.returnLoan(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('filters loans by status and member', async () => {
    const other = await members.create({ name: 'Bob', email: 'bob@example.com' });
    const second = await newBook();
    const active = await loans.borrow({ bookId: book.id, memberId: member.id });
    const overdue = await loans.borrow({ bookId: second.id, memberId: member.id });
    const returned = await loans.borrow({ bookId: book.id, memberId: other.id });
    await loanRepo.update(overdue.id, { dueDate: addDays(new Date(), -1) });
    await loans.returnLoan(returned.id);

    const ids = async (query: Parameters<LoansService['findAll']>[0]) =>
      (await loans.findAll(query)).map((l) => l.id).sort();

    expect(await ids({})).toEqual([active.id, overdue.id, returned.id].sort());
    expect(await ids({ status: 'active' })).toEqual([active.id, overdue.id].sort());
    expect(await ids({ status: 'overdue' })).toEqual([overdue.id]);
    expect(await ids({ status: 'returned' })).toEqual([returned.id]);
    expect(await ids({ memberId: other.id })).toEqual([returned.id]);
  });
});

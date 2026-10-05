import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { BooksService } from '../books/books.service';
import { LoansService } from '../loans/loans.service';
import { createTestingModule } from '../testing/test-db';
import { MembersService } from './members.service';

describe('MembersService', () => {
  let moduleRef: TestingModule;
  let members: MembersService;
  let books: BooksService;
  let loans: LoansService;

  beforeEach(async () => {
    moduleRef = await createTestingModule([BooksService, MembersService, LoansService]);
    members = moduleRef.get(MembersService);
    books = moduleRef.get(BooksService);
    loans = moduleRef.get(LoansService);
  });

  afterEach(() => moduleRef.close());

  it('creates an active member and normalises the email', async () => {
    const member = await members.create({ name: 'Ann Lee', email: 'Ann.Lee@Example.com', phone: '123' });
    expect(member).toMatchObject({ name: 'Ann Lee', email: 'ann.lee@example.com', active: true });
  });

  it('rejects duplicate emails on create and update', async () => {
    await members.create({ name: 'Ann', email: 'ann@example.com' });
    const bob = await members.create({ name: 'Bob', email: 'bob@example.com' });

    await expect(members.create({ name: 'Ann 2', email: 'ANN@example.com' })).rejects.toBeInstanceOf(ConflictException);
    await expect(members.update(bob.id, { email: 'ann@example.com' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates fields and finds members by search term', async () => {
    const ann = await members.create({ name: 'Ann', email: 'ann@example.com' });
    await members.create({ name: 'Bob', email: 'bob@example.com' });

    const updated = await members.update(ann.id, { active: false, phone: '555' });
    expect(updated).toMatchObject({ active: false, phone: '555' });
    expect((await members.findAll('bob')).map((m) => m.name)).toEqual(['Bob']);
  });

  it('throws NotFound for an unknown id', async () => {
    await expect(members.findOne(42)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to delete a member with borrowed books', async () => {
    const member = await members.create({ name: 'Ann', email: 'ann@example.com' });
    const book = await books.create({ title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', totalCopies: 1 });
    const loan = await loans.borrow({ bookId: book.id, memberId: member.id });

    await expect(members.remove(member.id)).rejects.toBeInstanceOf(BadRequestException);

    await loans.returnLoan(loan.id);
    await members.remove(member.id);
    await expect(members.findOne(member.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});

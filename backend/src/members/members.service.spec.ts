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

  describe('bulkTag', () => {
    it('adds a tag to multiple active members', async () => {
      const m1 = await members.create({ name: 'Member 1', email: 'm1@example.com' });
      const m2 = await members.create({ name: 'Member 2', email: 'm2@example.com' });

      const res = await members.bulkTag({ memberIds: [m1.id, m2.id], action: 'add', tag: 'vip' });
      expect(res).toEqual({ updatedCount: 2 });

      const updated1 = await members.findOne(m1.id);
      const updated2 = await members.findOne(m2.id);
      expect(updated1.tags).toEqual(['vip']);
      expect(updated2.tags).toEqual(['vip']);
    });

    it('does not duplicate an existing tag when adding', async () => {
      const m1 = await members.create({ name: 'Member 1', email: 'm1@example.com' });
      await members.bulkTag({ memberIds: [m1.id], action: 'add', tag: 'vip' });
      await members.bulkTag({ memberIds: [m1.id], action: 'add', tag: 'vip' });

      const updated = await members.findOne(m1.id);
      expect(updated.tags).toEqual(['vip']);
    });

    it('removes a tag from multiple active members', async () => {
      const m1 = await members.create({ name: 'Member 1', email: 'm1@example.com' });
      const m2 = await members.create({ name: 'Member 2', email: 'm2@example.com' });

      await members.bulkTag({ memberIds: [m1.id, m2.id], action: 'add', tag: 'vip' });
      await members.bulkTag({ memberIds: [m1.id], action: 'remove', tag: 'vip' });

      const updated1 = await members.findOne(m1.id);
      const updated2 = await members.findOne(m2.id);
      expect(updated1.tags).toEqual([]);
      expect(updated2.tags).toEqual(['vip']);
    });

    it('rejects if more than 50 members are selected stating maximum is 50', async () => {
      const ids = Array.from({ length: 51 }, (_, i) => i + 1);
      await expect(members.bulkTag({ memberIds: ids, action: 'add', tag: 'vip' })).rejects.toThrow(
        /maximum is 50/i,
      );
    });

    it('rejects if memberIds is empty', async () => {
      await expect(members.bulkTag({ memberIds: [], action: 'add', tag: 'vip' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects if any member is not found', async () => {
      const m1 = await members.create({ name: 'Member 1', email: 'm1@example.com' });
      await expect(members.bulkTag({ memberIds: [m1.id, 9999], action: 'add', tag: 'vip' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects if any selected member is inactive', async () => {
      const m1 = await members.create({ name: 'Member 1', email: 'm1@example.com', active: true });
      const m2 = await members.create({ name: 'Member 2', email: 'm2@example.com', active: false });

      await expect(members.bulkTag({ memberIds: [m1.id, m2.id], action: 'add', tag: 'vip' })).rejects.toThrow(
        /inactive/i,
      );
    });
  });
});

import { describe, expect, it } from 'vitest';
import { formatDate, validateBook, validateBulkTag, validateMember } from './utils';

const validBook = {
  title: 'Dune',
  author: 'Frank Herbert',
  isbn: '9780441172719',
  category: 'Sci-Fi',
  publishedYear: '1965',
  totalCopies: '2',
};

describe('validateBook', () => {
  it('accepts a valid book', () => {
    expect(validateBook(validBook)).toBeNull();
    expect(validateBook({ ...validBook, publishedYear: '' })).toBeNull();
  });

  it.each([
    [{ title: ' ' }, 'Title is required'],
    [{ author: '' }, 'Author is required'],
    [{ isbn: '123' }, 'ISBN must be 10-17 characters'],
    [{ totalCopies: '0' }, 'Total copies must be a whole number of at least 1'],
    [{ totalCopies: '1.5' }, 'Total copies must be a whole number of at least 1'],
    [{ publishedYear: '3000' }, 'Published year is invalid'],
  ])('rejects %o', (patch, message) => {
    expect(validateBook({ ...validBook, ...patch })).toBe(message);
  });
});

describe('validateMember', () => {
  const valid = { name: 'Ann', email: 'ann@example.com', phone: '', active: true };

  it('accepts a valid member', () => {
    expect(validateMember(valid)).toBeNull();
  });

  it('requires a name and a valid email', () => {
    expect(validateMember({ ...valid, name: '' })).toBe('Name is required');
    expect(validateMember({ ...valid, email: 'not-an-email' })).toBe('A valid email is required');
  });
});

describe('formatDate', () => {
  it('returns a dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats ISO strings', () => {
    expect(formatDate('2026-03-10T12:00:00.000Z')).toMatch(/2026/);
  });
});

describe('validateBulkTag', () => {
  it('accepts valid bulk tag input', () => {
    expect(validateBulkTag(1, 'vip')).toBeNull();
    expect(validateBulkTag(50, 'student')).toBeNull();
  });

  it('rejects 0 selected members', () => {
    expect(validateBulkTag(0, 'vip')).toBe('Please select at least one active member');
  });

  it('rejects more than 50 selected members', () => {
    expect(validateBulkTag(51, 'vip')).toBe('Cannot update tags: maximum is 50 members');
  });

  it('rejects empty tag', () => {
    expect(validateBulkTag(5, '')).toBe('Tag name is required');
    expect(validateBulkTag(5, '   ')).toBe('Tag name is required');
  });
});

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';
import { Loan } from '../loans/loan.entity';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly books: Repository<Book>,
    @InjectRepository(Loan) private readonly loans: Repository<Loan>,
  ) {}

  findAll(search?: string): Promise<Book[]> {
    const term = search?.trim();
    if (!term) {
      return this.books.find({ order: { title: 'ASC' } });
    }
    const like = Like(`%${term}%`);
    return this.books.find({
      where: [{ title: like }, { author: like }, { isbn: like }, { category: like }],
      order: { title: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.books.findOneBy({ id });
    if (!book) {
      throw new NotFoundException(`Book #${id} not found`);
    }
    return book;
  }

  async create(dto: CreateBookDto): Promise<Book> {
    await this.ensureIsbnAvailable(dto.isbn);
    const book = this.books.create({ ...dto, availableCopies: dto.totalCopies });
    return this.books.save(book);
  }

  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    if (dto.isbn && dto.isbn !== book.isbn) {
      await this.ensureIsbnAvailable(dto.isbn);
    }
    if (dto.totalCopies !== undefined) {
      const onLoan = book.totalCopies - book.availableCopies;
      if (dto.totalCopies < onLoan) {
        throw new BadRequestException(
          `Total copies cannot be less than ${onLoan} (copies currently on loan)`,
        );
      }
      book.availableCopies = dto.totalCopies - onLoan;
    }
    Object.assign(book, dto);
    return this.books.save(book);
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    const activeLoans = await this.loans.count({ where: { book: { id }, returnDate: IsNull() } });
    if (activeLoans > 0) {
      throw new BadRequestException('Cannot delete a book that has copies on loan');
    }
    await this.books.remove(book);
  }

  private async ensureIsbnAvailable(isbn: string): Promise<void> {
    if (await this.books.existsBy({ isbn })) {
      throw new ConflictException(`A book with ISBN ${isbn} already exists`);
    }
  }
}

import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Loan } from '../loans/loan.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ unique: true })
  isbn: string;

  @Column({ default: 'General' })
  category: string;

  @Column({ type: 'integer', nullable: true })
  publishedYear: number | null;

  @Column({ type: 'integer', default: 1 })
  totalCopies: number;

  @Column({ type: 'integer', default: 1 })
  availableCopies: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Loan, (loan) => loan.book)
  loans: Loan[];
}

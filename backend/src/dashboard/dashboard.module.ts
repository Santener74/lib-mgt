import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { Loan } from '../loans/loan.entity';
import { Member } from '../members/member.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Member, Loan])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

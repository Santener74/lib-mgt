import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanQueryDto } from './dto/loan-query.dto';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  findAll(@Query() query: LoanQueryDto) {
    return this.loansService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.findOne(id);
  }

  @Post()
  borrow(@Body() dto: CreateLoanDto) {
    return this.loansService.borrow(dto);
  }

  @Patch(':id/return')
  returnLoan(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.returnLoan(id);
  }
}

import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateLoanDto {
  @IsInt()
  @Min(1)
  bookId: number;

  @IsInt()
  @Min(1)
  memberId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  loanDays?: number;
}

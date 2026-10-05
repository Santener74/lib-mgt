import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { LoanStatus } from '../loan.rules';

export class LoanQueryDto {
  @IsOptional()
  @IsIn(['active', 'overdue', 'returned'])
  status?: LoanStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  memberId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bookId?: number;
}

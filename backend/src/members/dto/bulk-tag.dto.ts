import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class BulkTagDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'memberIds should not be empty' })
  @ArrayMaxSize(50, { message: 'Cannot update tags: maximum is 50 members' })
  @IsInt({ each: true, message: 'Each memberId must be an integer' })
  @Min(1, { each: true, message: 'Each memberId must be at least 1' })
  memberIds: number[];

  @IsIn(['add', 'remove'], { message: 'action must be either "add" or "remove"' })
  action: 'add' | 'remove';

  @IsString({ message: 'tag must be a string' })
  @IsNotEmpty({ message: 'tag should not be empty' })
  tag: string;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BulkTagDto } from './dto/bulk-tag.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

@Controller(['members', 'v1/members'])
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post('bulk-tag')
  @HttpCode(200)
  bulkTag(@Body() dto: BulkTagDto) {
    return this.membersService.bulkTag(dto);
  }

  @Post('tags')
  @HttpCode(200)
  bulkTagAlias(@Body() dto: BulkTagDto) {
    return this.membersService.bulkTag(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.membersService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMemberDto) {
    return this.membersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberDto) {
    return this.membersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.remove(id);
  }
}

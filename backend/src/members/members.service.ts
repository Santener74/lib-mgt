import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Like, Repository } from 'typeorm';
import { Loan } from '../loans/loan.entity';
import { BulkTagDto } from './dto/bulk-tag.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './member.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member) private readonly members: Repository<Member>,
    @InjectRepository(Loan) private readonly loans: Repository<Loan>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(search?: string): Promise<Member[]> {
    const term = search?.trim();
    if (!term) {
      return this.members.find({ order: { name: 'ASC' } });
    }
    const like = Like(`%${term}%`);
    return this.members.find({
      where: [{ name: like }, { email: like }, { phone: like }],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Member> {
    const member = await this.members.findOneBy({ id });
    if (!member) {
      throw new NotFoundException(`Member #${id} not found`);
    }
    return member;
  }

  async create(dto: CreateMemberDto): Promise<Member> {
    const email = dto.email.toLowerCase();
    await this.ensureEmailAvailable(email);
    return this.members.save(this.members.create({ ...dto, email }));
  }

  async update(id: number, dto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);
    if (dto.email) {
      dto.email = dto.email.toLowerCase();
      if (dto.email !== member.email) {
        await this.ensureEmailAvailable(dto.email);
      }
    }
    Object.assign(member, dto);
    return this.members.save(member);
  }

  async remove(id: number): Promise<void> {
    const member = await this.findOne(id);
    const activeLoans = await this.loans.count({ where: { member: { id }, returnDate: IsNull() } });
    if (activeLoans > 0) {
      throw new BadRequestException('Cannot delete a member who still has borrowed books');
    }
    await this.members.remove(member);
  }

  async bulkTag(dto: BulkTagDto): Promise<{ updatedCount: number }> {
    if (!dto.memberIds || dto.memberIds.length === 0) {
      throw new BadRequestException('memberIds should not be empty');
    }

    if (dto.memberIds.length > 50) {
      throw new BadRequestException('Cannot update tags: maximum is 50 members');
    }

    const tag = dto.tag?.trim();
    if (!tag) {
      throw new BadRequestException('tag should not be empty');
    }

    const uniqueIds = Array.from(new Set(dto.memberIds));

    return this.dataSource.transaction(async (manager) => {
      const members = await manager.findBy(Member, {
        id: In(uniqueIds),
      });

      if (members.length !== uniqueIds.length) {
        const foundIds = new Set(members.map((m) => m.id));
        const missingId = uniqueIds.find((id) => !foundIds.has(id));
        throw new NotFoundException(`Member #${missingId} not found`);
      }

      const inactive = members.find((m) => !m.active);
      if (inactive) {
        throw new BadRequestException(`Member "${inactive.name}" is inactive`);
      }

      for (const member of members) {
        const currentTags = Array.isArray(member.tags) ? [...member.tags] : [];
        if (dto.action === 'add') {
          if (!currentTags.includes(tag)) {
            currentTags.push(tag);
          }
        } else if (dto.action === 'remove') {
          const index = currentTags.indexOf(tag);
          if (index !== -1) {
            currentTags.splice(index, 1);
          }
        }
        member.tags = currentTags;
        await manager.save(Member, member);
      }

      return { updatedCount: members.length };
    });
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    if (await this.members.existsBy({ email })) {
      throw new ConflictException(`A member with email ${email} already exists`);
    }
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class TagsService {
  addTag(existingTags: string[] | null | undefined, tag: string): string[] {
    const cleanTag = tag.trim();
    const tags = Array.isArray(existingTags) ? [...existingTags] : [];
    if (cleanTag && !tags.includes(cleanTag)) {
      tags.push(cleanTag);
    }
    return tags;
  }

  removeTag(existingTags: string[] | null | undefined, tag: string): string[] {
    const cleanTag = tag.trim();
    const tags = Array.isArray(existingTags) ? [...existingTags] : [];
    return tags.filter((t) => t !== cleanTag);
  }
}

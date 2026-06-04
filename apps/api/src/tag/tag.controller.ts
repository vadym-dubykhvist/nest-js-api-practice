import { Controller, Get } from '@nestjs/common';
import { TagService } from '@app/tag/tag.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('tags')
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}
  @Get()
  @ApiOperation({
    summary: 'List tags',
    description: 'Returns all tags that can be used to filter articles.',
  })
  @ApiOkResponse({
    description: 'Tags returned.',
    schema: {
      example: {
        tags: ['nestjs', 'typescript'],
      },
    },
  })
  async findAll(): Promise<{ tags: string[] }> {
    const tags = await this.tagService.findAll();

    return {
      tags: tags.map((tag) => tag.name),
    };
  }
}

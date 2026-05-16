import { DeleteResult } from 'typeorm';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';

import { ArticleService } from '@app/article/article.service';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { User } from '@app/user/decorators/user.decorator';
import { UserEntity } from '@app/user/user.entity';
import {
  ArticleResponseInterface,
  ArticlesResponseInterface,
} from '@app/article/types/articleResponse.interfaces';
import type {
  ArticlesFeedQueryInterface,
  ArticlesQueryInterface,
} from '@app/article/types/article.interfaces';
import { UpdateArticleDto } from '@app/article/dto/updateArticle.dto';
import { CreateArticleDto } from '@app/article/dto/createArticle.dto';
import { BackendValidationPipe } from '@app/shared/pipes/backendValidation.pipe';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

@ApiTags('articles')
@ApiExtraModels(CreateArticleDto, UpdateArticleDto)
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({
    summary: 'List articles',
    description:
      'Returns articles ordered from newest to oldest, optionally filtered by query parameters.',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    description: 'Filter articles by tag.',
    example: 'nestjs',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    description: 'Filter articles by author username.',
    example: 'john_doe',
  })
  @ApiQuery({
    name: 'favorited',
    required: false,
    description: 'Filter articles favorited by username.',
    example: 'john_doe',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of articles to return.',
    example: 20,
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of articles to skip.',
    example: 0,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Articles returned.',
  })
  async getArticles(
    @User('id') currentUserId: number,
    @Query() query: ArticlesQueryInterface,
  ): Promise<ArticlesResponseInterface> {
    return await this.articleService.getArticles(currentUserId, query);
  }

  @Get('feed')
  @ApiOperation({
    summary: 'Get article feed',
    description:
      'Returns articles from users followed by the authenticated user.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of articles to return.',
    example: 20,
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of articles to skip.',
    example: 0,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Feed articles returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  async getFeed(
    @User('id') currentUserId: number,
    @Query() query: ArticlesFeedQueryInterface,
  ): Promise<ArticlesResponseInterface> {
    return await this.articleService.getFeed(currentUserId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create article',
    description: 'Creates an article owned by the authenticated user.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiBody({
    description: 'Article creation payload wrapped in an article object.',
    schema: {
      type: 'object',
      required: ['article'],
      properties: {
        article: { $ref: getSchemaPath(CreateArticleDto) },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Article created and returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed for one or more article fields.',
  })
  @UsePipes(new BackendValidationPipe())
  async createArticle(
    @User() currentUser: UserEntity,
    @Body('article') createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.createArticle(
      currentUser,
      createArticleDto,
    );

    return this.articleService.buildArticleResponse(article);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get article',
    description: 'Returns a single article by slug.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Unique article slug.',
    example: 'how-to-build-a-nestjs-api-k9x4d',
  })
  @ApiResponse({
    status: 200,
    description: 'Article returned.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article was not found.',
  })
  async getArticle(
    @Param('slug') slug: string,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.getArticle(slug);

    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug')
  @ApiOperation({
    summary: 'Delete article',
    description: 'Deletes an article owned by the authenticated user.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiParam({
    name: 'slug',
    description: 'Unique article slug.',
    example: 'how-to-build-a-nestjs-api-k9x4d',
  })
  @ApiResponse({
    status: 200,
    description: 'Article deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not the article author.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article was not found.',
  })
  async deleteArticle(
    @Param('slug') slug: string,
    @User('id') currentUserId: number,
  ): Promise<DeleteResult> {
    return await this.articleService.deleteArticle(slug, currentUserId);
  }

  @Put(':slug')
  @ApiOperation({
    summary: 'Update article',
    description: 'Updates an article owned by the authenticated user.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiParam({
    name: 'slug',
    description: 'Unique article slug.',
    example: 'how-to-build-a-nestjs-api-k9x4d',
  })
  @ApiBody({
    description: 'Article update payload wrapped in an article object.',
    schema: {
      type: 'object',
      required: ['article'],
      properties: {
        article: { $ref: getSchemaPath(UpdateArticleDto) },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Article updated and returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not the article author.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article was not found.',
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed for one or more article fields.',
  })
  @UsePipes(new BackendValidationPipe())
  async updateArticle(
    @Param('slug') slug: string,
    @User('id') currentUserId: number,
    @Body('article') updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.updateArticle(
      slug,
      currentUserId,
      updateArticleDto,
    );

    return this.articleService.buildArticleResponse(article);
  }

  @Post(':slug/favorite')
  @ApiOperation({
    summary: 'Favorite article',
    description: 'Adds the article to the authenticated user favorites.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiParam({
    name: 'slug',
    description: 'Unique article slug.',
    example: 'how-to-build-a-nestjs-api-k9x4d',
  })
  @ApiResponse({
    status: 201,
    description: 'Article added to favorites and returned.',
  })
  @ApiResponse({
    status: 400,
    description: 'Article is already favorited.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article or user was not found.',
  })
  async addArticleToFavorites(
    @User('id') currentUserId: number,
    @Param('slug') slug: string,
  ) {
    const article = await this.articleService.addArticleToFavorites(
      currentUserId,
      slug,
    );
    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug/favorite')
  @ApiOperation({
    summary: 'Unfavorite article',
    description: 'Removes the article from the authenticated user favorites.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiParam({
    name: 'slug',
    description: 'Unique article slug.',
    example: 'how-to-build-a-nestjs-api-k9x4d',
  })
  @ApiResponse({
    status: 200,
    description: 'Article removed from favorites and returned.',
  })
  @ApiResponse({
    status: 400,
    description: 'Article is not favorited.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article or user was not found.',
  })
  async deleteArticleFromFavorites(
    @User('id') currentUserId: number,
    @Param('slug') slug: string,
  ) {
    const article = await this.articleService.deleteArticleFromFavorites(
      currentUserId,
      slug,
    );
    return this.articleService.buildArticleResponse(article);
  }
}

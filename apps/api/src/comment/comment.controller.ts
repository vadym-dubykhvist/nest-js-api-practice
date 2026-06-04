import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import { CommentService } from '@app/comment/comment.service';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { User } from '@app/user/decorators/user.decorator';
import { UserEntity } from '@app/user/user.entity';
import { CreateCommentDto } from '@app/comment/dto/createComment.dto';
import { UpdateCommentDto } from '@app/comment/dto/updateComment.dto';
import {
  CommentResponseInterface,
  CommentsResponseInterface,
} from '@app/comment/types/commentResponse.interfaces';
import { BackendValidationPipe } from '@app/shared/pipes/backendValidation.pipe';

@ApiTags('comments')
@ApiExtraModels(CreateCommentDto, UpdateCommentDto)
@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('articles/:slug/comments')
  @ApiOperation({
    summary: 'Get article comments',
    description: 'Returns all comments for an article as a nested tree.',
  })
  @ApiParam({ name: 'slug', description: 'Article slug.' })
  @ApiResponse({ status: 200, description: 'Comments returned.' })
  @ApiResponse({ status: 404, description: 'Article not found.' })
  async getComments(
    @Param('slug') slug: string,
    @User('id') currentUserId: number,
  ): Promise<CommentsResponseInterface> {
    return await this.commentService.findAllByArticle(slug, currentUserId);
  }

  @Post('articles/:slug/comments')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({
    summary: 'Create comment',
    description:
      'Creates a comment on an article. Pass parentId to create a nested reply.',
  })
  @ApiParam({ name: 'slug', description: 'Article slug.' })
  @ApiBody({
    description: 'Comment payload wrapped in a comment object.',
    schema: {
      type: 'object',
      required: ['comment'],
      properties: {
        comment: { $ref: getSchemaPath(CreateCommentDto) },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Comment created and returned.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article or parent comment not found.',
  })
  @ApiResponse({ status: 422, description: 'Validation failed.' })
  @UsePipes(new BackendValidationPipe())
  async createComment(
    @Param('slug') slug: string,
    @User() currentUser: UserEntity,
    @Body('comment') createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseInterface> {
    return await this.commentService.create(
      slug,
      createCommentDto,
      currentUser,
    );
  }

  @Patch('articles/:slug/comments/:id')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({
    summary: 'Update comment',
    description: 'Updates a comment body. Only the comment author can edit.',
  })
  @ApiParam({ name: 'slug', description: 'Article slug.' })
  @ApiParam({ name: 'id', description: 'Comment ID.' })
  @ApiBody({
    description: 'Comment update payload wrapped in a comment object.',
    schema: {
      type: 'object',
      required: ['comment'],
      properties: {
        comment: { $ref: getSchemaPath(UpdateCommentDto) },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Comment updated and returned.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Not the comment author.',
  })
  @ApiResponse({ status: 404, description: 'Article or comment not found.' })
  @ApiResponse({ status: 422, description: 'Validation failed.' })
  @UsePipes(new BackendValidationPipe())
  async updateComment(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) commentId: number,
    @User('id') currentUserId: number,
    @Body('comment') updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseInterface> {
    return await this.commentService.update(
      slug,
      commentId,
      updateCommentDto,
      currentUserId,
    );
  }

  @Delete('articles/:slug/comments/:id')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({
    summary: 'Delete comment',
    description:
      'Deletes a comment. Allowed for comment author or article author.',
  })
  @ApiParam({ name: 'slug', description: 'Article slug.' })
  @ApiParam({ name: 'id', description: 'Comment ID.' })
  @ApiResponse({ status: 200, description: 'Comment deleted.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this comment.',
  })
  @ApiResponse({ status: 404, description: 'Article or comment not found.' })
  async deleteComment(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) commentId: number,
    @User('id') currentUserId: number,
  ): Promise<void> {
    await this.commentService.delete(slug, commentId, currentUserId);
  }

  @Post('comments/:id/like')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({
    summary: 'Like comment',
    description: 'Adds a like to the comment.',
  })
  @ApiParam({ name: 'id', description: 'Comment ID.' })
  @ApiResponse({ status: 201, description: 'Comment liked and returned.' })
  @ApiResponse({ status: 400, description: 'Comment already liked.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async likeComment(
    @Param('id', ParseIntPipe) commentId: number,
    @User('id') currentUserId: number,
  ): Promise<CommentResponseInterface> {
    return await this.commentService.likeComment(commentId, currentUserId);
  }

  @Delete('comments/:id/like')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({
    summary: 'Unlike comment',
    description: 'Removes a like from the comment.',
  })
  @ApiParam({ name: 'id', description: 'Comment ID.' })
  @ApiResponse({
    status: 200,
    description: 'Like removed and comment returned.',
  })
  @ApiResponse({ status: 400, description: 'Comment is not liked.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async unlikeComment(
    @Param('id', ParseIntPipe) commentId: number,
    @User('id') currentUserId: number,
  ): Promise<CommentResponseInterface> {
    return await this.commentService.unlikeComment(commentId, currentUserId);
  }
}

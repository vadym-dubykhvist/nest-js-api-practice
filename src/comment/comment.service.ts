import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommentEntity } from '@app/comment/comment.entity';
import { ArticleEntity } from '@app/article/article.entity';
import { UserEntity } from '@app/user/user.entity';
import { CreateCommentDto } from '@app/comment/dto/createComment.dto';
import { UpdateCommentDto } from '@app/comment/dto/updateComment.dto';
import {
  CommentResponseInterface,
  CommentsResponseInterface,
  CommentType,
} from '@app/comment/types/commentResponse.interfaces';
import { ExceptionService } from '@app/shared/services/exception.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly exceptionService: ExceptionService,
  ) {}

  async findAllByArticle(
    slug: string,
    currentUserId?: number,
  ): Promise<CommentsResponseInterface> {
    const article = await this.articleRepository.findOne({ where: { slug } });

    if (!article) {
      this.exceptionService.throwHttpException(
        'article',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const allComments = await this.commentRepository.find({
      where: { article: { id: article.id } },
      relations: ['author', 'likedBy', 'parent'],
      order: { createdAt: 'ASC' },
    });

    const buildTree = (parentId: number | null): CommentType[] =>
      allComments
        .filter((c) => (c.parent?.id ?? null) === parentId)
        .map((c) => ({
          id: c.id,
          body: c.body,
          likesCount: c.likesCount,
          liked: currentUserId
            ? c.likedBy.some((u) => u.id === currentUserId)
            : false,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          author: {
            username: c.author.username,
            bio: c.author.bio,
            image: c.author.image,
          },
          replies: buildTree(c.id),
        }));

    return { comments: buildTree(null) };
  }

  async create(
    slug: string,
    createCommentDto: CreateCommentDto,
    currentUser: UserEntity,
  ): Promise<CommentResponseInterface> {
    const article = await this.articleRepository.findOne({ where: { slug } });

    if (!article) {
      this.exceptionService.throwHttpException(
        'article',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const comment = new CommentEntity();
    comment.body = createCommentDto.body;
    comment.author = currentUser;
    comment.article = article;
    comment.parent = null;

    if (createCommentDto.parentId) {
      const parent = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentId, article: { id: article.id } },
      });

      if (!parent) {
        this.exceptionService.throwHttpException(
          'parent comment',
          'not found',
          HttpStatus.NOT_FOUND,
        );
      }

      comment.parent = parent;
    }

    const saved = await this.commentRepository.save(comment);

    return this.buildCommentResponse(saved, false);
  }

  async update(
    slug: string,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
    currentUserId: number,
  ): Promise<CommentResponseInterface> {
    const article = await this.articleRepository.findOne({ where: { slug } });

    if (!article) {
      this.exceptionService.throwHttpException(
        'article',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const comment = await this.commentRepository.findOne({
      where: { id: commentId, article: { id: article.id } },
      relations: ['likedBy'],
    });

    if (!comment) {
      this.exceptionService.throwHttpException(
        'comment',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (comment.author.id !== currentUserId) {
      this.exceptionService.throwHttpException(
        'comment',
        'you are not the author of this comment',
        HttpStatus.FORBIDDEN,
      );
    }

    comment.body = updateCommentDto.body;
    const saved = await this.commentRepository.save(comment);

    const liked = saved.likedBy.some((u) => u.id === currentUserId);
    return this.buildCommentResponse(saved, liked);
  }

  async delete(
    slug: string,
    commentId: number,
    currentUserId: number,
  ): Promise<void> {
    const article = await this.articleRepository.findOne({ where: { slug } });

    if (!article) {
      this.exceptionService.throwHttpException(
        'article',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const comment = await this.commentRepository.findOne({
      where: { id: commentId, article: { id: article.id } },
      relations: ['author'],
    });

    if (!comment) {
      this.exceptionService.throwHttpException(
        'comment',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isCommentAuthor = comment.author.id === currentUserId;
    const isArticleAuthor = article.author.id === currentUserId;

    if (!isCommentAuthor && !isArticleAuthor) {
      this.exceptionService.throwHttpException(
        'comment',
        'you are not authorized to delete this comment',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.commentRepository.delete({ id: commentId });
  }

  async likeComment(
    commentId: number,
    currentUserId: number,
  ): Promise<CommentResponseInterface> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['likedBy'],
    });

    if (!comment) {
      this.exceptionService.throwHttpException(
        'comment',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isLiked = comment.likedBy.some((u) => u.id === currentUserId);

    if (isLiked) {
      this.exceptionService.throwHttpException(
        'comment',
        'already liked',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (!user) {
      this.exceptionService.throwHttpException(
        'user',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    comment.likedBy.push(user);
    comment.likesCount++;
    await this.commentRepository.save(comment);

    return this.buildCommentResponse(comment, true);
  }

  async unlikeComment(
    commentId: number,
    currentUserId: number,
  ): Promise<CommentResponseInterface> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['likedBy'],
    });

    if (!comment) {
      this.exceptionService.throwHttpException(
        'comment',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const likedByIndex = comment.likedBy.findIndex(
      (u) => u.id === currentUserId,
    );

    if (likedByIndex === -1) {
      this.exceptionService.throwHttpException(
        'comment',
        'not liked',
        HttpStatus.BAD_REQUEST,
      );
    }

    comment.likedBy.splice(likedByIndex, 1);
    comment.likesCount--;
    await this.commentRepository.save(comment);

    return this.buildCommentResponse(comment, false);
  }

  buildCommentResponse(
    comment: CommentEntity,
    liked: boolean,
  ): CommentResponseInterface {
    return {
      comment: {
        id: comment.id,
        body: comment.body,
        likesCount: comment.likesCount,
        liked,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          username: comment.author.username,
          bio: comment.author.bio,
          image: comment.author.image,
        },
        replies: [],
      },
    };
  }
}

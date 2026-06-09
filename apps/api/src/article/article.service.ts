import slugify from 'slugify';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ArticleEntity } from '@app/article/article.entity';
import { CreateArticleDto } from '@app/article/dto/createArticle.dto';
import { UpdateArticleDto } from '@app/article/dto/updateArticle.dto';
import {
  ArticlesFeedQueryInterface,
  ArticlesQueryInterface,
} from '@app/article/types/article.interfaces';
import {
  ArticleResponseInterface,
  ArticlesResponseInterface,
} from '@app/article/types/articleResponse.interfaces';
import { EventEntity } from '@app/event/event.entity';
import { RegistrationEntity } from '@app/event/registration.entity';
import { FollowEntity } from '@app/profile/follow.entity';
import { ExceptionService } from '@app/shared/services/exception.service';
import { mergeDefined } from '@app/shared/utils/merge-defined';
import { UserEntity } from '@app/user/user.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectRepository(RegistrationEntity)
    private readonly registrationRepository: Repository<RegistrationEntity>,
    private dataSource: DataSource,
    private readonly exceptionService: ExceptionService,
  ) {}

  async getArticles(
    currentUserId: number,
    query: ArticlesQueryInterface,
  ): Promise<ArticlesResponseInterface> {
    const queryBuilder = this.dataSource
      .getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .leftJoinAndSelect('articles.event', 'event')
      .loadRelationCountAndMap('articles.commentsCount', 'articles.comments');

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.event) {
      queryBuilder.andWhere('articles.eventId = :eventId', {
        eventId: query.event,
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        where: { username: query.author },
      });
      if (author) {
        queryBuilder.andWhere('author.id = :id', {
          id: `${author.id}`,
        });
      }
    }

    if (query.favorited) {
      const author = await this.userRepository.findOne({
        where: { username: query.favorited },
        relations: ['favorites'],
      });

      if (!author) {
        return { articles: [], articlesCount: 0 };
      }
      const favoritedIds = author.favorites.map((favorited) => favorited.id);

      if (favoritedIds.length > 0) {
        queryBuilder.andWhere('articles.id IN (:...favoritedIds)', {
          favoritedIds,
        });
      } else {
        queryBuilder.andWhere('1=0');
      }
    }

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    let favoritedArticlesIds: number[] = [];

    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId },
        relations: ['favorites'],
      });

      if (currentUser) {
        favoritedArticlesIds = currentUser.favorites.map(
          (favorite) => favorite.id,
        );
      }
    }

    const articles = await queryBuilder.getMany();
    const articlesWithFavorited = articles.map((article) => ({
      ...article,
      favorited: favoritedArticlesIds.includes(article.id),
    }));

    return { articles: articlesWithFavorited, articlesCount };
  }

  async getFeed(
    currentUserId: number,
    query: ArticlesFeedQueryInterface,
  ): Promise<ArticlesResponseInterface> {
    const follows = await this.followRepository.find({
      where: { followerId: currentUserId },
    });

    if (follows.length === 0) {
      return { articles: [], articlesCount: 0 };
    }

    const followingUserIds = follows.map((follow) => follow.followingId);

    const queryBuilder = this.dataSource
      .getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .loadRelationCountAndMap('articles.commentsCount', 'articles.comments')
      .where('articles.authorId IN (:...followingUserIds)', {
        followingUserIds,
      });

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();

    return { articles: articles, articlesCount: articlesCount };
  }

  // Only the event host or a registered attendee may write/relink an article.
  private async assertCanWriteForEvent(
    event: EventEntity,
    currentUserId: number,
  ): Promise<void> {
    if (event.author.id === currentUserId) {
      return;
    }
    const registration = await this.registrationRepository.findOne({
      where: { event: { id: event.id }, user: { id: currentUserId } },
    });
    if (!registration) {
      this.exceptionService.throwHttpException(
        'event',
        'only the event host or an attendee can write an article',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async createArticle(
    currentUser: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();

    Object.assign(article, createArticleDto);

    if (!article.tagList) {
      article.tagList = [];
    }

    article.slug = this.getSlug(createArticleDto.title);

    article.author = currentUser;
    article.event = null;

    if (typeof createArticleDto.eventId === 'number') {
      const event = await this.eventRepository.findOneBy({
        id: createArticleDto.eventId,
      });
      if (!event) {
        this.exceptionService.throwHttpException(
          'event',
          'not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.assertCanWriteForEvent(event, currentUser.id);
      article.event = event;
    }

    return await this.articleRepository.save(article);
  }

  async getArticle(slug: string): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['event'],
    });

    if (!article) {
      this.exceptionService.throwHttpException(
        'article',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return article;
  }

  // Single-article read enriched with the current viewer's favorite state —
  // mirrors EventService.findByIdForUser (the list endpoint already does this).
  async getArticleForUser(
    slug: string,
    currentUserId?: number,
  ): Promise<ArticleEntity> {
    const article = await this.getArticle(slug);
    article.favorited = false;

    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId },
        relations: ['favorites'],
      });
      if (currentUser) {
        article.favorited = currentUser.favorites.some(
          (favorite) => favorite.id === article.id,
        );
      }
    }

    return article;
  }

  async deleteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<DeleteResult> {
    const article = await this.getArticle(slug);

    if (article.author.id !== currentUserId) {
      this.exceptionService.throwHttpException(
        'article',
        'you are not an author of this article',
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.articleRepository.delete({ slug });
  }

  async updateArticle(
    slug: string,
    currentUserId: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.getArticle(slug);

    if (article.author.id !== currentUserId) {
      this.exceptionService.throwHttpException(
        'article',
        'you are not an author of this article',
        HttpStatus.FORBIDDEN,
      );
    }

    mergeDefined(article, updateArticleDto);

    if (updateArticleDto.title) {
      article.slug = this.getSlug(updateArticleDto.title);
    }

    if (updateArticleDto.eventId === null) {
      article.event = null;
    } else if (typeof updateArticleDto.eventId === 'number') {
      const event = await this.eventRepository.findOneBy({
        id: updateArticleDto.eventId,
      });
      if (!event) {
        this.exceptionService.throwHttpException(
          'event',
          'not found',
          HttpStatus.NOT_FOUND,
        );
      }
      await this.assertCanWriteForEvent(event, currentUserId);
      article.event = event;
    }

    return await this.articleRepository.save(article);
  }

  async addArticleToFavorites(
    currentUserId: number,
    slug: string,
  ): Promise<ArticleEntity> {
    const article = await this.getArticle(slug);
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['favorites'],
    });

    if (!user) {
      this.exceptionService.throwHttpException(
        'user',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isFavorited =
      user.favorites.findIndex((favArt) => favArt.id === article.id) !== -1;

    if (isFavorited) {
      this.exceptionService.throwHttpException(
        'article',
        'already favorited',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.favorites.push(article);
    article.favoritesCount++;
    await this.userRepository.save(user);
    await this.articleRepository.save(article);

    return article;
  }

  async deleteArticleFromFavorites(
    currentUserId: number,
    slug: string,
  ): Promise<ArticleEntity> {
    const article = await this.getArticle(slug);
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['favorites'],
    });

    if (!user) {
      this.exceptionService.throwHttpException(
        'user',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const articleIndex = user.favorites.findIndex(
      (favArt) => favArt.id === article.id,
    );

    if (!(articleIndex >= 0)) {
      this.exceptionService.throwHttpException(
        'article',
        'not favorited',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.favorites.splice(articleIndex, 1);
    article.favoritesCount--;
    await this.userRepository.save(user);
    await this.articleRepository.save(article);

    return article;
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }
}

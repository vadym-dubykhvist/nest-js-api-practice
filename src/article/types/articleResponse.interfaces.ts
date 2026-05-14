import { ArticleEntity } from '@app/article/article.entity';
import { ArticleType } from '@app/article/types/article.types';

export interface ArticleResponseInterface {
  article: ArticleEntity;
}

export interface ArticlesResponseInterface {
  articles: ArticleType[];
  articlesCount: number;
}

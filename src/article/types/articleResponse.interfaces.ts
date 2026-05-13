import { ArticleEntity } from '@app/article/article.entity';

export interface ArticleResponseInterface {
  article: ArticleEntity;
}

export interface ArticlesResponseInterface {
  articles: ArticleEntity[];
  articlesCount: number;
}

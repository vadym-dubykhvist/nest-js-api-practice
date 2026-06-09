import {
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { CommentEntity } from '@app/comment/comment.entity';
import { EventEntity } from '@app/event/event.entity';
import { UserEntity } from '@app/user/user.entity';

@Entity('articles')
export class ArticleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  body: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column('simple-array')
  tagList: string[];

  @Column({ default: 0 })
  favoritesCount: number;

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }

  @ManyToOne(() => UserEntity, (user) => user.articles, { eager: true })
  author: UserEntity;

  @ManyToOne(() => EventEntity, { nullable: true, onDelete: 'SET NULL' })
  event: EventEntity | null;

  // Inverse side only (no column). Enables loadRelationCountAndMap for commentsCount.
  @OneToMany(() => CommentEntity, (comment) => comment.article)
  comments: CommentEntity[];

  // Not persisted: mapped per-query by loadRelationCountAndMap.
  commentsCount?: number;

  // Not persisted: whether the current viewer has favorited this article.
  favorited?: boolean;
}

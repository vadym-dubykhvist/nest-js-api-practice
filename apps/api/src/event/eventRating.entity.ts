import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from '@app/user/user.entity';
import { EventEntity } from '@app/event/event.entity';

@Entity({ name: 'event_ratings' })
@Unique('UQ_event_ratings_user_event', ['user', 'event'])
export class EventRatingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'smallint' })
  score: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  event: EventEntity;
}

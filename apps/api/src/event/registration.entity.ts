import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { EventEntity } from '@app/event/event.entity';
import { UserEntity } from '@app/user/user.entity';

@Entity({ name: 'registrations' })
export class RegistrationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  additionalInfo: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  event: EventEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  user: UserEntity | null;
}

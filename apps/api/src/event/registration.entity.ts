import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EventEntity } from '@app/event/event.entity';
import { UserEntity } from '@app/user/user.entity';

@Entity({ name: 'registrations' })
// One registration per email per event (see the matching migration). Guards
// against the same guest email RSVPing twice and races past the service check.
@Index('UQ_registrations_event_email', ['event', 'email'], { unique: true })
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

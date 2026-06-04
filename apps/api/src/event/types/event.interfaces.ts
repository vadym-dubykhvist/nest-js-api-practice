import { EventEntity } from '@app/event/event.entity';
import { RegistrationEntity } from '@app/event/registration.entity';

export interface EventResponseInterface {
  event: EventEntity;
}

export interface EventsResponseInterface {
  events: EventEntity[];
  eventsCount: number;
}

export interface RegistrationResponseInterface {
  registration: RegistrationEntity;
}

export interface EventsQueryInterface {
  tag?: string;
  location?: string;
  author?: string;
  limit?: number;
  offset?: number;
}

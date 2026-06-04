import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Repository } from 'typeorm';

import { EventEntity } from '@app/event/event.entity';
import { RegistrationEntity } from '@app/event/registration.entity';
import { EventRatingEntity } from '@app/event/eventRating.entity';
import { UserEntity } from '@app/user/user.entity';
import { CreateEventDto } from '@app/event/dto/createEvent.dto';
import { UpdateEventDto } from '@app/event/dto/updateEvent.dto';
import { RegisterEventDto } from '@app/event/dto/registerEvent.dto';
import { RateEventDto } from '@app/event/dto/rateEvent.dto';
import {
  EventResponseInterface,
  EventsQueryInterface,
  EventsResponseInterface,
  RegistrationResponseInterface,
} from '@app/event/types/event.interfaces';
import { ExceptionService } from '@app/shared/services/exception.service';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectRepository(RegistrationEntity)
    private readonly registrationRepository: Repository<RegistrationEntity>,
    @InjectRepository(EventRatingEntity)
    private readonly ratingRepository: Repository<EventRatingEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly exceptionService: ExceptionService,
  ) {}

  async findAll(query: EventsQueryInterface): Promise<EventsResponseInterface> {
    const qb = this.dataSource
      .getRepository(EventEntity)
      .createQueryBuilder('events')
      .leftJoinAndSelect('events.author', 'author');

    if (query.tag) {
      qb.andWhere('events.tags LIKE :tag', { tag: `%${query.tag}%` });
    }

    if (query.location) {
      qb.andWhere('events.location ILIKE :location', {
        location: `%${query.location}%`,
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        where: { username: query.author },
      });
      if (author) {
        qb.andWhere('author.id = :id', { id: author.id });
      } else {
        return { events: [], eventsCount: 0 };
      }
    }

    qb.orderBy('events.startDate', 'ASC');

    const eventsCount = await qb.getCount();

    if (query.limit) qb.limit(query.limit);
    if (query.offset) qb.offset(query.offset);

    const events = await qb.getMany();
    return { events, eventsCount };
  }

  async findById(id: number): Promise<EventEntity> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      this.exceptionService.throwHttpException(
        'event',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return event;
  }

  async create(
    currentUser: UserEntity,
    dto: CreateEventDto,
  ): Promise<EventEntity> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      this.exceptionService.throwHttpException(
        'endDate',
        'must be after startDate',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const event = new EventEntity();
    Object.assign(event, dto);
    event.startDate = startDate;
    event.endDate = endDate;
    event.tags = dto.tags ?? [];
    event.author = currentUser;

    return await this.eventRepository.save(event);
  }

  async update(
    id: number,
    currentUserId: number,
    dto: UpdateEventDto,
  ): Promise<EventEntity> {
    const event = await this.findById(id);

    if (event.author.id !== currentUserId) {
      this.exceptionService.throwHttpException(
        'event',
        'you are not the author of this event',
        HttpStatus.FORBIDDEN,
      );
    }

    Object.assign(event, dto);
    if (dto.startDate) event.startDate = new Date(dto.startDate);
    if (dto.endDate) event.endDate = new Date(dto.endDate);

    if (event.endDate <= event.startDate) {
      this.exceptionService.throwHttpException(
        'endDate',
        'must be after startDate',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return await this.eventRepository.save(event);
  }

  async delete(id: number, currentUserId: number): Promise<DeleteResult> {
    const event = await this.findById(id);

    if (event.author.id !== currentUserId) {
      this.exceptionService.throwHttpException(
        'event',
        'you are not the author of this event',
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.eventRepository.delete({ id });
  }

  async register(
    eventId: number,
    dto: RegisterEventDto,
    currentUser: UserEntity | null,
  ): Promise<RegistrationResponseInterface> {
    const event = await this.findById(eventId);

    if (event.maxGuests > 0 && event.registeredCount >= event.maxGuests) {
      this.exceptionService.throwHttpException(
        'event',
        'is full',
        HttpStatus.BAD_REQUEST,
      );
    }

    let email: string;
    let name: string;

    if (currentUser) {
      const existing = await this.registrationRepository.findOne({
        where: { event: { id: event.id }, user: { id: currentUser.id } },
      });
      if (existing) {
        this.exceptionService.throwHttpException(
          'registration',
          'already registered',
          HttpStatus.BAD_REQUEST,
        );
      }
      email = currentUser.email;
      name = currentUser.username;
    } else {
      if (!dto.email || !dto.name) {
        this.exceptionService.throwHttpException(
          'registration',
          'email and name are required for anonymous registration',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      email = dto.email;
      name = dto.name;
    }

    const registration = new RegistrationEntity();
    registration.email = email;
    registration.name = name;
    registration.additionalInfo = dto.additionalInfo ?? null;
    registration.event = event;
    registration.user = currentUser;

    const saved = await this.registrationRepository.save(registration);
    event.registeredCount++;
    await this.eventRepository.save(event);

    return { registration: saved };
  }

  async unregister(eventId: number, currentUserId: number): Promise<void> {
    const event = await this.findById(eventId);

    const registration = await this.registrationRepository.findOne({
      where: { event: { id: event.id }, user: { id: currentUserId } },
    });

    if (!registration) {
      this.exceptionService.throwHttpException(
        'registration',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.registrationRepository.delete({ id: registration.id });
    event.registeredCount = Math.max(0, event.registeredCount - 1);
    await this.eventRepository.save(event);
  }

  async rate(
    eventId: number,
    currentUser: UserEntity,
    dto: RateEventDto,
  ): Promise<EventEntity> {
    const event = await this.findById(eventId);

    const existing = await this.ratingRepository.findOne({
      where: { event: { id: event.id }, user: { id: currentUser.id } },
    });

    if (existing) {
      this.exceptionService.throwHttpException(
        'rating',
        'already rated, use PATCH to change',
        HttpStatus.BAD_REQUEST,
      );
    }

    const rating = new EventRatingEntity();
    rating.score = dto.score;
    rating.event = event;
    rating.user = currentUser;
    await this.ratingRepository.save(rating);

    return await this.recalculateRating(event);
  }

  async updateRating(
    eventId: number,
    currentUserId: number,
    dto: RateEventDto,
  ): Promise<EventEntity> {
    const event = await this.findById(eventId);

    const existing = await this.ratingRepository.findOne({
      where: { event: { id: event.id }, user: { id: currentUserId } },
    });

    if (!existing) {
      this.exceptionService.throwHttpException(
        'rating',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    existing.score = dto.score;
    await this.ratingRepository.save(existing);

    return await this.recalculateRating(event);
  }

  async removeRating(
    eventId: number,
    currentUserId: number,
  ): Promise<EventEntity> {
    const event = await this.findById(eventId);

    const existing = await this.ratingRepository.findOne({
      where: { event: { id: event.id }, user: { id: currentUserId } },
    });

    if (!existing) {
      this.exceptionService.throwHttpException(
        'rating',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.ratingRepository.delete({ id: existing.id });

    return await this.recalculateRating(event);
  }

  private async recalculateRating(event: EventEntity): Promise<EventEntity> {
    const result = await this.ratingRepository
      .createQueryBuilder('r')
      .select('AVG(r.score)', 'avg')
      .where('r.eventId = :id', { id: event.id })
      .getRawOne<{ avg: string | null }>();

    const avg = result?.avg;
    event.rating = avg ? parseFloat(parseFloat(avg).toFixed(2)) : 0;
    return await this.eventRepository.save(event);
  }

  buildEventResponse(event: EventEntity): EventResponseInterface {
    return { event };
  }
}

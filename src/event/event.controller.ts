import { DeleteResult } from 'typeorm';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import { EventService } from '@app/event/event.service';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { User } from '@app/user/decorators/user.decorator';
import { UserEntity } from '@app/user/user.entity';
import { CreateEventDto } from '@app/event/dto/createEvent.dto';
import { UpdateEventDto } from '@app/event/dto/updateEvent.dto';
import { RegisterEventDto } from '@app/event/dto/registerEvent.dto';
import { RateEventDto } from '@app/event/dto/rateEvent.dto';
import type {
  EventResponseInterface,
  EventsQueryInterface,
  EventsResponseInterface,
  RegistrationResponseInterface,
} from '@app/event/types/event.interfaces';
import { BackendValidationPipe } from '@app/shared/pipes/backendValidation.pipe';

@ApiTags('events')
@ApiExtraModels(CreateEventDto, UpdateEventDto, RegisterEventDto, RateEventDto)
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: 'List events' })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'author', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getEvents(
    @Query() query: EventsQueryInterface,
  ): Promise<EventsResponseInterface> {
    return await this.eventService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event' })
  @ApiParam({ name: 'id', description: 'Event ID.' })
  async getEvent(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventResponseInterface> {
    const event = await this.eventService.findById(id);
    return this.eventService.buildEventResponse(event);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({ summary: 'Create event' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['event'],
      properties: { event: { $ref: getSchemaPath(CreateEventDto) } },
    },
  })
  @UsePipes(new BackendValidationPipe())
  async createEvent(
    @User() currentUser: UserEntity,
    @Body('event') dto: CreateEventDto,
  ): Promise<EventResponseInterface> {
    const event = await this.eventService.create(currentUser, dto);
    return this.eventService.buildEventResponse(event);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id', description: 'Event ID.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['event'],
      properties: { event: { $ref: getSchemaPath(UpdateEventDto) } },
    },
  })
  @UsePipes(new BackendValidationPipe())
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @User('id') currentUserId: number,
    @Body('event') dto: UpdateEventDto,
  ): Promise<EventResponseInterface> {
    const event = await this.eventService.update(id, currentUserId, dto);
    return this.eventService.buildEventResponse(event);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({ summary: 'Delete event' })
  @ApiParam({ name: 'id', description: 'Event ID.' })
  async deleteEvent(
    @Param('id', ParseIntPipe) id: number,
    @User('id') currentUserId: number,
  ): Promise<DeleteResult> {
    return await this.eventService.delete(id, currentUserId);
  }

  @Post(':id/register')
  @ApiOperation({
    summary: 'Register for event',
    description:
      'Authenticated: easy-apply (email/name from profile). Anonymous: email and name required in body.',
  })
  @ApiParam({ name: 'id', description: 'Event ID.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['registration'],
      properties: { registration: { $ref: getSchemaPath(RegisterEventDto) } },
    },
  })
  @UsePipes(new BackendValidationPipe())
  async register(
    @Param('id', ParseIntPipe) id: number,
    @User() currentUser: UserEntity | null,
    @Body('registration') dto: RegisterEventDto,
  ): Promise<RegistrationResponseInterface> {
    return await this.eventService.register(id, dto ?? {}, currentUser);
  }

  @Delete(':id/register')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({ summary: 'Cancel registration (authenticated only)' })
  @ApiParam({ name: 'id', description: 'Event ID.' })
  async unregister(
    @Param('id', ParseIntPipe) id: number,
    @User('id') currentUserId: number,
  ): Promise<void> {
    await this.eventService.unregister(id, currentUserId);
  }

  @Post(':id/rating')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({ summary: 'Rate event' })
  @ApiParam({ name: 'id', description: 'Event ID.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rating'],
      properties: { rating: { $ref: getSchemaPath(RateEventDto) } },
    },
  })
  @UsePipes(new BackendValidationPipe())
  async rate(
    @Param('id', ParseIntPipe) id: number,
    @User() currentUser: UserEntity,
    @Body('rating') dto: RateEventDto,
  ): Promise<EventResponseInterface> {
    const event = await this.eventService.rate(id, currentUser, dto);
    return this.eventService.buildEventResponse(event);
  }

  @Patch(':id/rating')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({ summary: 'Update existing rating' })
  @ApiParam({ name: 'id', description: 'Event ID.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rating'],
      properties: { rating: { $ref: getSchemaPath(RateEventDto) } },
    },
  })
  @UsePipes(new BackendValidationPipe())
  async updateRating(
    @Param('id', ParseIntPipe) id: number,
    @User('id') currentUserId: number,
    @Body('rating') dto: RateEventDto,
  ): Promise<EventResponseInterface> {
    const event = await this.eventService.updateRating(id, currentUserId, dto);
    return this.eventService.buildEventResponse(event);
  }

  @Delete(':id/rating')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiOperation({ summary: 'Remove rating' })
  @ApiParam({ name: 'id', description: 'Event ID.' })
  async removeRating(
    @Param('id', ParseIntPipe) id: number,
    @User('id') currentUserId: number,
  ): Promise<EventResponseInterface> {
    const event = await this.eventService.removeRating(id, currentUserId);
    return this.eventService.buildEventResponse(event);
  }
}

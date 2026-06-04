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
  ApiResponse,
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
  @ApiResponse({ status: 200, description: 'Events returned.' })
  async getEvents(
    @Query() query: EventsQueryInterface,
  ): Promise<EventsResponseInterface> {
    return await this.eventService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event' })
  @ApiParam({ name: 'id', description: 'Event ID.' })
  @ApiResponse({ status: 200, description: 'Event returned.' })
  @ApiResponse({ status: 400, description: 'Event ID is not an integer.' })
  @ApiResponse({ status: 404, description: 'Event was not found.' })
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
  @ApiResponse({ status: 201, description: 'Event created and returned.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 422,
    description:
      'Validation failed (missing/invalid fields, or endDate not after startDate).',
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
  @ApiResponse({ status: 200, description: 'Event updated and returned.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not the event author.',
  })
  @ApiResponse({ status: 404, description: 'Event was not found.' })
  @ApiResponse({
    status: 422,
    description: 'Validation failed or endDate is not after startDate.',
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
  @ApiResponse({ status: 200, description: 'Event deleted.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not the event author.',
  })
  @ApiResponse({ status: 404, description: 'Event was not found.' })
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
  @ApiResponse({ status: 201, description: 'Registration created.' })
  @ApiResponse({
    status: 400,
    description: 'Event is full or the user is already registered.',
  })
  @ApiResponse({ status: 404, description: 'Event was not found.' })
  @ApiResponse({
    status: 422,
    description:
      'Anonymous registration is missing email or name, or fields are invalid.',
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
  @ApiResponse({ status: 200, description: 'Registration cancelled.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Event or registration was not found.',
  })
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
  @ApiResponse({
    status: 201,
    description: 'Rating created and event returned.',
  })
  @ApiResponse({
    status: 400,
    description: 'User has already rated this event; use PATCH to change.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({ status: 404, description: 'Event was not found.' })
  @ApiResponse({
    status: 422,
    description: 'Score is missing or out of the 1-5 range.',
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
  @ApiResponse({
    status: 200,
    description: 'Rating updated and event returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({ status: 404, description: 'Event or rating was not found.' })
  @ApiResponse({
    status: 422,
    description: 'Score is missing or out of the 1-5 range.',
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
  @ApiResponse({
    status: 200,
    description: 'Rating removed and event returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({ status: 404, description: 'Event or rating was not found.' })
  async removeRating(
    @Param('id', ParseIntPipe) id: number,
    @User('id') currentUserId: number,
  ): Promise<EventResponseInterface> {
    const event = await this.eventService.removeRating(id, currentUserId);
    return this.eventService.buildEventResponse(event);
  }
}

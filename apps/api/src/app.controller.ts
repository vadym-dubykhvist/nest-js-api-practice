import { Controller, Get } from '@nestjs/common';
import { AppService } from '@app/app.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Check API status',
    description:
      'Returns a simple response confirming that the API is running.',
  })
  @ApiOkResponse({
    description: 'API status message returned.',
    schema: { example: 'Hello World!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}

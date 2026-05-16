if (!process.env.IS_TS_NODE) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('module-alias/register');
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Nest JS API Practice')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addSecurity('Token', {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Use: Token <jwt>',
    })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documentFactory, {
    useGlobalPrefix: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers via Helmet
  app.use(helmet());

  // CORS Configuration
  app.enableCors({
    origin: [
      process.env.WEB_URL || 'http://localhost:3101',
      'http://localhost:3000',
      'http://localhost:3101',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global Route Prefix
  app.setGlobalPrefix('api');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('RegTracker API')
    .setDescription(
      'Regulatory Crawler & Version Tracking System REST API for automated legal monitoring, structural diffing, and RAG integration'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.PORT || '4101', 10);
  await app.listen(port);
  console.log(`[RegTracker Backend API] running at http://localhost:${port}/api`);
  console.log(`[RegTracker Swagger Docs] available at http://localhost:${port}/api/docs`);
}

bootstrap();

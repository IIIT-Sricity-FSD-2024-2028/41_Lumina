import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Helmet HTTP Security Headers (Industry Standard) ───────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
          fontSrc: [`'self'`, 'https://fonts.gstatic.com'],
          imgSrc: [`'self'`, 'data:', 'https:'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`, 'https://cdn.jsdelivr.net'],
          connectSrc: [`'self'`, 'http://localhost:*', 'ws://localhost:*'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── Global Validation Pipe ─────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Global Exception Filter ────────────────────────────────
  // Catches ALL exceptions across the entire application.
  // Logs errors to console AND persists them to logs/error-YYYY-MM-DD.log
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Dynamic Production-Ready CORS ─────────────────────────
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5500', // VSCode Live Server default
    'http://127.0.0.1:5500',
    'http://127.0.0.1:3000',
  ];
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];
  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow non-browser callers (curl, Postman, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-role'],
  });

  // ── Swagger / OpenAPI Configuration ────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Lumina Academic Planning System')
    .setDescription(
      'REST API for the Lumina Course Enrollment & Academic Planning platform. ' +
      'All protected endpoints require the `x-role` header with a valid role value.',
    )
    .setVersion('1.0.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-role', in: 'header', description: 'RBAC role header' },
      'x-role',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Courses', 'Course catalog endpoints')
    .addTag('Registrations', 'Student enrollment endpoints')
    .addTag('Overrides', 'Administrative override request endpoints')
    .addTag('Announcements', 'Faculty announcements endpoints')
    .addTag('Sections', 'Course section management endpoints')
    .addTag('CourseSlots', 'Timetable slot endpoints')
    .addTag('EnrollmentPhases', 'Enrollment window phase management')
    .addTag('Policies', 'Academic policy management endpoints')
    .addTag('SuperUser', 'Super User / Top Admin monitoring and log audit endpoints')
    .build();


  const document = SwaggerModule.createDocument(app, config);

  // Export swagger.json to back-end/docs/
  const docsDir = path.resolve(__dirname, '..', 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(docsDir, 'swagger.json'),
    JSON.stringify(document, null, 2),
  );

  // Serve Swagger UI at /api
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

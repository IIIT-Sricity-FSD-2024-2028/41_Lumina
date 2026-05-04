import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global Validation Pipe ─────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── CORS ───────────────────────────────────────────────────
  app.enableCors();

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

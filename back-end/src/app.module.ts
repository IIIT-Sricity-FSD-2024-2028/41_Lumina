import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { RolesGuard } from './common/guards/roles.guard';
import { UsersModule } from './database/users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { OverridesModule } from './overrides/overrides.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SectionsModule } from './sections/sections.module';
import { CourseSlotsModule } from './course-slots/course-slots.module';
import { EnrollmentPhasesModule } from './enrollment-phases/enrollment-phases.module';
import { DegreeRequirementsModule } from './degree-requirements/degree-requirements.module';
import { PoliciesModule } from './policies/policies.module';
import { SuperUserModule } from './super-user/super-user.module';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { RouteMiddleware } from './common/middleware/route.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    RegistrationsModule,
    OverridesModule,
    AnnouncementsModule,
    SectionsModule,
    CourseSlotsModule,
    EnrollmentPhasesModule,
    DegreeRequirementsModule,
    PoliciesModule,
    SuperUserModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // 1. SecurityMiddleware runs first to set defensive headers and sanitize payloads
    // 2. LoggingMiddleware runs next to track latency and write logs
    // 3. RouteMiddleware runs to intercept route-level calls, attach context, and validate x-role
    consumer
      .apply(SecurityMiddleware, LoggingMiddleware, RouteMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

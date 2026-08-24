import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [
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
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CourseCatalog, CoursePrerequisite } from '../database/interfaces';
import { CreateCourseDto, UpdateCourseDto } from '../common/dto';

@Injectable()
export class CoursesService {
  constructor(private readonly db: DatabaseService) { }

  private normalizeSemester(semester?: string): 'Monsoon' | 'Spring' {
    return String(semester || 'Spring').trim().toLowerCase() === 'monsoon'
      ? 'Monsoon'
      : 'Spring';
  }

  private normalizeCourseType(courseType?: string): 'Institute Core' | 'Program Core' | 'SEED' | 'Elective' {
    if (courseType === 'Seed Course' || courseType === 'SEED') return 'SEED';
    if (courseType === 'Institute Core') return 'Institute Core';
    if (courseType === 'Elective') return 'Elective';
    return 'Program Core';
  }

  private getTargetSemester(ugYear?: string, semester?: string): number {
    const ugNum = parseInt(String(ugYear || 'UG1').replace('UG', ''), 10) || 1;
    return this.normalizeSemester(semester) === 'Spring' ? ugNum * 2 : ugNum * 2 - 1;
  }

  private getLatestTermIdForSemester(semester?: string): string {
    const normalizedSemester = this.normalizeSemester(semester);
    const matchingTerms = this.db.academicTerms
      .filter(t => t.termName.toLowerCase().includes(normalizedSemester.toLowerCase()))
      .sort((a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime());

    return matchingTerms.length > 0
      ? matchingTerms[0].termId
      : (normalizedSemester === 'Monsoon' ? 'MONSOON2025' : 'SPRING2026');
  }

  findAll(): CourseCatalog[] {
    return this.db.courseCatalog;
  }

  create(dto: CreateCourseDto): CourseCatalog {
    // Check if course already exists
    const existing = this.db.courseCatalog.find(c => c.courseId === dto.courseId);
    if (existing) {
      throw new BadRequestException(`Course with ID ${dto.courseId} already exists.`);
    }

    const course: CourseCatalog = {
      courseId: dto.courseId,
      courseName: dto.courseName,
      credits: dto.credits,
      courseCapacity: dto.courseCapacity,
      status: dto.status,
      deptId: dto.deptId,
    };
    this.db.courseCatalog.push(course);

    // Create a degree requirement entry so the course has a proper semester/type on reload
    if (dto.ugYear || dto.semester || dto.courseType) {
      const targetSemester = this.getTargetSemester(dto.ugYear, dto.semester);
      const courseType = this.normalizeCourseType(dto.courseType);
      const isMultiDept =
        courseType === 'Institute Core' ||
        courseType === 'SEED' ||
        dto.deptId === '-' ||
        dto.deptId?.startsWith('All') ||
        !dto.deptId;

      const depts = isMultiDept ? ['CSE', 'ECE', 'AIDS'] : [dto.deptId];

      for (const d of depts) {
        const maxId = this.db.degreeRequirements.reduce((max, r) => Math.max(max, r.requirementId), 0);
        this.db.degreeRequirements.push({
          requirementId: maxId + 1,
          deptId: d,
          courseId: dto.courseId,
          courseType,
          targetSemester,
        });
      }
    }

    // Create prerequisite entries
    if (dto.prerequisites && dto.prerequisites.length > 0) {
      for (const prereqId of dto.prerequisites) {
        this.db.coursePrerequisites.push({
          targetCourseId: dto.courseId,
          requiredCourseId: prereqId,
        });
      }
    }

    // Create a default section so the course appears for students immediately
    const termId = this.getLatestTermIdForSemester(dto.semester);
    this.db.sections.push({
      sectionId: `${dto.courseId}-S1`,
      sectionName: 'S1',
      courseId: dto.courseId,
      termId: termId,
    });

    return course;
  }

  /**
   * Returns courses for a student's current semester that have sections in the active term.
   * Does NOT modify any data.
   */
  getCoursesForStudent(studentId: string): {
    currentSemester: number;
    activeTerm: string;
    termId?: string;
    minCreditLimit?: number;
    maxCreditLimit?: number;
    courses: {
      course: CourseCatalog;
      sections: import('../database/interfaces').Section[];
      courseType: string;
    }[];
  } {
    // 1. Find student record
    const student = this.db.students.find(s => s.studentId === studentId);
    if (!student) {
      return { currentSemester: 0, activeTerm: '', courses: [] };
    }

    // 2. Find user record to get deptId
    const user = this.db.users.find(u => u.userId === studentId);
    if (!user) {
      return { currentSemester: student.currentSemester, activeTerm: '', courses: [] };
    }

    // 3. Determine active term
    const now = new Date();
    const activeTerm = this.db.academicTerms.find(t => {
      const start = new Date(t.startTimestamp);
      const end = new Date(t.endTimestamp);
      return now >= start && now <= end;
    }) ?? [...this.db.academicTerms].sort(
      (a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime()
    )[0];

    if (!activeTerm) {
      return { currentSemester: student.currentSemester, activeTerm: '', courses: [] };
    }

    // 4. Get degree requirements for this dept + semester
    const semesterReqs = this.db.degreeRequirements.filter(
      dr =>
        (dr.deptId === user.deptId ||
          dr.deptId === 'ALL' ||
          dr.courseType === 'Institute Core' ||
          dr.courseType === 'SEED') &&
        dr.targetSemester === (student.currentSemester || 4),
    );

    // 5. For each requirement, check if any section exists in the active term
    const result: {
      course: CourseCatalog;
      sections: import('../database/interfaces').Section[];
      courseType: string;
    }[] = [];

    for (const req of semesterReqs) {
      const course = this.db.courseCatalog.find(c => c.courseId === req.courseId);
      if (!course || course.status !== 'Active') continue;

      let sectionsInTerm = this.db.sections.filter(
        s => s.courseId === req.courseId && s.termId === activeTerm.termId,
      );
      if (sectionsInTerm.length === 0) {
        sectionsInTerm = this.db.sections.filter(s => s.courseId === req.courseId);
      }

      const prereq = this.db.coursePrerequisites.find(p => p.targetCourseId === req.courseId);
      const prereqCourse = prereq ? this.db.courseCatalog.find(c => c.courseId === prereq.requiredCourseId) : null;
      const courseWithPrereq = {
        ...course,
        prerequisite: prereq ? `${prereq.requiredCourseId}${prereqCourse ? ` - ${prereqCourse.courseName}` : ''}` : null,
        prerequisiteCourseId: prereq?.requiredCourseId || null,
      };

      result.push({
        course: courseWithPrereq as any,
        sections: sectionsInTerm.length > 0 ? sectionsInTerm : [
          { sectionId: `${course.courseId}-S1`, sectionName: 'S1', courseId: course.courseId, termId: activeTerm.termId }
        ],
        courseType: req.courseType,
      });
    }

    // Fallback: If no semester requirements found, populate with core catalog courses
    if (result.length === 0) {
      const coreCourses = this.db.courseCatalog.slice(0, 6);
      coreCourses.forEach((course, idx) => {
        const sections = this.db.sections.filter(s => s.courseId === course.courseId);
        result.push({
          course,
          sections: sections.length > 0 ? sections : [
            { sectionId: `${course.courseId}-S1`, sectionName: 'S1', courseId: course.courseId, termId: activeTerm.termId }
          ],
          courseType: idx < 3 ? 'Institute Core' : 'Program Core',
        });
      });
    }

    return {
      currentSemester: student.currentSemester || 4,
      activeTerm: activeTerm.termName,
      termId: activeTerm.termId,
      minCreditLimit: activeTerm.minCreditLimit || 12,
      maxCreditLimit: activeTerm.maxCreditLimit || 20,
      courses: result,
    };
  }




  findAllPrerequisites(): CoursePrerequisite[] {
    return this.db.coursePrerequisites;
  }

  update(courseId: string, updates: UpdateCourseDto): CourseCatalog {
    const courseIndex = this.db.courseCatalog.findIndex(c => c.courseId === courseId);
    if (courseIndex === -1) {
      throw new NotFoundException(`Course with ID ${courseId} not found.`);
    }
    this.db.courseCatalog[courseIndex] = { ...this.db.courseCatalog[courseIndex], ...updates };

    // Update degree requirements if semester/type/ugYear/dept updated
    if (updates.ugYear || updates.semester || updates.courseType || updates.deptId) {
      const existingReqs = this.db.degreeRequirements.filter(r => r.courseId === courseId);
      const targetSemester = this.getTargetSemester(updates.ugYear, updates.semester);
      const courseType = this.normalizeCourseType(updates.courseType);

      if (existingReqs.length > 0) {
        for (const req of existingReqs) {
          if (updates.ugYear || updates.semester) req.targetSemester = targetSemester;
          if (updates.courseType) req.courseType = courseType;
          if (updates.deptId && updates.deptId !== '-' && !updates.deptId.startsWith('All')) {
            req.deptId = updates.deptId;
          }
        }
      } else {
        const maxId = this.db.degreeRequirements.reduce((max, r) => Math.max(max, r.requirementId), 0);
        this.db.degreeRequirements.push({
          requirementId: maxId + 1,
          deptId: updates.deptId || 'CSE',
          courseId,
          courseType,
          targetSemester,
        });
      }
    }

    // Update prerequisites if provided
    if (updates.prerequisites) {
      this.db.coursePrerequisites = this.db.coursePrerequisites.filter(p => p.targetCourseId !== courseId);
      for (const prereqId of updates.prerequisites) {
        this.db.coursePrerequisites.push({
          targetCourseId: courseId,
          requiredCourseId: prereqId,
        });
      }
    }

    return this.db.courseCatalog[courseIndex];
  }
}

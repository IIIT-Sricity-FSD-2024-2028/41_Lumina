import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CourseCatalog } from '../database/interfaces';

@Injectable()
export class CoursesService {
  constructor(private readonly db: DatabaseService) { }

  findAll(): CourseCatalog[] {
    return this.db.courseCatalog;
  }

  create(course: CourseCatalog): CourseCatalog {
    // Check if course already exists
    const existing = this.db.courseCatalog.find(c => c.courseId === course.courseId);
    if (existing) {
      throw new BadRequestException(`Course with ID ${course.courseId} already exists.`);
    }
    this.db.courseCatalog.push(course);
    return course;
  }

  /**
   * Returns courses for a student's current semester that have sections in the active term.
   * Does NOT modify any data.
   */
  getCoursesForStudent(studentId: string): {
    currentSemester: number;
    activeTerm: string;
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
      dr => dr.deptId === user.deptId && dr.targetSemester === student.currentSemester,
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

      const sectionsInTerm = this.db.sections.filter(
        s => s.courseId === req.courseId && s.termId === activeTerm.termId,
      );

      // Only include courses that have at least one section in the active term
      if (sectionsInTerm.length === 0) continue;

      result.push({
        course,
        sections: sectionsInTerm,
        courseType: req.courseType,
      });
    }

    return {
      currentSemester: student.currentSemester,
      activeTerm: activeTerm.termName,
      courses: result,
    };
  }



  update(courseId: string, updates: Partial<CourseCatalog>): CourseCatalog {
    const courseIndex = this.db.courseCatalog.findIndex(c => c.courseId === courseId);
    if (courseIndex === -1) {
      throw new NotFoundException(`Course with ID ${courseId} not found.`);
    }
    this.db.courseCatalog[courseIndex] = { ...this.db.courseCatalog[courseIndex], ...updates };
    return this.db.courseCatalog[courseIndex];
  }
}
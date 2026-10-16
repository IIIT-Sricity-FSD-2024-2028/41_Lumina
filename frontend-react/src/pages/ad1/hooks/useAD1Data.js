/**
 * useAD1Data — custom hook that fetches & transforms all data needed by Deal1 pages.
 *
 * Replaces the legacy loadData() / fetchDean1Data() pipeline.
 * Uses the existing React service layer instead of raw fetch().
 */
import { useState, useEffect, useCallback } from 'react';
import { coursesService } from '../../../services/courses.service';
import { usersService } from '../../../services/users.service';
import { registrationsService } from '../../../services/registrations.service';
import { sectionsService } from '../../../services/sections.service';
import { slotsService } from '../../../services/slots.service';
import {
  buildAppCourses,
  buildFaculty,
  buildStudentRecords,
  buildTimetable,
  buildRooms,
  buildRecentActivities,
} from '../utils/dataTransforms';

/**
 * Maps the camelCase API response into the PascalCase table rows
 * expected by the legacy builder functions.
 */
function mapCourses(courses) {
  return (courses || []).map((c) => ({
    Course_ID: c.courseId,
    Course_Name: c.courseName,
    Credits: c.credits,
    Course_Capacity: c.courseCapacity,
    Status: c.status,
    Dept_ID: c.deptId,
  }));
}

function mapUsers(users) {
  return (users || []).map((u) => ({
    User_ID: u.userId,
    Full_Name: u.fullName,
    Email: u.email,
    Role: u.role,
    Dept_ID: u.deptId,
  }));
}

function mapRegistrations(regs) {
  return (regs || []).map((r) => ({
    Enrollment_ID: r.enrollmentId,
    Student_ID: r.studentId,
    Course_ID: r.courseId,
    Term_ID: r.termId,
    Section_ID: r.sectionId,
    Status: r.status,
    Final_Grade: r.finalGrade,
  }));
}

function mapSections(sections) {
  return (sections || []).map((s) => ({
    Section_ID: s.sectionId,
    Section_Name: s.sectionName,
    Course_ID: s.courseId,
    Term_ID: s.termId,
  }));
}

function mapSlots(slots) {
  return (slots || []).map((s) => ({
    Slot_ID: s.slotId,
    Section_ID: s.sectionId,
    Faculty_ID: s.facultyId,
    Room_Number: s.roomNumber,
    Day_of_Week: s.dayOfWeek,
    Start_Time: s.startTime,
    End_Time: s.endTime,
    Syllabus: s.syllabus,
  }));
}

function mapDegreeRequirements(reqs) {
  return (reqs || []).map((dr) => ({
    Requirement_ID: dr.requirementId,
    Dept_ID: dr.deptId,
    Course_ID: dr.courseId,
    Course_Type: dr.courseType === 'SEED' ? 'Seed Course' : dr.courseType,
    Target_Semester: dr.targetSemester,
  }));
}

function mapPrerequisites(prereqs) {
  return (prereqs || []).map((p) => ({
    Target_Course_ID: p.targetCourseId,
    Required_Course_ID: p.requiredCourseId,
  }));
}



export default function useAD1Data() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [
        coursesRaw,
        usersRaw,
        regsRaw,
        sectionsRaw,
        slotsRaw,
        degreeReqRaw,
        prereqRaw,
      ] = await Promise.all([
        coursesService.getAll(),
        usersService.getAll(),
        registrationsService.getAll(),
        sectionsService.getAll(),
        slotsService.getAll(),
        coursesService.getDegreeRequirements().catch(() => []),
        coursesService.getPrerequisites().catch(() => []),
      ]);

      const courses = mapCourses(coursesRaw);
      const users = mapUsers(usersRaw);
      const registrations = mapRegistrations(regsRaw);
      const sections = mapSections(sectionsRaw);
      const slots = mapSlots(slotsRaw);
      const requirements = mapDegreeRequirements(degreeReqRaw);
      const prerequisites = mapPrerequisites(prereqRaw);

      const appCourses = buildAppCourses(courses, requirements, prerequisites, sections);
      const faculty = buildFaculty(users, slots, sections, appCourses);
      const students = buildStudentRecords(registrations, users, sections, appCourses);
      const timetable = buildTimetable(slots, sections, users);
      const rooms = buildRooms(slots);
      const recentActivities = buildRecentActivities(registrations, courses, slots, users);
      const departments = [...new Set(courses.map((c) => c.Dept_ID).filter(Boolean))];

      setData({
        courses: appCourses,
        faculty,
        students,
        timetable,
        rooms,
        recentActivities,
        departments,
        // Keep raw data for direct manipulation / re-mapping
        _raw: { courses, users, registrations, sections, slots, requirements, prerequisites },
      });
      setError(null);
    } catch (err) {
      console.error('AD1 data fetch error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        await fetchData();
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load data');
      }
    })();

    return () => {
      ignore = true;
    };
  }, [fetchData]);

  return { data, loading, error, refetch, setData };
}

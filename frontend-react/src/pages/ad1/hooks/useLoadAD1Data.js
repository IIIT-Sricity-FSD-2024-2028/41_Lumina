import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadAD1Planning } from '../../../store/ad1/ad1-actions';
import {
  buildAppCourses, buildFaculty, buildRecentActivities, buildRooms, buildStudentRecords, buildTimetable,
} from '../utils/dataTransforms';

export default function useLoadAD1Data() {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.auth.user);
  const { data: planning, loading, error, writing, savingAssignments } = useSelector(
    (state) => state.ad1Planning,
  );

  const data = useMemo(() => {
    if (!planning) return null;
    const { courses, users, registrations, sections, slots, requirements, prerequisites } = planning;
    const appCourses = buildAppCourses(courses, requirements, prerequisites, sections);
    return {
      courses: appCourses,
      faculty: buildFaculty(users, slots, sections, appCourses),
      students: buildStudentRecords(registrations, users, sections, appCourses),
      timetable: buildTimetable(slots, sections, users),
      rooms: buildRooms(slots),
      recentActivities: buildRecentActivities(registrations, courses, slots, users),
      departments: [...new Set(courses.map((course) => course.Dept_ID).filter(Boolean))],
      sections,
    };
  }, [planning]);

  useEffect(() => {
    if (session) dispatch(loadAD1Planning());
  }, [dispatch, session]);

  return {
    data,
    loading: loading || (!planning && !error),
    error,
    writing,
    savingAssignments,
  };
}

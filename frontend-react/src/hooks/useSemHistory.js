import { useState, useEffect } from 'react';
import { fallbackSemHistory } from '../data/roadmapData';

const ROADMAP_API = 'http://localhost:3000';

export function useSemHistory() {
  const [semHistory, setSemHistory] = useState(fallbackSemHistory);

  useEffect(() => {
    async function loadHistory() {
      try {
        const session = localStorage.getItem('Lumina_Session');
        const user = session ? JSON.parse(session) : null;
        const headers = { 'x-role': user ? user.Role : 'Student' };
        const studentId = user ? user.User_ID : 'S2024002';

        const [regRes, catRes] = await Promise.all([
          fetch(`${ROADMAP_API}/registrations`, { headers }).catch(() => null),
          fetch(`${ROADMAP_API}/courses`, { headers }).catch(() => null)
        ]);

        if (regRes?.ok && catRes?.ok) {
          const registrations = await regRes.json();
          const catalog = await catRes.json();

          const sem3Regs = registrations.filter(
            (r) => r.studentId === studentId || r.Student_ID === studentId
          );

          if (sem3Regs.length > 0) {
            const sem3Courses = sem3Regs.map((r) => {
              const cId = r.courseId || r.Course_ID;
              const found = catalog.find((c) => c.courseId === cId || c.Course_ID === cId) || {};
              return {
                name: found.courseName || found.Course_Name || cId,
                credits: found.credits || 4
              };
            });

            const sem3Credits = sem3Courses.reduce((sum, c) => sum + c.credits, 0);

            setSemHistory((prev) => ({
              ...prev,
              3: {
                ...prev[3],
                courses: sem3Courses,
                totalCredits: sem3Credits
              }
            }));
          }
        }
      } catch (err) {
        console.warn('API error, using fallback:', err);
      }
    }

    loadHistory();
  }, []);

  return { semHistory };
}

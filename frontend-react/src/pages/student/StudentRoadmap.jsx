import AppShell from '../../components/common/AppShell';
import AcademicRoadmap from './AcademicRoadmap';
import { useAuth } from '../../context/AuthContext';

export default function StudentRoadmap() {
  const { user } = useAuth();

  return (
    <AppShell>
      <AcademicRoadmap studentUser={user} />
    </AppShell>
  );
}

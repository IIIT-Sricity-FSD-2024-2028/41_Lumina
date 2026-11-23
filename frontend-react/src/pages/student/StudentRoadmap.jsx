import { useSelector } from 'react-redux';
import AppShell from '../../components/common/AppShell';
import AcademicRoadmap from './AcademicRoadmap';

export default function StudentRoadmap() {
  const user = useSelector((state) => state.auth.user);

  return (
    <AppShell>
      <AcademicRoadmap studentUser={user} />
    </AppShell>
  );
}

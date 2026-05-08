import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { FilterBar } from './FilterBar';
import { useData } from '../hooks/useData';

export function Layout() {
  const { events } = useData();
  return (
    <div>
      <Navbar />
      <FilterBar events={events} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

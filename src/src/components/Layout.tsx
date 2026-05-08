import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useData } from '../hooks/useData';

export function Layout() {
  const { events } = useData();
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar events={events} />
        <main style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { BooksPage } from './pages/BooksPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoansPage } from './pages/LoansPage';
import { MembersPage } from './pages/MembersPage';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/books', label: 'Books', icon: '📚' },
  { to: '/members', label: 'Members', icon: '👥' },
  { to: '/loans', label: 'Loans', icon: '🔄' },
];

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">📖</span>
          <span>Library MS</span>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className="nav-link">
              <span aria-hidden>{link.icon}</span> {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

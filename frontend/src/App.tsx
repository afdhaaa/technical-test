import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Login } from './pages/Login';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployeeHistory } from './pages/EmployeeHistory';
import { AdminEmployees } from './pages/AdminEmployees';
import { AdminMonitoring } from './pages/AdminMonitoring';
import { AdminReports } from './pages/AdminReports';
import { Clock, Calendar, LayoutDashboard, FileSpreadsheet, Users, LogOut } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN_HRD') {
        setCurrentTab('monitoring');
      } else {
        setCurrentTab('attendance');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          color: '#71717a',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        Memuat Dexa HRIS...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Enterprise Sidebar with Mobile Drawer Support */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main View Area */}
      <div className="main-content-wrapper">
        {/* Topbar with Breadcrumbs, Live Clock, and Hamburger Toggle */}
        <Topbar currentTab={currentTab} onMenuClick={() => setIsMobileNavOpen(true)} />

        {/* Content Area */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {user.role === 'ADMIN_HRD' ? (
            <>
              {currentTab === 'monitoring' && <AdminMonitoring />}
              {currentTab === 'reports' && <AdminReports />}
              {currentTab === 'employees' && <AdminEmployees />}
            </>
          ) : (
            <>
              {currentTab === 'attendance' && <EmployeeDashboard />}
              {currentTab === 'history' && <EmployeeHistory />}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar for Instant Mobile Thumb Access */}
        <nav className="mobile-bottom-nav">
          {user.role === 'ADMIN_HRD' ? (
            <>
              <button
                type="button"
                className={`mobile-bottom-nav-item ${currentTab === 'monitoring' ? 'active' : ''}`}
                onClick={() => setCurrentTab('monitoring')}
              >
                <LayoutDashboard size={18} />
                <span>Monitoring</span>
              </button>
              <button
                type="button"
                className={`mobile-bottom-nav-item ${currentTab === 'reports' ? 'active' : ''}`}
                onClick={() => setCurrentTab('reports')}
              >
                <FileSpreadsheet size={18} />
                <span>Laporan</span>
              </button>
              <button
                type="button"
                className={`mobile-bottom-nav-item ${currentTab === 'employees' ? 'active' : ''}`}
                onClick={() => setCurrentTab('employees')}
              >
                <Users size={18} />
                <span>Karyawan</span>
              </button>
              <button
                type="button"
                className="mobile-bottom-nav-item"
                onClick={logout}
                style={{ color: '#dc2626' }}
              >
                <LogOut size={18} />
                <span>Keluar</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`mobile-bottom-nav-item ${currentTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setCurrentTab('attendance')}
              >
                <Clock size={18} />
                <span>Presensi</span>
              </button>
              <button
                type="button"
                className={`mobile-bottom-nav-item ${currentTab === 'history' ? 'active' : ''}`}
                onClick={() => setCurrentTab('history')}
              >
                <Calendar size={18} />
                <span>Riwayat</span>
              </button>
              <button
                type="button"
                className="mobile-bottom-nav-item"
                onClick={logout}
                style={{ color: '#dc2626' }}
              >
                <LogOut size={18} />
                <span>Keluar</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;

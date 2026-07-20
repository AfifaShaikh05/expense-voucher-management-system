import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import CreateVoucher from './pages/employee/CreateVoucher';
import VoucherDetails from './pages/employee/VoucherDetails';
import EditVoucher from './pages/employee/EditVoucher';

// Director pages
import DirectorDashboard from './pages/director/DirectorDashboard';
import DirectorVouchers from './pages/director/DirectorVouchers';
import DirectorPendingVouchers from './pages/director/DirectorPendingVouchers';
import DirectorVoucherDetail from './pages/director/DirectorVoucherDetail';

// Accounts pages
import AccountsDashboard from './pages/accounts/AccountsDashboard';
import AccountsVouchers from './pages/accounts/AccountsVouchers';
import AccountsVoucherDetail from './pages/accounts/AccountsVoucherDetail';

// Utility pages
import NotFoundPage from './pages/NotFoundPage';
import NotAuthorizedPage from './pages/NotAuthorizedPage';

function App() {
  return (
    // BrowserRouter must wrap AuthProvider so useNavigate() works inside AuthContext
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Default: redirect root to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public: Login — redirects away if already authenticated (handled inside LoginPage) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Utility */}
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />

          {/* ── Employee Routes ────────────────────────────────── */}
          <Route path="/employee/dashboard" element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employee/vouchers" element={
            <Navigate to="/employee/dashboard" replace />
          } />
          <Route path="/employee/vouchers/create" element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <CreateVoucher />
            </ProtectedRoute>
          } />
          <Route path="/employee/vouchers/:id" element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <VoucherDetails />
            </ProtectedRoute>
          } />
          <Route path="/employee/vouchers/:id/edit" element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EditVoucher />
            </ProtectedRoute>
          } />

          {/* ── Director Routes ────────────────────────────────── */}
          <Route path="/director/dashboard" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <DirectorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/director/vouchers/pending" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <DirectorPendingVouchers />
            </ProtectedRoute>
          } />
          <Route path="/director/vouchers" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <DirectorVouchers />
            </ProtectedRoute>
          } />
          <Route path="/director/vouchers/:id" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <DirectorVoucherDetail />
            </ProtectedRoute>
          } />

          {/* ── Accounts Routes ────────────────────────────────── */}
          <Route path="/accounts/dashboard" element={
            <ProtectedRoute allowedRoles={['ACCOUNTS']}>
              <AccountsDashboard />
            </ProtectedRoute>
          } />
          <Route path="/accounts/vouchers" element={
            <ProtectedRoute allowedRoles={['ACCOUNTS']}>
              <AccountsVouchers />
            </ProtectedRoute>
          } />
          <Route path="/accounts/vouchers/:id" element={
            <ProtectedRoute allowedRoles={['ACCOUNTS']}>
              <AccountsVoucherDetail />
            </ProtectedRoute>
          } />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

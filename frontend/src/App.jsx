import { BrowserRouter, Routes, Route } from 'react-router';
import AuthProvider from './auth/AuthContext.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import AuditFormPage from './pages/AuditFormPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import RecordPage from './pages/RecordPage.jsx';
import PeoplePage from './pages/PeoplePage.jsx';
import AuditDetailPage from './pages/AuditDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NewUserPage from './pages/users/NewUserPage.jsx';
import ProfilePage from './pages/users/ProfilePage.jsx';
import ProfileRecordPage from './pages/users/ProfileRecordPage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import RequireRole from './auth/RequireRole.jsx';
import { ROLES } from './constants/roles.js';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/usuarios/nuevo" element={<NewUserPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/historial" element={<ProfileRecordPage />} />
              <Route path="/registro/:auditId" element={<AuditDetailPage />} />
              <Route element={<RequireRole roles={[ROLES.ADMIN]} />}>
                <Route path="/usuarios" element={<UsersPage />} />
                <Route path="/registro" element={<RecordPage />} />
                <Route path="/personas" element={<PeoplePage />} />
                <Route path="/audits/new/:questionnaireKey" element={<AuditFormPage />} />
                <Route path="/audits/:auditId" element={<ChatPage />} />
                <Route path="/audits/:auditId/result" element={<ResultPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

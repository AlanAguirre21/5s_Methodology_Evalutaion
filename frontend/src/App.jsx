import { BrowserRouter, Routes, Route } from 'react-router';
import AppLayout from './components/layout/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import AuditFormPage from './pages/AuditFormPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ResultPage from './pages/ResultPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/audits/new/:questionnaireKey" element={<AuditFormPage />} />
        <Route path="/audits/:auditId" element={<ChatPage />} />
        <Route path="/audits/:auditId/result" element={<ResultPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
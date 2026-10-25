import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { ProblemsPage } from './pages/ProblemsPage';
import { ProblemDetailPage } from './pages/ProblemDetailPage';
import { InterviewsPage } from './pages/InterviewsPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { CurriculumPage } from './pages/CurriculumPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { AITutorPage } from './pages/AITutorPage';
import { RevisionPage } from './pages/RevisionPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { AssessmentTakePage } from './pages/AssessmentTakePage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage, SignupPage, ForgotPasswordPage } from './pages/AuthPages';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 font-sans selection:bg-indigo-600/30 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public & Core Product Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/problems" element={<ProblemsPage />} />
              <Route path="/problems/:slug" element={<ProblemDetailPage />} />
              
              {/* Live Collaborative Interview Rooms */}
              <Route path="/interviews" element={<InterviewsPage />} />
              <Route path="/interviews/:roomId" element={<InterviewRoomPage />} />

              {/* Technical Curriculum & Deep-Dives */}
              <Route path="/learn" element={<CurriculumPage />} />
              <Route path="/learn/:track/:topic" element={<TopicDetailPage />} />

              {/* AI Tutoring with Gemini */}
              <Route path="/ai-tutor" element={<AITutorPage />} />

              {/* Personalized Revision & Flashcards */}
              <Route path="/revision" element={<RevisionPage />} />

              {/* Benchmark Assessments */}
              <Route path="/assessments" element={<AssessmentsPage />} />
              <Route path="/assessments/:id" element={<AssessmentTakePage />} />

              {/* Video Learning Hub */}
              <Route path="/resources" element={<ResourcesPage />} />

              {/* Downloadable Reports & Analytics */}
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />

              {/* Profile & Settings */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* Admin & System Health */}
              <Route path="/admin" element={<AdminPage />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

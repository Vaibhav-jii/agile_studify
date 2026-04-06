import React, { useState, useEffect } from 'react';
import { LoginPage } from '../features/auth/LoginPage';
import { HomePage } from '../features/home/HomePage';
import { LandingView } from '../features/landing/LandingView';
import { DashboardView } from '../features/dashboard/DashboardView';
import { LibraryView } from '../features/library/LibraryView';
import { AnalyzeView } from '../features/analyze/AnalyzeView';
import { PlannerView } from '../features/planner/PlannerView';
import { QuizView } from '../features/quiz/QuizView';
import { CalendarView } from '../features/planner/CalendarView';
import { SettingsView } from '../features/settings/SettingsView';
import { Sidebar, MobileNav } from '../components/layout/Sidebar';
import { AnalysisModal } from '../features/analyze/components/AnalysisModal';
import { Toast, useToast } from '../components/feedback/Toast';
import { TeacherInbox } from '../features/prs/TeacherInbox';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { getAllUploadedFiles } from '../services/fileUploadService';
import { useAuth } from '../context/AuthContext';

export default function App() {
  const [appMode, setAppMode] = useState<'dark' | 'light'>('light'); // Light = proper routing structure
  
  const { user } = useAuth();
  const isSignedIn = !!user;

  // Render state
  const [showLogin, setShowLogin] = useState(false);
  const [activeView, setActiveView] = useState<string>('library'); // Start at library to see Sprint 1 features
  const [analyzingResourceId, setAnalyzingResourceId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    // Always use dark theme - remove light theme class
    document.body.classList.remove('light-theme');
  }, [appMode]);

  const handleGetStarted = () => {
    setShowLogin(true);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setActiveView('library');
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const handleAnalyze = (id: string) => {
    setAnalyzingResourceId(id);
  };

  const handleAddToPlan = (id: string) => {
    showToast('Material added to study plan', 'success');
  };

  const handleAnalysisComplete = (result: any) => {
    showToast('Analysis complete! Material added to library.', 'success');
    setAnalyzingResourceId(null);
  };

  // Use the light mode structure (proper routing) but with dark theme styling
  // This gives us access to Sprint 1 features with dark UI

  // Show landing page or login page if not signed in
  if (!isSignedIn) {
    if (showLogin) {
      return <LoginPage onLogin={handleLoginSuccess} />;
    }
    return <LandingView onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen">
      <div className="flex">
        {/* Sidebar - Desktop */}
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-[1320px] mx-auto">
            {activeView === 'dashboard' && <DashboardView onNavigate={handleViewChange} />}
            {activeView === 'library' && (
              <LibraryView onAnalyze={handleAnalyze} onAddToPlan={handleAddToPlan} />
            )}
            {activeView === 'analyze' && <AnalyzeView />}
            {activeView === 'planner' && <PlannerView />}
            {activeView === 'quiz' && <QuizView />}
            {activeView === 'calendar' && <CalendarView />}
            {activeView === 'settings' && <SettingsView />}
            {activeView === 'inbox' && <TeacherInbox />}
            {activeView === 'admin' && <AdminDashboard />}
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNav activeView={activeView} onViewChange={handleViewChange} />
      </div>

      {/* Analysis Modal */}
      <AnalysisModal
        isOpen={analyzingResourceId !== null}
        onClose={() => setAnalyzingResourceId(null)}
        fileName={`Resource ${analyzingResourceId}`}
        onComplete={handleAnalysisComplete}
        fileMetadata={analyzingResourceId ? (() => {
          const uploadedFiles = getAllUploadedFiles();
          const file = uploadedFiles.find(f => f.id === analyzingResourceId);
          return file?.metadata;
        })() : undefined}
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}

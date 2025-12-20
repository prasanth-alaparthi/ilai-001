import './i18n'; // Initialize i18n for multi-language support
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { UserProvider } from './state/UserContext';
import { ParentalProvider } from './state/ParentalLockContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import ModernLayout from './layouts/ModernLayout';
import NoteViewerFull from "./pages/NoteViewerFull";

import ErrorBoundary from './components/ErrorBoundary';

// Lazy loaded pages
const HomePage = lazy(() => import('./pages/home'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const NotesHome = lazy(() => import('./pages/NotesHome'));
const Library = lazy(() => import('./pages/Library'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const AuthPage = lazy(() => import('./pages/auth'));
const ParentSettings = lazy(() => import('./pages/ParentSettings'));
const VerifyEmailPage = lazy(() => import('./pages/verify-email'));
const PendingVerificationPage = lazy(() => import('./pages/PendingVerification'));
const JournalPage = lazy(() => import('./pages/JournalHome'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPassword'));
const Chat = lazy(() => import('./pages/Chat'));
const NoteEditPage = lazy(() => import('./pages/NoteEditPage'));
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'));
const MyAccount = lazy(() => import('./pages/MyAccount'));
const UniversalEngine = lazy(() => import('./pages/UniversalEngine'));

const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Groups = lazy(() => import('./pages/Groups'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const AssignmentDetail = lazy(() => import('./pages/AssignmentDetail'));
const GradingView = lazy(() => import('./pages/GradingView'));
const OAuth2RedirectHandler = lazy(() => import('./pages/OAuth2RedirectHandler'));
const FeedCustomization = lazy(() => import('./pages/FeedCustomization'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Checkout = lazy(() => import('./pages/Checkout'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const DeepResearch = lazy(() => import('./pages/DeepResearch'));
const StudySearchPage = lazy(() => import('./pages/StudySearchPage'));
const NeuroFeed = lazy(() => import('./pages/NeuroFeed'));
const SocialProfile = lazy(() => import('./pages/SocialProfile'));
const StudyGroups = lazy(() => import('./pages/StudyGroups'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const SavedPosts = lazy(() => import('./pages/SavedPosts'));
const CreatePage = lazy(() => import('./pages/CreatePage'));

// Labs
const LabsLayout = lazy(() => import('./pages/Labs/LabsLayout'));
const LabsDashboard = lazy(() => import('./pages/Labs/LabsDashboard'));
const SubjectLabs = lazy(() => import('./pages/Labs/SubjectLabs'));
const LabWorkspace = lazy(() => import('./pages/Labs/LabWorkspace'));
const QuantumLab = lazy(() => import('./pages/Labs/QuantumLab'));
const PhysicsLab = lazy(() => import('./pages/Labs/PhysicsLab'));
const ChemistryLab = lazy(() => import('./pages/Labs/ChemistryLab'));
const BiologyLab = lazy(() => import('./pages/Labs/BiologyLab'));
// New PhD-level Labs
const CodeEditorLab = lazy(() => import('./pages/Labs/CodeEditorLab'));
const MathGraphingLab = lazy(() => import('./pages/Labs/MathGraphingLab'));
const MolecularViewerLab = lazy(() => import('./pages/Labs/MolecularViewerLab'));
const DSAVisualizerLab = lazy(() => import('./pages/Labs/DSAVisualizerLab'));
const GeographyLab = lazy(() => import('./pages/Labs/GeographyLab'));
const HistoryTimelineLab = lazy(() => import('./pages/Labs/HistoryTimelineLab'));
const EconomicsLab = lazy(() => import('./pages/Labs/EconomicsLab'));
const LiteratureLab = lazy(() => import('./pages/Labs/LiteratureLab'));
const LanguagesLab = lazy(() => import('./pages/Labs/LanguagesLab'));
const PoliticalScienceLab = lazy(() => import('./pages/Labs/PoliticalScienceLab'));
const FashionLab = lazy(() => import('./pages/Labs/FashionLab'));
const CultureLab = lazy(() => import('./pages/Labs/CultureLab'));
const DynamicMathLab = lazy(() => import('./pages/Labs/DynamicMathLab'));
const AgenticRAGLab = lazy(() => import('./pages/Labs/AgenticRAGLab'));
// Classroom & Clubs
const ClassroomDashboard = lazy(() => import('./pages/Classroom/ClassroomDashboard'));
const OnlineClassRoom = lazy(() => import('./pages/Classroom/OnlineClassRoom'));
const ClubsDashboard = lazy(() => import('./pages/Clubs/ClubsDashboard'));
const ClubDetail = lazy(() => import('./pages/Clubs/ClubDetail'));

// Notebook (AI Features)
const Notebook = lazy(() => import('./pages/Notebook'));
const TrashPage = lazy(() => import('./pages/TrashPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="text-lg text-secondary animate-pulse">Loading...</div>
  </div>
);

import { ThemeProvider } from './state/ThemeContext';
import { AIAssistantProvider } from './state/AIAssistantContext';
import { PersonalizationProvider } from './state/PersonalizationContext';
import { BillingProvider } from './state/BillingContext';

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ParentalProvider>
          <AIAssistantProvider>
            <PersonalizationProvider>
              <BillingProvider>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<AuthPage />} />
                      <Route path="/verify-email" element={<VerifyEmailPage />} />
                      <Route path="/pending-verification" element={<PendingVerificationPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

                      {/* Protected routes */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <ModernLayout>
                              <Outlet />
                            </ModernLayout>
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<HomePage />} />
                        <Route path="home" element={<HomePage />} />
                        <Route path="create" element={<CreatePage />} />
                        <Route path="feed" element={<FeedPage />} />
                        <Route path="feed/customize" element={<FeedCustomization />} />
                        <Route path="social" element={<NeuroFeed />} />
                        <Route path="social/profile" element={<SocialProfile />} />
                        <Route path="social/profile/:userId" element={<SocialProfile />} />
                        <Route path="notes" element={<NotesHome />} />
                        <Route path="notes/trash" element={<TrashPage />} />
                        <Route path="notes/:id/edit" element={<NoteEditPage />} />
                        <Route path="journal" element={<JournalPage />} />
                        <Route path="library" element={<Library />} />
                        <Route path="chat" element={<Chat />} />
                        <Route path="flashcards" element={<FlashcardsPage />} />
                        <Route path="profile/:username" element={<ProfilePage />} />
                        <Route path="account" element={<MyAccount />} />
                        <Route path="parent-settings" element={<ParentSettings />} />
                        <Route path="/notes/:id/view" element={<NoteViewerFull />} />
                        <Route path="leaderboard" element={<Leaderboard />} />
                        <Route path="quiz" element={<Quiz />} />
                        <Route path="groups" element={<StudyGroups />} />
                        <Route path="groups/:groupId" element={<GroupDetail />} />
                        <Route path="saved" element={<SavedPosts />} />
                        <Route path="assignments/:id" element={<AssignmentDetail />} />
                        <Route path="grading/:assignmentId" element={<GradingView />} />

                        {/* Dashboards */}
                        <Route path="parent-dashboard" element={
                          <RoleRoute allowedRoles={['PARENT']}>
                            <ParentDashboard />
                          </RoleRoute>
                        } />
                        <Route path="teacher-dashboard" element={
                          <RoleRoute allowedRoles={['TEACHER']}>
                            <TeacherDashboard />
                          </RoleRoute>
                        } />
                        <Route path="admin-dashboard" element={
                          <RoleRoute allowedRoles={['ADMIN', 'INSTITUTION_ADMIN']}>
                            <AdminDashboard />
                          </RoleRoute>
                        } />

                        <Route path="video-call" element={<VideoCall />} />
                        <Route path="calendar" element={<CalendarPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="activity" element={<ActivityPage />} />
                        <Route path="search" element={<SearchPage />} />
                        <Route path="agents" element={<AgentDashboard />} />
                        <Route path="research" element={<DeepResearch />} />
                        <Route path="study-search" element={<StudySearchPage />} />
                        <Route path="engine" element={<UniversalEngine />} />

                        {/* Billing */}
                        <Route path="pricing" element={<Pricing />} />
                        <Route path="checkout/:planId" element={<Checkout />} />

                        {/* Labs Module */}
                        <Route path="labs" element={<LabsLayout />}>
                          <Route index element={<LabsDashboard />} />
                          <Route path="quantum" element={<QuantumLab />} />
                          <Route path="physics" element={<PhysicsLab />} />
                          <Route path="chemistry" element={<ChemistryLab />} />
                          <Route path="biology" element={<BiologyLab />} />
                          {/* New PhD-level Labs */}
                          <Route path="cs" element={<CodeEditorLab />} />
                          <Route path="code-editor" element={<CodeEditorLab />} />
                          <Route path="math" element={<MathGraphingLab />} />
                          <Route path="molecular" element={<MolecularViewerLab />} />
                          <Route path="dsa" element={<DSAVisualizerLab />} />
                          <Route path="geography" element={<GeographyLab />} />
                          <Route path="history" element={<HistoryTimelineLab />} />
                          <Route path="economics" element={<EconomicsLab />} />
                          <Route path="literature" element={<LiteratureLab />} />
                          <Route path="languages" element={<LanguagesLab />} />
                          <Route path="political-science" element={<PoliticalScienceLab />} />
                          <Route path="fashion" element={<FashionLab />} />
                          <Route path="culture" element={<CultureLab />} />
                          <Route path="dynamic-math" element={<DynamicMathLab />} />
                          <Route path="agentic-rag" element={<AgenticRAGLab />} />
                          {/* Dynamic subject route */}
                          <Route path=":subject" element={<SubjectLabs />} />
                          <Route path="view/:id" element={<LabWorkspace />} />
                        </Route>

                        {/* Classroom Module */}
                        <Route path="classroom" element={<ClassroomDashboard />} />
                        <Route path="classroom/:id/live" element={<OnlineClassRoom />} />

                        {/* Clubs Module */}
                        <Route path="clubs" element={<ClubsDashboard />} />
                        <Route path="clubs/:id" element={<ClubDetail />} />

                        {/* AI Notebook Module */}
                        <Route path="notebook" element={<Notebook />} />
                      </Route>

                      {/* 404 */}
                      <Route path="*" element={<div className="p-6">404 — Page Not Found</div>} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </BillingProvider>
            </PersonalizationProvider>
          </AIAssistantProvider>
        </ParentalProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
import React, { Suspense, lazy } from "react";
import { BrowserRouter, HashRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import PageSkeleton from "components/PageSkeleton";

const BatchDownloadManager = lazy(() => import('./pages/batch-download-manager'));
const HomeSearchDashboard = lazy(() => import('./pages/home-search-dashboard'));
const DownloadHistoryManagement = lazy(() => import('./pages/download-history-management'));
const UserSettingsPreferences = lazy(() => import('./pages/user-settings-preferences'));

const VideoDetailsDownload = lazy(() => import('./pages/video-details-download'));
const SearchResultsPage = lazy(() => import('./pages/search-results-page'));

// Use HashRouter for desktop (file://) to prevent pushState origin errors that crash the app
const AppRouter = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

const Routes = () => {
 return (
  <AppRouter>
   <ErrorBoundary>
    <ScrollToTop />
    <Suspense fallback={<PageSkeleton />}>
     <RouterRoutes>
      {/* Define your route here */}
      <Route path="/" element={<HomeSearchDashboard />} />
      <Route path="/batch-download-manager" element={<BatchDownloadManager />} />
      <Route path="/home-search-dashboard" element={<HomeSearchDashboard />} />
      <Route path="/download-history-management" element={<DownloadHistoryManagement />} />
      <Route path="/user-settings-preferences" element={<UserSettingsPreferences />} />

      <Route path="/video-details-download" element={<VideoDetailsDownload />} />
      <Route path="/search-results" element={<SearchResultsPage />} />
      <Route path="*" element={<NotFound />} />
     </RouterRoutes>
    </Suspense>
    </ErrorBoundary>
   </AppRouter>
  );
 };

export default Routes;

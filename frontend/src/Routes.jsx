import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import BatchDownloadManager from './pages/batch-download-manager';
import HomeSearchDashboard from './pages/home-search-dashboard';
import DownloadHistoryManagement from './pages/download-history-management';
import UserSettingsPreferences from './pages/user-settings-preferences';
import UserAuthentication from './pages/user-authentication';
import VideoDetailsDownload from './pages/video-details-download';

const Routes = () => {
 return (
  <BrowserRouter>
   <ErrorBoundary>
   <ScrollToTop />
   <RouterRoutes>
    {/* Define your route here */}
    <Route path="/" element={<HomeSearchDashboard />} />
    <Route path="/batch-download-manager" element={<BatchDownloadManager />} />
    <Route path="/home-search-dashboard" element={<HomeSearchDashboard />} />
    <Route path="/download-history-management" element={<DownloadHistoryManagement />} />
    <Route path="/user-settings-preferences" element={<UserSettingsPreferences />} />
    <Route path="/user-authentication" element={<UserAuthentication />} />
    <Route path="/video-details-download" element={<VideoDetailsDownload />} />
    <Route path="*" element={<NotFound />} />
   </RouterRoutes>
   </ErrorBoundary>
  </BrowserRouter>
 );
};

export default Routes;

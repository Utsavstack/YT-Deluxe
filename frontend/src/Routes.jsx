import React, { Suspense, lazy } from "react";
import { BrowserRouter, HashRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import PageSkeleton from "components/PageSkeleton";
import GlobalPIPPlayer from "components/ui/GlobalPIPPlayer";
import GlobalProgressFloater from "components/ui/GlobalProgressFloater";

// Lazily loaded — chunks are downloaded on-demand
// But immediately preloaded in background so navigation feels instant
const HomeSearchDashboard = lazy(() => import('./pages/home-search-dashboard'));
const DownloadHistoryManagement = lazy(() => import('./pages/download-history-management'));
const UserSettingsPreferences = lazy(() => import('./pages/user-settings-preferences'));
const VideoDetailsDownload = lazy(() => import('./pages/video-details-download'));
const SearchResultsPage = lazy(() => import('./pages/search-results-page'));

// Preload all page chunks shortly after app mounts so navigations are instant.
// 500ms delay: enough for the home page first paint to complete,
// short enough that chunks are ready before the user can click the menu.
const preloadAllPages = () => {
  import('./pages/download-history-management');
  import('./pages/user-settings-preferences');
  import('./pages/video-details-download');
  import('./pages/search-results-page');
};
setTimeout(preloadAllPages, 500);


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

                        <Route path="/home-search-dashboard" element={<HomeSearchDashboard />} />
                        <Route path="/download-history-management" element={<DownloadHistoryManagement />} />
                        <Route path="/user-settings-preferences" element={<UserSettingsPreferences />} />

                        <Route path="/video-details-download" element={<VideoDetailsDownload />} />
                        <Route path="/search-results" element={<SearchResultsPage />} />
                        <Route path="*" element={<NotFound />} />
                    </RouterRoutes>
                </Suspense>
                <GlobalProgressFloater />
                <GlobalPIPPlayer />
            </ErrorBoundary>
        </AppRouter>
    );
};

export default Routes;

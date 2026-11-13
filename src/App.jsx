import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';

// Pages load on demand; the PWA precaches them all so they still work offline.
const FishGuide = lazy(() => import('./pages/FishGuide.jsx'));
const FishDetail = lazy(() => import('./pages/FishDetail.jsx'));
const LogCatch = lazy(() => import('./pages/LogCatch.jsx'));
const MapPage = lazy(() => import('./pages/MapPage.jsx'));
const Journal = lazy(() => import('./pages/Journal.jsx'));
const Learn = lazy(() => import('./pages/Learn.jsx'));
const GearGuide = lazy(() => import('./pages/GearGuide.jsx'));
const Basics = lazy(() => import('./pages/Basics.jsx'));
const Knots = lazy(() => import('./pages/Knots.jsx'));
const Safety = lazy(() => import('./pages/Safety.jsx'));
const Trips = lazy(() => import('./pages/Trips.jsx'));
const TripForm = lazy(() => import('./pages/TripForm.jsx'));
const TripDetail = lazy(() => import('./pages/TripDetail.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

export default function App() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="fish" element={<FishGuide />} />
          <Route path="fish/:species" element={<FishDetail />} />
          <Route path="log" element={<LogCatch />} />
          <Route path="log/:id" element={<LogCatch />} />
          <Route path="map" element={<MapPage />} />
          <Route path="journal" element={<Journal />} />
          <Route path="journal/:tab" element={<Journal />} />
          <Route path="learn" element={<Learn />} />
          <Route path="learn/gear" element={<GearGuide />} />
          <Route path="learn/basics" element={<Basics />} />
          <Route path="learn/knots" element={<Knots />} />
          <Route path="learn/safety" element={<Safety />} />
          <Route path="trips" element={<Trips />} />
          <Route path="trips/new" element={<TripForm />} />
          <Route path="trips/:id" element={<TripDetail />} />
          <Route path="trips/:id/edit" element={<TripForm />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

import { Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import './styles/Theme.css'
import './styles/PageContent.css'
import Navigation from './components/Navigation'
import Notifications from './components/Notifications'
import LoginModal from './components/LoginModal'
import SignupModal from './components/SignupModal'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import PlayersPage from './pages/PlayersPage'
import ClubsPage from './pages/ClubsPage'
import TournamentsPage from './pages/TournamentsPage'
import LeaguesPage from './pages/LeaguesPage'
import ChallengesPage from './pages/ChallengesPage'
import ShopPage from './pages/ShopPage'

function NotFound() {
  return (
    <div className="page-container">
      <div className="panel empty-note">
        <h2>Page not found</h2>
        <p>That page doesn&apos;t exist. <Link to="/">Back to the home page</Link></p>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="app">
      <Navigation />
      <Notifications />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/:tournamentId" element={<TournamentsPage />} />
          <Route path="/leagues" element={<LeaguesPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/money-match" element={<Navigate to="/challenges" replace />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <LoginModal />
      <SignupModal />
    </div>
  )
}

export default App

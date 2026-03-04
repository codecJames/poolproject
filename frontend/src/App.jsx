import { Routes, Route } from 'react-router-dom'
import './App.css'
import './styles/Theme.css'
import Navigation from './components/Navigation'
import Notifications from './components/Notifications'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import PlayersPage from './pages/PlayersPage'
import ClubsPage from './pages/ClubsPage'
import TournamentsPage from './pages/TournamentsPage'
import LeaguesPage from './pages/LeaguesPage'
import MoneyMatchPage from './pages/MoneyMatchPage'
import ShopPage from './pages/ShopPage'

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
          <Route path="/leagues" element={<LeaguesPage />} />
          <Route path="/money-match" element={<MoneyMatchPage />} />
          <Route path="/shop" element={<ShopPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

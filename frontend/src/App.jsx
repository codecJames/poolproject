import { Routes, Route } from 'react-router-dom'
import './App.css'
import Navigation from './components/Navigation'
import HomePage from './pages/HomePage'
import PlayersPage from './pages/PlayersPage'
import ClubsPage from './pages/ClubsPage'
import TournamentsPage from './pages/TournamentsPage'
import LeaguesPage from './pages/LeaguesPage'
import MoneyMatchPage from './pages/MoneyMatchPage'

function App() {
  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/leagues" element={<LeaguesPage />} />
          <Route path="/money-match" element={<MoneyMatchPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

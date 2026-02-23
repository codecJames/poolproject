import '../styles/PageContent.css';

export default function TournamentsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🏆 Tournaments</h1>
        <p className="page-subtitle">Upcoming and past tournaments</p>
      </div>

      <div className="content-card">
        <div className="empty-state">
          <p className="empty-icon">📋</p>
          <h2>No tournaments yet</h2>
          <p>Check back soon for exciting pool tournaments!</p>
        </div>
      </div>
    </div>
  );
}

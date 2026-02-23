import '../styles/PageContent.css';

export default function ClubsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🏛️ Clubs</h1>
        <p className="page-subtitle">Pool clubs and venues</p>
      </div>

      <div className="content-card">
        <div className="empty-state">
          <p className="empty-icon">🎱</p>
          <h2>No clubs registered</h2>
          <p>Clubs will be available soon!</p>
        </div>
      </div>
    </div>
  );
}

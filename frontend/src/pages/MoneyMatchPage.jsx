import '../styles/PageContent.css';

export default function MoneyMatchPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>💰 Money Match</h1>
        <p className="page-subtitle">Head-to-head money match records</p>
      </div>

      <div className="content-card">
        <div className="empty-state">
          <p className="empty-icon">💵</p>
          <h2>No money matches recorded</h2>
          <p>Money match data will appear here!</p>
        </div>
      </div>
    </div>
  );
}

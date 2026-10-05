const LOCALE = 'en-ZA';

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(LOCALE, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

export const winRate = (player) =>
  player.matches_played ? Math.round((player.matches_won / player.matches_played) * 100) : 0;

export const TOURNAMENT_STATUS = {
  registration: { label: 'Open for entries', badge: 'badge-success' },
  in_progress: { label: 'In progress', badge: 'badge-warning' },
  completed: { label: 'Completed', badge: 'badge-primary' },
};

export const roundName = (round, totalRounds) => {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semi-finals';
  if (fromEnd === 2) return 'Quarter-finals';
  return `Round ${round}`;
};

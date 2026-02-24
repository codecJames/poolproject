import random
import math

def generate_bracket(players):
    """Generate a randomized single-elimination bracket.

    players: list of objects with `id` attribute
    Returns list of rounds where each round is list of match dicts
    """
    if not players:
        return []

    shuffled = players.copy()
    random.shuffle(shuffled)

    num_players = len(shuffled)
    total_rounds = math.ceil(math.log2(num_players))
    # Pad with byes (None) to make power of two
    bracket_size = 2 ** total_rounds
    padded = shuffled + [None] * (bracket_size - num_players)

    rounds = []
    current = padded
    for r in range(total_rounds):
        matches = []
        for i in range(0, len(current), 2):
            p1 = current[i]
            p2 = current[i+1] if i+1 < len(current) else None
            matches.append({
                'round': r+1,
                'player1_id': p1.id if p1 else None,
                'player2_id': p2.id if p2 else None,
                'winner_id': None,
                'player1_score': 0,
                'player2_score': 0,
                'completed': False,
            })
        rounds.append(matches)
        # next round placeholders
        current = [None] * (len(matches))

    return rounds

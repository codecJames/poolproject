import random


def first_round_pairings(user_ids):
    """Randomly pair players for a single-elimination bracket.

    The bracket is padded to the next power of two with byes, and each bye is
    given to a different player so no match is ever bye-vs-bye.
    Returns (pairs, total_rounds); a pair's second id is None for a bye.
    """
    count = len(user_ids)
    if count < 2:
        raise ValueError("Need at least 2 players")

    shuffled = random.sample(list(user_ids), count)
    bracket_size = 1 << (count - 1).bit_length()
    byes = bracket_size - count

    players = iter(shuffled)
    pairs = []
    for position in range(bracket_size // 2):
        first = next(players)
        second = None if position < byes else next(players)
        pairs.append((first, second))

    total_rounds = bracket_size.bit_length() - 1
    return pairs, total_rounds

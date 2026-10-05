from app.utils.tournament_utils import first_round_pairings


def test_signup_login_and_me(client, signup):
    headers, body = signup("Thandi")
    assert body["user"]["full_name"] == "Thandi"
    assert body["player"]["name"] == "Thandi"

    login = client.post("/api/users/login", json={"email": "P1@example.com ", "password": "secret123"})
    assert login.status_code == 200
    assert client.post("/api/users/login", json={"email": "p1@example.com", "password": "wrong"}).status_code == 401

    me = client.get("/api/users/me", headers=headers)
    assert me.json()["player"]["id"] == body["player"]["id"]
    assert client.get("/api/users/me").status_code == 401


def test_duplicate_email_rejected(client, signup):
    signup()
    response = client.post(
        "/api/users/signup",
        json={"full_name": "Again", "email": "p1@example.com", "password": "secret123"},
    )
    assert response.status_code == 400


def test_seeded_league_has_residence_teams(client):
    leagues = client.get("/api/leagues").json()
    assert len(leagues) == 1
    standings = client.get(f"/api/leagues/{leagues[0]['id']}/standings").json()
    assert len(standings) == 10
    assert len(client.get("/api/clubs").json()) == 10


def test_league_results_drive_standings(client, signup):
    headers, _ = signup()
    league_id = client.get("/api/leagues").json()[0]["id"]
    teams = client.get("/api/teams", params={"league_id": league_id}).json()
    home, away = teams[0], teams[1]

    payload = {"home_team_id": home["id"], "away_team_id": away["id"], "home_score": 5, "away_score": 3}
    assert client.post(f"/api/leagues/{league_id}/results", json=payload).status_code == 401
    result = client.post(f"/api/leagues/{league_id}/results", json=payload, headers=headers)
    assert result.status_code == 200

    standings = client.get(f"/api/leagues/{league_id}/standings").json()
    assert standings[0]["team_id"] == home["id"]
    assert standings[0]["points"] == 3 and standings[0]["wins"] == 1
    loser = next(row for row in standings if row["team_id"] == away["id"])
    assert loser["losses"] == 1 and loser["points"] == 0

    other_headers, _ = signup()
    result_id = result.json()["id"]
    assert client.delete(f"/api/leagues/{league_id}/results/{result_id}", headers=other_headers).status_code == 403
    assert client.delete(f"/api/leagues/{league_id}/results/{result_id}", headers=headers).status_code == 200
    assert client.get(f"/api/leagues/{league_id}/standings").json()[0]["points"] == 0


def test_team_join_and_leave(client, signup):
    headers, body = signup()
    league_id = client.get("/api/leagues").json()[0]["id"]
    team = client.post("/api/teams", json={"name": "The Breakers", "league_id": league_id}, headers=headers).json()
    assert team["captain_id"] == body["user"]["id"]

    seeded = next(t for t in client.get("/api/teams", params={"league_id": league_id}).json() if t["name"] == "Kopano")
    # One team per league
    assert client.post(f"/api/teams/{seeded['id']}/join", headers=headers).status_code == 400
    assert client.post(f"/api/teams/{team['id']}/leave", headers=headers).json()["captain_id"] is None
    joined = client.post(f"/api/teams/{seeded['id']}/join", headers=headers).json()
    assert joined["captain_id"] == body["user"]["id"]  # captainless team gets a captain


def test_bracket_pairings_spread_byes():
    for count in range(2, 20):
        pairs, rounds = first_round_pairings(list(range(count)))
        seated = [p for pair in pairs for p in pair if p is not None]
        assert sorted(seated) == list(range(count))
        assert all(first is not None for first, _ in pairs)
        assert len(pairs) == 2 ** (rounds - 1)


def test_tournament_runs_to_a_winner(client, signup):
    organiser, _ = signup("Organiser")
    created = client.post("/api/tournaments", json={"name": "Spring Open", "max_players": 8}, headers=organiser)
    assert created.status_code == 200
    tid = created.json()["id"]

    players = [signup() for _ in range(5)]
    for headers, _ in players:
        assert client.post(f"/api/tournaments/{tid}/register", headers=headers).status_code == 200
    headers0 = players[0][0]
    assert client.post(f"/api/tournaments/{tid}/register", headers=headers0).status_code == 400
    assert client.post(f"/api/tournaments/{tid}/start", headers=headers0).status_code == 403

    detail = client.post(f"/api/tournaments/{tid}/start", headers=organiser).json()
    assert detail["status"] == "in_progress" and detail["total_rounds"] == 3
    assert len([m for m in detail["matches"] if m["round_number"] == 1]) == 4
    assert len([m for m in detail["matches"] if m["is_bye"]]) == 3

    # The organiser reports every playable match until a champion emerges
    for _ in range(10):
        if detail["status"] == "completed":
            break
        playable = [m for m in detail["matches"] if not m["completed"] and m["player2_id"]]
        match = playable[0]
        level = client.put(
            f"/api/tournaments/{tid}/matches/{match['id']}",
            json={"player1_score": 3, "player2_score": 3},
            headers=organiser,
        )
        assert level.status_code == 400
        response = client.put(
            f"/api/tournaments/{tid}/matches/{match['id']}",
            json={"player1_score": 5, "player2_score": 2},
            headers=organiser,
        )
        assert response.status_code == 200, response.text
        detail = response.json()

    assert detail["status"] == "completed"
    assert detail["winner_id"] is not None
    assert max(m["round_number"] for m in detail["matches"]) == 3
    # 4 real games were played: 1 in round 1, 2 in round 2, 1 final
    assert len(client.get("/api/matches").json()) == 4


def test_challenge_flow_updates_rankings(client, signup):
    alice_headers, alice = signup("Alice")
    bob_headers, bob = signup("Bob")
    bob_player = bob["player"]["id"]

    created = client.post("/api/challenges", json={"challenged_id": bob_player}, headers=alice_headers)
    assert created.status_code == 200
    challenge_id = created.json()["id"]
    assert client.post("/api/challenges", json={"challenged_id": bob_player}, headers=alice_headers).status_code == 400
    assert client.post(f"/api/challenges/{challenge_id}/accept", headers=alice_headers).status_code == 403
    assert client.post(f"/api/challenges/{challenge_id}/accept", headers=bob_headers).json()["status"] == "accepted"

    score = {"challenger_score": 5, "challenged_score": 4}
    reported = client.post(f"/api/challenges/{challenge_id}/score", json=score, headers=alice_headers).json()
    assert reported["status"] == "accepted" and reported["reported_by_id"] == alice["player"]["id"]

    # Bob disagrees, so his score becomes the one waiting for confirmation
    disputed = client.post(
        f"/api/challenges/{challenge_id}/score",
        json={"challenger_score": 3, "challenged_score": 5},
        headers=bob_headers,
    ).json()
    assert disputed["reported_by_id"] == bob_player

    done = client.post(
        f"/api/challenges/{challenge_id}/score",
        json={"challenger_score": 3, "challenged_score": 5},
        headers=alice_headers,
    ).json()
    assert done["status"] == "completed"

    players = {p["name"]: p for p in client.get("/api/players").json()}
    assert players["Bob"]["matches_won"] == 1 and players["Bob"]["rating"] > 1000
    assert players["Alice"]["matches_played"] == 1 and players["Alice"]["rating"] < 1000
    assert client.get("/api/challenges/mine", headers=bob_headers).json()[0]["status"] == "completed"

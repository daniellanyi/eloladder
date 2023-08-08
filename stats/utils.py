from django.apps import apps
from .models import UserStatistics

def expected(A, B):
    return 1/ (1 + 10 ** ((B- A) / 400))

def new_elo(old, exp, score, k=20):
    return old + k * (score - exp)

def elo_calc(results: list, A: UserStatistics, B: UserStatistics):
    """
    Calculates the new elo score of each player based on the results of a matchup using a simple elo formula.
    
    Args:
        results: A list that contains the winner of each game in a series in the order they were played
        A: Statistics model of player A
        B: Statistics model of player B
    """

    for current_winner in results:
        A.elo = new_elo(A.elo, expected(A.elo, B.elo), int(current_winner == A.user.userprofile.user_string))
        B.elo = new_elo(B.elo, expected(B.elo, A.elo), int(current_winner == B.user.userprofile.user_string))
    A.save()
    B.save()

def win_streak_and_ratio(results: list, player: UserStatistics):
    """
    Updates the statistics of a player based on the results of a matchup that are dependent on the order
    in which the results occured.
    
    Args:
        results: A list that contains the winner of each game in a series in the order they were played
        player: Statistics model of player
    """
    for i in results:
        if i == player.user.userprofile.user_string:
            player.wins += 1
            player.current_win_streak += 1
            player.highest_win_streak = max(player.current_win_streak, player.highest_win_streak)
        else:
            player.losses += 1
            player.current_win_streak = 0
    games_played = player.wins + player.losses
    player.win_loss_ratio = round(100 * (player.wins / games_played if games_played > 0 else player.wins / 1), 2)
    player.save()



def handle_1v1_update(data: dict):
    """
    Descrtuctures matchup data and calls the elo_calc and win_streak_and_ratio functions
    with the players and the results that were obtained from the matchup data as paramaters.
    """
    User = apps.get_model('auth', 'User')
    player_1_string = data['players'][0]
    player_2_string = data['players'][1]
    player_1_id_idx = player_1_string.rfind(" ")
    player_2_id_idx = player_2_string.rfind(" ")
    player_1_id = player_1_string[player_1_id_idx + 1:]
    player_2_id = player_2_string[player_2_id_idx + 1:]
    player_1 = User.objects.get(id=player_1_id)
    player_2 = User.objects.get(id=player_2_id)
    player1_stats = player_1.userstatistics
    player2_stats = player_2.userstatistics
    winners = data['winners']
    elo_calc(winners, player1_stats, player2_stats)
    win_streak_and_ratio(winners, player1_stats)
    win_streak_and_ratio(winners, player2_stats)

    
"""
Creates a database view for the leaderboard cache.

The purpose of this file is to create a database view based on users in the stats_leaderboardcache table\n
which stores the top segment of the leaderboard. This becomes useful when the number of users becomes very\n
large.

SQL Queries:
    1. Create leaderboard_cache_view from the results
        #CREATE VIEW leaderboard_view AS
    2. Select all the columns to be included in the view from the underlying tables
        #SELECT
                u.id,
                u.username AS username,
                s.wins AS wins,
                s.losses AS losses,
                s.win_loss_ratio AS win_loss_ratio,
                s.current_win_streak AS current_win_streak,
                s.elo AS elo,
    3. Order the rows primarily based on rank and secondarily based on the alphabetical value of the username.\n
        The RANK window function that assigns an integer field to each row representing the player_rank 
        #RANK() OVER (ORDER BY s.elo DESC, u.username) AS player_rank
    
    4. Finish the process by selecting from an INNER JOIN of the auth_user and the stats_userstatsistics table.\n
        #FROM
                auth_user u
                INNER JOIN stats_userstatistics s ON u.id = s.user_id

Dependencies:
- This migration depends on the previous migration 0001_initial.

Please Note:
Before applying this migration a MySQL database connection must be set up and the database settings must be\n
configured in settings.py. In addition all dependencies must be installed from requirements.txt.\n
Once these steps are completed first run manage.py makemigrations so that Django creates the 0001_initial\n
migration file for all the models. After that all existing migration can be applied by running manage.py migrate.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0002_create_leaderboard_cache_view'),
    ]

    operations = [
        migrations.RunSQL(
            """
            CREATE VIEW leaderboard_view AS
            SELECT
                u.id,
                u.username AS username,
                s.wins AS wins,
                s.losses AS losses,
                s.win_loss_ratio AS win_loss_ratio,
                s.current_win_streak AS current_win_streak,
                s.elo AS elo,
                RANK() OVER (ORDER BY s.elo DESC, u.username) AS player_rank
            FROM
                auth_user u
                INNER JOIN stats_userstatistics s ON u.id = s.user_id
            """
        ),
    ]

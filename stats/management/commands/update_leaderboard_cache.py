"""
This command updates and resizes the leaderboard cache based on the size specified. 

The update_leaderboard_cache_table query selects the data from the auth_user and stats_userstatistics tables 
and joins them on the id of the user. The data is then inserted into the table and any users who are already 
in the table are updated to prevent the duplication of entries and to keep usernames up to date. This enables
the increasing of the size of the cache and the updating of it with new entries.

The reduce_leaderboard_cache query simply deletes all the entries that were not selected in the previous query.
It enables the lowering of the size of the cache.
"""


from django.core.management.base import BaseCommand
from django.db import connection
import traceback


LEADERBOARD_CACHE_SIZE = 160

class Command(BaseCommand):
    help = 'Update the cache table with up to date user data and resize the cache to a certain limit.'

    def handle(self, *args, **options):
        update_leaderboard_cache_table = f"""
            INSERT INTO stats_leaderboardcache (user_id, username)
            SELECT 
                u.id AS user_id,
                u.username AS username
            FROM
                auth_user u
                INNER JOIN stats_userstatistics s ON u.id = s.user_id
            ORDER BY
                s.elo DESC, u.username
            LIMIT {LEADERBOARD_CACHE_SIZE}
            ON DUPLICATE KEY UPDATE username=VALUES(username);
        """
        reduce_leaderboard_cache_table = f"""
            DELETE FROM stats_leaderboardcache
            WHERE user_id NOT IN (
                SELECT user_id
                FROM (
                    SELECT
                        u.id AS user_id
                    FROM
                        auth_user u
                        INNER JOIN stats_userstatistics s ON u.id = s.user_id
                    ORDER BY
                        s.elo DESC, u.username
                    LIMIT {LEADERBOARD_CACHE_SIZE}
                    ) as user_ids
            );
        """
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(update_leaderboard_cache_table)
                cursor.execute(reduce_leaderboard_cache_table)
                self.stdout.write(self.style.SUCCESS('Cache table updated successfully.'))
        except Exception as e:
            self.stderr.write(self.style.ERROR('An error occurred during cache update.'))
            self.stderr.write(traceback.format_exc())


from django.db import models
from django.contrib.auth.models import User

class UserStatistics(models.Model):
    """
    Stores statistics about a users career in the game.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    elo = models.IntegerField(default=1200)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    current_win_streak = models.IntegerField(default=0)
    highest_win_streak = models.IntegerField(default=0)
    highest_elo = models.IntegerField(default=0)
    win_loss_ratio = models.FloatField(default=0)

    def __str__(self):
        return f"{self.user.username}'s statistics"
    

class UserProfile(models.Model):
    """
    Stores user related information.

    Attributes:
        user: corresponding user model instance
        user_string: a string that includes the user's id and username
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_string = models.CharField(max_length=255)

    def save(self, *args, **kwargs):
        self.user_string = f"{self.user.username} {self.user.id}"
        super().save(*args, **kwargs)

class LeaderboardCache(models.Model):
    """
    Caches the top segment of users on the Leaderboard
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    username = models.CharField(max_length=150)


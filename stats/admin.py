from django.contrib import admin

from .models import UserStatistics

@admin.register(UserStatistics)
class UserStatisticsAdmin(admin.ModelAdmin):
    list_display = ('user', 'elo', 'wins', 'losses', 'current_win_streak', 'highest_win_streak', 'win_loss_ratio') 
    list_editable = ('elo', 'wins', 'losses', 'current_win_streak', 'highest_win_streak', 'win_loss_ratio') 

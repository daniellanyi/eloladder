from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login', views.loginPage, name='login'),
    path('register', views.registerPage, name='register'),
    path('logout', views.logoutUser, name='logout'),
    path('userprofile/<int:user_id>/', views.user_profile, name='user_profile'),
    path('update', views.update, name='update'),
    path('search-users', views.search_users, name='search_users'),
    path('update-stats-1v1', views.update_stats_1v1, name='update_stats_1v1'),
]

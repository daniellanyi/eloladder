from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from .forms import CreateUserForm
from .decorators import unauthenticated_user, allowed_users
import json
import math
from django.db import connection
from . import models
from django.contrib import messages
from django.core.paginator import Paginator
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET
from . import utils

LEADERBOARD_PAGE_NUMBER=18
USE_CACHE = True

@allowed_users(allowed_roles=['tournament_admin'])
def update(request):
    """
    Renders the html template for the update page which is only acessible to tournament admins.

    Args:
        request (HttpRequest): HTTP request object
    
    Returns:
        HttpResponse: HTTP response object containing the rendered HTML template
    """
    return render(request, 'update.html')


def update_stats_1v1(request):
    """
    View that handles the AJAX POST request coming from the update page to update the user
    statistics after a matchup was recorded.

    Args:
        request (HttpRequest): HTTP request object

    Returns:
      HttpRespnse: HTTP response object containing response status.  
    """
    try:
        if request.method == 'POST':
            json_data = json.loads(request.body)
            utils.handle_1v1_update(json_data)
        return HttpResponse(status=200)
    except Exception as e:
        print(e)
        return HttpResponse(status=500)
    


@require_GET
def search_users(request):
    """
    This view is the API for the SearchBox components on the home and update pages.\n
    It filters the UserProfile model based on the text query parameter and \n
    enables pagination.

    Args:
        request (HttpRequest): HTTP request object

    Returns:
      JsonResponse: JSON object containing an array of usernames and a hasNext property.
    """
    text = request.GET.get('text', '')
    limit = int(request.GET.get('limit', 10))
    
    usernames = models.UserProfile.objects.filter(user_string__istartswith=text).order_by('user_string')
    
    paginator = Paginator(usernames, limit)
    page_number = request.GET.get('page', 1)
    page = paginator.get_page(page_number)
    
    has_next = page.has_next()
       
    response = {
        'usernames': [username.user_string for username in page],
        'hasNext': has_next,
    }
    
    return JsonResponse(response)


def home(request):
    """
    Renders the html template for the home page which displays the data from the leaderboard view.\n
    It either uses the cache leaderboard view or the regular leaderboard view. If the number of users
    is using the cache is recommended.

    Args:
        request (HttpRequest): HTTP request object
    
    Context:
        page: Current page of the leaderboard view
        page_number: Current page number
        num_pages: Number of pages in the leaderboard view
        has_next: Boolean that states if there's a next page.
        has_previous: Boolean that states if there's a previous page.
        
    Returns:
        HttpResponse: HTTP response object containing the rendered HTML template with the context object.
    """

    leaderboard_data = None
    
    get_leaderboard_data = """SELECT * FROM leaderboard_cache_view
    """ if USE_CACHE else """SELECT * FROM leaderboard_view"""

    with connection.cursor() as cursor:
        cursor.execute(get_leaderboard_data)
        leaderboard_data = cursor.fetchall()
    paginator = Paginator(leaderboard_data, LEADERBOARD_PAGE_NUMBER)
    page_number = request.GET.get('page', 1)
    page = paginator.get_page(page_number)
    has_next = page.has_next()
    has_previous = page.has_previous()
    context = {
        'page': page,
        'page_number': page_number,
        'num_pages': paginator.num_pages,
        'has_next': has_next,
        'has_previous': has_previous
        }
    return render(request, 'home.html', context)

def user_profile(request, user_id):
    """
    Renders the html template for the user's profile page. It displays the user's rank\n
    among other statistics and provides a link the the leaderboard page that the user is on.
    If the user is not on the leaderboard their profile will display unranked instead.\n
    It queries either the leaderboard view or the leaderboard cache view (which is recommended for large datasets).

    Args:
        request (HttpRequest): HTTP request object
        user_id: user's id
    
    Context:
        username: User's name
        user_stats: Data dict from the user's UserStatistics model
        user_rank: User's rank
        page_number: The leaderboard page containing the user
    
    Returns:
        HttpResponse: HTTP response object containing the rendered HTML template with the context object.
    """
    
    stats = models.UserStatistics.objects.get(user_id=user_id)
    username = stats.user.username
    user_rank = None

    get_user_rank = f"""
    SELECT player_rank
    FROM leaderboard_cache_view
    WHERE user_id='{user_id}';
    """ if USE_CACHE else f"""
    SELECT player_rank
    FROM leaderboard_view
    WHERE user_id='{user_id}';
    """
    

    with connection.cursor() as cursor:
        cursor.execute(get_user_rank)
        user_rank = cursor.fetchone()

    if user_rank:
        page_number = math.ceil(user_rank[0] / LEADERBOARD_PAGE_NUMBER)
    else:
        page_number = None

    context = {
        'username': username,
        'user_stats': stats,
        'user_rank': user_rank[0] if user_rank else "Unranked",
        'page_number': page_number,
    }
    return render(request, 'userprofile.html', context)

@unauthenticated_user
def registerPage(request):
    """
    Renders a register page which allows a user to register through a form based on
    Django's UserCreationForm.

    Args:
        request (HttpRequest): HTTP request object

    Context:
        form: CreateUserForm instance which creates a user model instance for the registered user.
    
    Returns:
    HttpResponse: HTTP response object containing the rendered HTML template with the context object.
    """
    form = CreateUserForm()
    if request.method == "POST":
        form = CreateUserForm(request.POST)
        if form.is_valid:
            form.save()
            return redirect('login')

    context = {'form': form}
    return render(request, 'register.html', context)

@unauthenticated_user
def loginPage(request):
    """
    Renders a login page which allows a user to login Django's authentication system

    Args:
        request (HttpRequest): HTTP request object

    Returns:
    HttpResponse: HTTP response object containing the rendered HTML template.
    """
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')


        user = authenticate(request, username = username, password = password)

        if user is not None:
            login(request, user)
            messages.info(request, 'successful login')
            return redirect('home')
        else:
            messages.info(request, "Username OR passworrd is incorrect")
    context = {}
    return render(request, 'login.html', context)


def logoutUser(request):
    """
    Logs out user using Django's authentication system and redirects them to the home page.
    """
    logout(request)
    return redirect('home')
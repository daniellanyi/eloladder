from django.http import HttpResponse
from django.shortcuts import redirect

def unauthenticated_user(view_func):
    """
    Redirects the user to the home page if the user isn't authenticated otherwise calls the view function.
    """
    def wrapper_func(request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('home')
        else:
            return view_func(request, *args, **kwargs)
    return wrapper_func

def allowed_users(allowed_roles=None):
    """
    Returns an HTTP response stating Unauthorized access if the user doesn't\n
    have any associated groups in the allowed_roles list.

    Args:
        allowed_roles: list of roles authorized to access the page
    """
    if allowed_roles is None:
        allowed_roles = [] 

    def decorator(view_func):
        def wrapped_func(request, *args, **kwargs):
            if request.user.groups.filter(name__in=allowed_roles).exists():
                return view_func(request, *args, **kwargs)
            else:
                return HttpResponse("Unauthorized access")

        return wrapped_func

    return decorator
from django.template.defaulttags import register

@register.filter
def user_in_group(user, group_name):
    return user.groups.filter(name=group_name).exists()
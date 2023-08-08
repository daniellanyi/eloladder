"""
This command uses Faker to generate fake user data for testing purposes. The related model instances will be created through signals
"""

from django.core.management.base import BaseCommand
from faker import Faker
from django.apps import apps


#Using Faker to generate fake users for testing purposes. The related model instances will be created through signals

User = apps.get_model("auth", "User")

class Command(BaseCommand):

    def handle(self, *args, **kwargs):

        fake = Faker()

        for _ in range(350):
            username = fake.user_name()
            email = fake.email()
            password = fake.password()
            User.objects.create_user(username=username, email=email, password=password)


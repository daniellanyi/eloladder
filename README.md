#Django ELO Leaderboard

##Table of Contents
-[Description](#Description)
-[Installation](#Installation)
-[Usage](#Usage)
-[Configuration](#Configuration)

#Description

This project leverages Django models and MySQL to rank users according to their statistics stored in a database.
The user statistics are updated using the ELO formula through simple Python utility functions.
The default use case for this project is to rank players of a video game based on their results in community tournaments.
The project doesn't use a game API to record results therefore an inteface had to be created to allow a tournament
admin to post the results of a matchup. This was accomplished using vanilla JavaScript. The styling was done using
regular CSS.

The leaderboard was created and paginated using DTL and a MySQL database view which uses the underlying tables that
store the statsistics of users. While this is fine for small datasets calculating the database view for the entire
dataset each time it's accessed is a slow and computationally expensive process. An optimization solution was
included which limits the leaderboard to a top segment. This was done by storing the top segment of user's ids
in a cahce table and using the primary key index (by setting the primary key constraint on the cahced ids) to
create a database view based only on the top segment. This would result in a responsive leaderboard irrespective
of the size of the dataset. The rest of the users would be unranked. The cache could get updated using a management
command periodically to let other users get into the top segment by ranking the entire dataset. This can be done
on the server side without affecting user experience. This solution would make sense for a leaderboard that already has
plenty of recorded results so we can assume that the tog segment remains relatively rigid. That being said there are 
more efficient ways to unrank users and cache leaderboard data so there is still room to optimize.

To record the results of a matchup a custom form was created which makes it convenient to post all the results.
The tournament admin is provided with 2 searchboxes from which they can select players. The players are represented
by their usernames and ids. Including the id makes it more flexible for added functionality like enabling users 
to change their usernames. Once the tournament admin chose the two players and the number of games they get a dropdown
for each game for which they can select the winner. This way the results can be recorded and poseted in the correct order.
The searchboxes and the post request were done using AJAX requests so only the initial HTML was rendered on the server side.
A searchbox was also added to the leaderboard to enable users to lookup the profiles of other users. The user profiles
were created and rendered using Django and they display some statistics and a link to their leaderboard page if applicable.

It's important to not that this project is not completely functional (eg. there's no email confirmation user control panel),
but merely a demonstration of the project concept and of my own skills and understanding.



#Installation

The project setup can be broken down into 10 steps.

1. Clone the repository.
2. Create a virtual environment
3. Install dependencies
4. Create a .env file and add your own secret key and database key to it.\
   These will be referenced using config from python decouple in settings.py.
5. Setup your database table and feel free to change the default settings \
   in settings.py under DATABASE SETTINGS.
6. Run manage.py migrate. The repository already has some migration files added \
   as they're needed to create the database views.
7. Run manage.py createdata which is a custom command to generate fake users.
8. Run manage.py update_leaderboard_cache to update the leaderboard cache table.
9. Create a superuser.
10. Create a tournament admin group and add the superuser to it.

#Usage

To use the leaderboard simply run python manage.py runserver. Login using the Login
button on the navigation bar. The home page shows the leaderboard whose pages are 
navigable using a Next and a back button. The searchbox can be used to search for a
user and upon selection the user is redirected to the selected user's profile.
To record a match click on the Record a Match tab on the navbar which shows up
for users in the tournament admin group. Simply follow the instructions to record a 
match and the changes will be visible on the leaderboard. To use the cache for a large
dataset simply set USE_CACHE in views.py to True. To update the cache run manage.py
update_leaderboard_cache.



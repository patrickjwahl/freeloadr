# Freeloadr: The neighborly sharing website!

This Craigslist-style web app allows people to share or borrow tools or supplies so that they don't have to waste money on something which they won't use much. 

## Front end

The front end, located in the app/ directory, is a NextJS-based web app. It utilizes Next 13's server components and app/ directory, as opposed to the pages/ directory of earlier versions. 

## Back end

The back end, located in the services/ directory, consists of a Flask API connected to a Postgres SQL database, all orchestrated by Docker. The server is Socket.IO-enabled, allowing users to chat with each other in real time. 
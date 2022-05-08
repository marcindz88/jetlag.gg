## How to run?

> ./start.sh
>
It kills all existing containers, rebuilds images and starts new containers

## Ports
* 9999 - websockets & http

## Endpoints

### Establish a websocket connection 
> GET /ws/

(set player token in the protocol)
> new WebSocket("ws://127.0.0.1:9999/ws/", "player_token")

only 1 connection per user at a time is allowed

### Get player list
> GET /api/game/players/

### Register a player in the game
> POST /api/game/players/

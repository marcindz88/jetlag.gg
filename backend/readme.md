## Prerequisities

- Windows - https://docs.docker.com/desktop/windows/install/
- Linux - https://docs.docker.com/desktop/linux/install/ 

## How to run?

> ./start.sh
>
It kills all existing containers, rebuilds images and starts new containers

## Ports
* 9999 - websockets & http

## Endpoints

only 1 connection per user at a time is allowed

### Get player list
> GET /api/game/players/

### Register a player in the game
> POST /api/game/players/

### Establish a websocket connection 
> GET /ws/

(set player token in the protocol)
> new WebSocket("ws://127.0.0.1:9999/ws/", "player_token")

## Websocket communication

### Format
> {<br>
> created: integer timestamp<br>
> data: json<br>
> emitted_by_server: bool<br>
> type: str event type<br>
> }

### Event types emitted by the server:
* 'player.connected'
* 'player.registered'
* 'player.disconnected'
* 'player.removed'

### Event types accepted from the clients:
* todo

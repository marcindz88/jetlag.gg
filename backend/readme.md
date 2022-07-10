## Prerequisites

- Windows - https://docs.docker.com/desktop/windows/install/
- Linux - https://docs.docker.com/desktop/linux/install/ 

## How to run?

> ./start.sh
>
It kills all existing containers, rebuilds images and starts new containers

## Production

### Running redis

copy redis folder (with dockerfile) to the server, and then:

1. create volume
> docker volume create redis_data

2. create the network
> docker network create game_net

3. build the image
> docker build -t redis_with_persistency redis/

4. remove any existing redis containers and run a new one
> docker rm -f redis;docker run --rm -d -p 6379:6379 -v redis_data:/data --network game_net --name redis redis_with_persistency


## Ports
* 9999 - websockets & http

## Endpoints

### Get game config
> GET /api/game/config/

### Get leaderboard
> GET /api/game/leaderboard/

with pagination
> GET /api/game/leaderboard/?limit=10&offset=30

where limit is the size of one page

### Get player in the leaderboard

useful for determining player's position after the game
> GET /api/game/leaderboard/john:1/

### Player's last games

returns last 10 games of a player
> GET /api/game/leaderboard/john:1/last_games/

### Register a player in the game (persistent)
> POST /api/game/players/

### Join a game session
required before creating ws connection

"token" header is expected to be present in the request
> POST /api/game/join/

### Establish a websocket connection 
only 1 connection per user at a time is allowed
> GET /ws/

(set player token in the protocol)
> new WebSocket("ws://127.0.0.1:9999/ws/", "player_token")

## Websocket communication

### Format
> {<br>
> created: integer timestamp (in milliseconds)<br>
> data: json<br>
> type: str event type<br>
> }

### Event types emitted by the server:
* 'player.list'
* 'player.connected'
* 'player.registered'
* 'player.disconnected'
* 'player.removed'
* 'player.updated'
* 'player_position.updated'
* 'airport.shipment_delivered'
* 'airport.refueling_stopped'
* 'airport.list'
* 'airport.updated'

### Event types accepted from the clients:
* 'player_position.update_request'<br>
sample:
> ws.send(JSON.stringify({type: 'player_position.update_request', created: new Date().getTime(), data: {bearing: 30, velocity: 2000, timestamp: new Date().getTime()}}))

* 'airport.landing_request'<br>
sample:
> ws.send(JSON.stringify({type: 'airport.landing_request', created: new Date().getTime(), data: {id: "d5e69764-ac04-42d4-a2cc-2f6fd8554f47"}}))

where id is the id of the airport.

* 'airport.departure_request'<br>
sample:
> ws.send(JSON.stringify({type: 'airport.departure_request', created: new Date().getTime(), data: {id: "d5e69764-ac04-42d4-a2cc-2f6fd8554f47"}}))

where id is the id of the airport.


* 'airport.shipment_dispatch_request'<br>
sample:
> ws.send(JSON.stringify({type: 'airport.shipment_dispatch_request', created: new Date().getTime(), data: {id: "d5e69764-ac04-42d4-a2cc-2f6fd8554f47"}}))

where id is the id of the shipment. Player has to be grounded and shipment must be present on the airport player is grounded on.


* 'airport.shipment_delivery_request'<br>
sample:
> ws.send(JSON.stringify({type: 'airport.shipment_delivery_request', created: new Date().getTime(), data: {}}))

player has to carry a shipment and be grounded on the destination airport of the shipment.


* 'airport.refueling_start_request'<br>
sample:
> ws.send(JSON.stringify({type: 'airport.refueling_start_request', created: new Date().getTime(), data: {}}))


* 'airport.refueling_end_request'<br>
sample:
> ws.send(JSON.stringify({type: 'airport.refueling_end_request', created: new Date().getTime(), data: {}}))


### Clock synchronisation
> GET /clock/ (websocket)

sample:
> ws.send("test123")
> > {t: 1653085964101, ref: "test123"}

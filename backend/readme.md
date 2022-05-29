## Prerequisites

- Windows - https://docs.docker.com/desktop/windows/install/
- Linux - https://docs.docker.com/desktop/linux/install/ 

## How to run?

> ./start.sh
>
It kills all existing containers, rebuilds images and starts new containers

## Ports
* 9999 - websockets & http

## Endpoints

### Get game config
> GET /api/game/config/

### Get player list
> GET /api/game/players/

### Register a player in the game
> POST /api/game/players/

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


### Clock synchronisation
> GET /clock/ (websocket)

sample:
> ws.send("test123")
> > {t: 1653085964101, ref: "test123"}

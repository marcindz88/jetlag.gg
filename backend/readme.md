## How to run?

> ./start.sh
>
It kills all existing containers, rebuilds images and starts new containers

## Ports
* 9999 - websockets & http

## Endpoints

Establish a websocket connection
> GET /ws/

Get game config
> GET /api/game

Register in the game
> POST /api/game/register

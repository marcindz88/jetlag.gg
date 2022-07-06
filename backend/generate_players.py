import string
import random

from app.game.enums import DeathCause
from app.game.persistence.redis import RedisPersistentStorage
from app.tools.timestamp import timestamp_now


def random_string(length):
    return ''.join(random.choice(string.ascii_lowercase) for _ in range(length))


PLAYERS_AMOUNT = 5_000
GAMES_AMOUNT = 10_000


storage = RedisPersistentStorage(host='localhost')


player_names = set()

while len(player_names) != PLAYERS_AMOUNT:
    player_names.add(random_string(8))


nicknames = []

for index, name in enumerate(player_names):
    if index % 100 == 0:
        print(f"player {index}/{PLAYERS_AMOUNT}")
    player = storage.add_new_player(name)
    nicknames.append(player.full_nickname)


now = timestamp_now()


for index in range(GAMES_AMOUNT):
    if index % 100 == 0:
        print(f"game {index}/{GAMES_AMOUNT}")
    storage.add_game_record(
        full_nickname=random.choice(nicknames),
        timestamp=now,
        score=random.randint(1, 100000),
        shipments_delivered=random.randint(1, 50),
        time_alive=random.randint(1, 1000),
        death_cause=DeathCause.SPEED_TOO_LOW,
    )
    now -= 100

from app.game.persistence.redis import RedisPersistentStorage


def rebuild_index():
    storage = RedisPersistentStorage()
    storage.rebuild_index()

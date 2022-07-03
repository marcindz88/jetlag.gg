from app.game.persistence.redis import RedisPersistentStorage


def rebuild_index():
    storage = RedisPersistentStorage()
    storage.rebuild_index()


def clear_db():
    storage = RedisPersistentStorage()
    storage.clear_db()

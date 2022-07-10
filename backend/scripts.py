from app.game.persistence.redis import RedisPersistentStorage


def clear_db():
    storage = RedisPersistentStorage()
    storage.clear_db()

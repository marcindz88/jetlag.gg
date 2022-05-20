import random


def random_with_probability(probability: float):
    if probability < 0 or probability > 1:
        raise RuntimeError
    return random.random() < probability

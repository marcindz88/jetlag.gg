#!/bin/bash

sudo docker-compose exec game python -c 'import scripts; scripts.clear_db()'

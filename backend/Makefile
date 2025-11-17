PY=python

migrate:
	$(PY) manage.py migrate

run:
	$(PY) manage.py runserver 0.0.0.0:8000

worker:
	celery -A core worker -l info

beat:
	celery -A core beat -l info

test:
	pytest -q

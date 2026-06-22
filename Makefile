.PHONY: up down build logs seed migrate reset backend-shell frontend-shell

up:
	docker-compose up

build:
	docker-compose up --build

down:
	docker-compose down

reset:
	docker-compose down -v

logs:
	docker-compose logs -f

migrate:
	docker-compose exec backend npx prisma migrate deploy

seed:
	docker-compose exec backend npx prisma db seed

backend-shell:
	docker-compose exec backend sh

frontend-shell:
	docker-compose exec frontend sh

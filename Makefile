DOCKER_OPENSSL_IMAGE = alpine/openssl:latest

.PHONY: all up down test test-unit test-integration lint format keys token ci clean

all: ci

up:
	docker compose up -d

down:
	docker compose down

keys:
	docker run --rm -v $(CURDIR):/workspace -w /workspace $(DOCKER_OPENSSL_IMAGE) sh -c "mkdir -p keys && if [ ! -f keys/private.pem ]; then openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out keys/private.pem; fi && if [ ! -f keys/public.pem ]; then openssl rsa -pubout -in keys/private.pem -out keys/public.pem; fi"

token:
	bash scripts/generate-dev-token.sh

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration

test:
	npm run test

lint:
	npm run lint
	npm run test:arch

format:
	npm run format

ci:
	bash scripts/guard.sh
	$(MAKE) lint
	$(MAKE) test

clean:
	rm -rf dist coverage

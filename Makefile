.PHONY: default build install cli web dev clean lint deps test icon

default:
	@echo options: build/clean/cli/deps/dev/icon/lint/test/web

build: cli web icon
	@npm run make

install: build
	@rm -rf /Applications/Unicode\ Search.app
	cp -a "out/Unicode Search-darwin-x64/Unicode Search.app" /Applications
	cp out/unicode-search $$HOME/bin/unicode-search
	chmod +x $$HOME/bin/unicode-search

cli: out/unicode-search

web: out/unicode-search.html

icon: assets/icon.png

dev:
	@npm start

clean:
	@rm -rf out assets/icon.png assets/icon.icns

lint:
	@npm run lint

deps:
	@npm install
	npm install playwright
	npx playwright install chromium firefox webkit

test: cli web icon
	@npm test

data/UnicodeData.txt:
	@node scripts/ensure-unicode-data.js

assets/icon.png: assets/icon.svg scripts/build-icon.js
	@npm run build:icon

out/unicode-search: src/cli/run-cli.js src/shared/unicode-core.js scripts/build-cli.js data/UnicodeData.txt
	@npm run build:cli

out/unicode-search.html: index.html renderer.js src/shared/unicode-core.js scripts/build-web.js data/UnicodeData.txt
	@npm run build:web

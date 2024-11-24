default:
	@echo options: build/clean/deps/dev/lint

build: index-compiled.html out/unicode-search
	@npm run make

install: build
	@rm -rf /Applications/Unicode-search.app
	cp -a out/Unicode-search-darwin-x64/Unicode-search.app /Applications
	cp out/unicode-search $$HOME/bin

out/unicode-search: app.js chars.js unicode-search.cli.js
	@mkdir out
	(echo '#!/usr/bin/env node'; cat app.js chars.js unicode-search.cli.js) > out/unicode-search
	chmod +x out/unicode-search

dev: index-compiled.html
	@npm start

clean:
	@rm -rf out index-compiled.html chars.js

lint:
	@npx semistandard

deps:
	@npm install --save-dev electron
	@npm install --save-dev @electron-forge/cli
	@npm install --save-dev semistandard
	@npx electron-forge import

index-compiled.html: index.html app.js chars.js
	cpp -w -P index.html index-compiled.html

chars.js:
	(printf 'let unicodeDataTxt = `';wget -q https://unicode.org/Public/UNIDATA/UnicodeData.txt -O -;echo '`;')>chars.js

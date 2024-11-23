default:
	@echo options: build/clean/deps/dev/lint

build: index-compiled.html
	@npm run make

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

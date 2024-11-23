default:
	@echo options: build/clean/deps/dev

build: index-compiled.html
	@npm run make

dev: index-compiled.html
	@npm start

clean:
	@rm -rf out index-compiled.html chars.js

deps:
	@npm install --save-dev electron
	@npm install --save-dev @electron-forge/cli
	@npx electron-forge import

index-compiled.html: index.html app.js chars.js
	cpp -w -P index.html index-compiled.html

chars.js:
	(printf 'let unicode_data_txt = `';wget -q https://unicode.org/Public/UNIDATA/UnicodeData.txt -O -;echo '`;')>chars.js

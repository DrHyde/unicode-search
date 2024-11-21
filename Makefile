default:
	@echo options: build/clean/deps/dev

build:
	@npm run make

clean:
	@rm -rf out

deps:
	@npm install --save-dev electron
	@npm install --save-dev @electron-forge/cli
	@npx electron-forge import

dev:
	@npm start

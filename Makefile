rf no	all: deploy

# Initial setup 
setup: 
	npm install
	npm install -g pxt
	pxt target microbit
	pxt install

build:
	GITHUB_ACCESS_TOKEN=$(GITHUB_TOKEN) PXT_FORCE_LOCAL=1 pxt build


deploy:
	GITHUB_ACCESS_TOKEN=$(GITHUB_TOKEN) PXT_FORCE_LOCAL=1 pxt deploy



test:
	pxt test

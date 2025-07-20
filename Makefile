all: deploy

# Initial setup 
setup: 
	npm install
	npm install -g pxt
	pxt target microbit
	pxt install

build:
	pxt build

deploy:
	pxt deploy

test:
	pxt test

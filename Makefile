.PHONY: all setup build deploy test push

VERSION := $(shell grep '"version"' pxt.json | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')

all: deploy

# Initial setup 
# you will need to install npm first
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
	GITHUB_ACCESS_TOKEN=$(GITHUB_TOKEN) PXT_FORCE_LOCAL=1 pxt test

serve:
	pxt serve


push: build 
	git commit --allow-empty -a -m "Release version v$(VERSION)"
	git push
	git tag v$(VERSION) 
	git push --tags


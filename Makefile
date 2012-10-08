.SUFFIXES: .md .html

all: build

server:
	python -m SimpleHTTPServer

chrome:
	google-chrome --allow-file-access-from-files

hint:
	jshint js/*.js assets/*.js

help: readme.html CONTRIBUTING.html

.md.html:
	markdown $< > $@

deploy:
	git checkout gh-pages
	git merge master
	git push origin gh-pages
	git checkout master

build: concat minify

concat:
	cat `grep "<script " game_dev.html | cut -d'"' -f2 | egrep "^libs/"` > build/libs.js
	cat `grep "<script " game_dev.html | cut -d'"' -f2 | egrep "(^js/)|(^assets/)"` > build/game.js

minify: concat
	cat build/libs.js | uglifyjs > build/libs.min.js
	cat build/game.js | uglifyjs > build/game.min.js

clean:
	rm readme.html

.PHONY: all server chrome hint help deploy build clean


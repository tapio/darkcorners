.SUFFIXES: .md .html

all: build

server:
	python -m SimpleHTTPServer

chrome:
	google-chrome --allow-file-access-from-files

hint:
	jshint js/*.js assets/*.js

help: README.html CONTRIBUTING.html

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
	cat build/libs.js | uglifyjs -nc --max-line-len 1024 > build/libs.min.js
	cat build/game.js | uglifyjs -nc --max-line-len 512 > build/game.min.js

clean:
	rm README.html CONTRIBUTING.html

.PHONY: all server chrome hint help deploy build clean


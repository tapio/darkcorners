.SUFFIXES: .md .html

all: build

server:
	python -m SimpleHTTPServer

chrome:
	google-chrome --allow-file-access-from-files

hint:
	for i in `ls js/*.js`; do jshint "$$i" | grep -v "is not defined."; done
	jshint assets/*.js
	jshint editor/*.js

help: README.html CONTRIBUTING.html ART-TODO.html CODE-TODO.html

.md.html:
	markdown $< > build/$@

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
	rm build/*.html

.PHONY: all server chrome hint help deploy build clean


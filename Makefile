
server:
	python -m SimpleHTTPServer

chrome:
	google-chrome --allow-file-access-from-files

build: concat minify

concat:
	cat `grep "<script " game_dev.html | cut -d'"' -f2 | egrep "^libs/"` > build/libs.js
	cat `grep "<script " game_dev.html | cut -d'"' -f2 | egrep "(^js/)|(^assets/)"` > build/game.js

minify: concat
	cat build/libs.js | uglifyjs > build/libs.min.js
	cat build/game.js | uglifyjs > build/game.min.js

.PHONY: server chrome build


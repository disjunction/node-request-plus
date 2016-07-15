.PHONY: test 

default: test

test:
	./node_modules/jasme/run.js test/*Spec.js
lint:
	./node_modules/eslint/bin/eslint.js .


all:
	elm-make Interface.elm --output interface.js
loc:
	wc -l \
	Expression.elm \
	Complex.elm Linear.elm \
	OurParser.elm ExpParser.elm \
	Eval.elm Interface.elm \
	port.js index.html

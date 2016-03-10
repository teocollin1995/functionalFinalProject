all:
	elm-make Interface.elm --output interface.js
loc:
	wc -l \
	Expression.elm \
	Complex.elm Linear.elm \
	OurParser.elm ExpParser.elm \
	Eval.elm Graphic.elm \
	Examples.elm Interface.elm \
	index.html

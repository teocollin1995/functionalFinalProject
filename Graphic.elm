module Graphic where

import Expression exposing (..)

import Graphics.Element as GE
import Graphics.Collage as C
import Color

import Eval as E
import ExpParser as Parser

type alias Range = (Float, Float)

-- now only plot single variable function
-- assuming all functions are univariate here

evaluate_ : Float -> Exp -> Exp
evaluate_ x e =
  case e of
    EReal _ -> e
    EComplex _ -> Debug.crash "complex evaluation is not supported"
    EConst _ -> e
    EVar _ -> EReal x
    EFun _ _ e1 -> evaluate_ x e1
    EUnaryOp op e1 -> Parser.fromOk_ <| E.eval <| EUnaryOp op <| evaluate_ x e1
    EBinaryOp op e1 e2 -> Parser.fromOk_ <| E.eval <|
                            EBinaryOp op (evaluate_ x e1) (evaluate_ x e2)
    _  -> Debug.crash "domain is not in the real numbers"

evaluate : Float -> Exp -> Float
evaluate x e = Parser.toReal <| evaluate_ x e

genPoints : Float -> Float -> Float -> List Float
genPoints step start end =
  let diff = end - start in
  let num = diff/step in
  List.map (\n -> n*step + start) [0..num-1]
      
plot : Range -> Exp -> GE.Element
plot range e =
  let (start,end) = range in
  let step = 0.01 in
  let points = genPoints step start end in
  let graph = List.map (\x -> (100*x, 100*evaluate x e)) points in
  let dots = List.map (\x -> C.move x <| C.filled Color.black <| C.circle 1) graph in
  let path = C.path graph in
  C.collage 300 300 [ C.traced C.defaultLine path ]

main : Signal GE.Element
main = Signal.constant <| plot (-1,1) <| Parser.fromOk_ <| Parser.parse "x^2-1"

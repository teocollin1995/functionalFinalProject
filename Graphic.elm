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

takeWhile : (a -> Bool) -> List a -> List a
takeWhile p xs =
  case xs of
    [] -> []
    x::xs' -> if p x then x :: takeWhile p xs'
              else []

dropWhile : (a -> Bool) -> List a -> List a
dropWhile p xs =
  case xs of
    [] -> []
    x :: xs' -> if p x then dropWhile p xs'
                else xs
                     
separate : Float -> List Float -> List (List Float)
separate cutoff xs =
  case xs of
    [] -> [[]]
    _  ->
      let pred x = abs x <= cutoff in
      takeWhile pred xs :: separate cutoff (dropWhile (not << pred) <| dropWhile pred xs)

separate1 : Float -> List (Float, Float) -> List (List (Float, Float))
separate1 cutoff xs =
  case xs of
    [] -> [[]]
    _  -> let pred (x,y) = abs y <=cutoff in
          takeWhile pred xs :: separate1 cutoff (dropWhile (not << pred) <| dropWhile pred xs)
                    
plot : Range -> Float -> Exp -> GE.Element
plot range cutoff e =
  let (start,end) = range in
  let step = 0.01 in
  let points = genPoints step start end in
  let graph = List.map (\x -> (50*x, 50*evaluate x e)) points in
  let graphs = separate1 cutoff graph in
  let paths = List.map (C.traced C.defaultLine << C.path) graphs in
  let xaxis = C.traced C.defaultLine <| C.segment (-100,0) (100,0) in
  let yaxis = C.traced C.defaultLine <| C.segment (0,-100) (0,100) in
  C.collage 400 400 <| xaxis :: yaxis :: paths

main : Signal GE.Element
main = Signal.constant <| plot (-2,2) 400 <| Parser.fromOk_ <| Parser.parse "1/x"

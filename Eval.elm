module Eval where

import Expression exposing (..)
import Complex as C

eval : Exp -> Exp
eval e =
  case e of
    EReal _ -> e
    EComplex _ -> e
    EMatrix _ -> e
    EVector _ -> e
    EConst const ->
      case const of
        Pi -> EReal pi
        E  -> EReal Basics.e
        _  -> Debug.crash <| "eval: impossible"
    EUnaryOp op e ->
      let f = unparseUOp op in f (eval e)
    EBinaryOp op e1 e2 ->
      let f = unparseBOp op in
      let (res1, res2) = (eval e1, eval e2) in
      f res1 res2
    _ -> e

realfunc : Op -> (Float -> Float) -> Exp -> Exp
realfunc op f e =
  case e of
    EReal x -> EReal <| f x
    _       -> Debug.crash <| toString op

toRealfunc : Op -> (Complex -> Float) -> Exp -> Exp
toRealfunc op f e =
  case e of
    EComplex x -> EReal <| f x
    _       -> Debug.crash <| toString op
               
complexfunc : Op -> (Complex -> Complex) -> Exp -> Exp
complexfunc op f e =
  case e of
    EReal x -> EComplex <| f <| C.toComplex x
    EComplex x -> EComplex <| f x
    _          -> Debug.crash <| toString op
                  
unparseUOp : Op -> Exp -> Exp
unparseUOp op =
  let foo = realfunc op in
  let bar = toRealfunc op in
  case op of
    Sin -> foo sin
    Cos -> foo cos
    Tan -> foo tan
    ArcSin -> foo asin
    ArcCos -> foo acos
    ArcTan -> foo atan
    Floor -> foo (toFloat << floor)
    Ceiling -> foo (toFloat << ceiling)
    Round -> foo (toFloat << round)
    Sqrt -> foo sqrt
    Log -> foo (logBase 10)
    Abs -> foo abs
    Re  -> bar C.real
    Im  -> bar C.imaginary
    _  -> Debug.crash "unParseUOp"

unparseBOp : Op -> Exp -> Exp -> Exp
unparseBOp op =
  let foo = realAndComplex op in
  case op of
    Plus -> foo (+) C.add
    Minus -> foo (-) C.sub
    Mult -> foo (*) C.mult
    Frac -> foo (/) C.div
    --Pow  -> foo (^) C.exp
    _    -> Debug.crash "unparseBOp"

realAndComplex : Op -> (Float -> Float -> Float) -> (Complex -> Complex -> Complex)
                 -> Exp -> Exp ->  Exp
realAndComplex op realFun complexFun e1 e2 =
  case (e1, e2) of
    (EReal x, EReal y) -> EReal <| realFun x y
    (EReal x, EComplex y) -> EComplex <| complexFun (C.toComplex x) y
    (EComplex x, EReal y) -> EComplex <| complexFun x (C.toComplex y)
    (EComplex x, EComplex y) -> EComplex <| complexFun x y
    _   -> Debug.crash <| toString op

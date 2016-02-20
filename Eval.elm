module Eval where

import Expression exposing (..)

eval : Exp -> Exp
eval e =
  case e of
    EInt _ -> e
    EFloat _ -> e
    EComplex _ -> e
    EMatrix _ -> e
    EVector _ -> e
    EConst const ->
      case const of
        Pi -> EFloat pi
        E  -> EFloat Basics.e
        _  -> Debug.crash <| "eval: " ++ toString e
    EUnaryOp op e ->
      let f = unparseUOp op in
      case eval e of      
        EInt x -> EFloat <| f (toFloat x)
        EFloat x -> EFloat <| f x
        -- currently only support operators on int or float
        _  -> Debug.crash <| "eval: " ++ toString e
    EBinaryOp op e1 e2 ->
      let f = unparseBOp op in
      let (res1, res2) = (eval e1, eval e2) in
      case (res1, res2) of
        (EInt a, EInt b) -> EInt <| round <| f (toFloat a) (toFloat b)
        (EFloat a, EFloat b) -> EFloat <| f a b
        _  -> Debug.crash <| "eval: " ++ toString e
    _ -> e

-- TODO : incorporate other operators that have type conflicts with the type signature
unparseUOp : Op -> Float -> Float
unparseUOp op =
  case op of
    Sin -> sin
    Cos -> cos
    Tan -> tan
    ArcSin -> asin
    ArcCos -> acos
    ArcTan -> atan
    Floor -> toFloat << floor
    Ceiling -> toFloat << ceiling
    Round -> toFloat << round
    Sqrt -> sqrt
    Log -> logBase 10
    Abs -> abs
    _  -> Debug.crash "unParseUOp"

-- TODO: same as unparseBOp
unparseBOp : Op -> Float -> Float -> Float
unparseBOp op =
  case op of
    Plus -> (+)
    Minus -> (-)
    Mult -> (*)
    Frac -> (/)
    Pow  -> (^)
    _    -> Debug.crash "unparseBOp"

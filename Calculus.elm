module Calculus where 

import Expression exposing (..)
import ExpParser exposing (parse)
--symbolicDifferentiation
--numericDifferentiation
--numericIntegration
--plotting 


--- derivatives ---

derivative : Var -> Exp -> Exp
derivative v e =
  case e of
    EFun _ vars e1 -> if List.member v vars then derv v e
                      else EReal 0
    _              -> derv v e
                      
derv : Var -> Exp -> Exp
derv v e =
  case e of
    EVar x -> if x == v then EReal 1 else EReal 0
    EUnaryOp op e1 -> chain1 v op e1
    EBinaryOp op e1 e2 -> chain2 v op e1 e2
    EConst _ -> EReal 0
    EReal _ -> EReal 0
    EComplex _ -> EReal 0
    _ -> Debug.crash <| "derv: unsupported " ++ toString e

realMult : Float -> Exp -> Exp
realMult c e = EBinaryOp Mult (EReal c) e

realDiv : Float -> Exp -> Exp
realDiv c e = EBinaryOp Frac (EReal c) e

pow : Exp -> Float -> Exp
pow e n = EBinaryOp Pow e (EReal n)

plus : Exp -> Exp -> Exp
plus = EBinaryOp Plus

minus : Exp -> Exp -> Exp
minus = EBinaryOp Minus

mult : Exp -> Exp -> Exp
mult = EBinaryOp Mult

div : Exp -> Exp -> Exp
div = EBinaryOp Frac

-- unary operators
chain1 : Var -> Op -> Exp -> Exp
chain1 v op e =
  let foo = EBinaryOp Mult (derv v e) in
  case op of
    Sin -> foo (EUnaryOp Cos e)
    Cos -> foo (realMult (-1) <| EUnaryOp Sin e)
    Tan -> foo (realDiv 1 <| pow (EUnaryOp Cos e) 2)
    -- add other unary operators
    _   -> Debug.crash "chain1"

-- binary operators
chain2 : Var -> Op -> Exp -> Exp -> Exp
chain2 v op e1 e2 =
  let d1 = derv v e1
      d2 = derv v e2
  in
  case op of
    Plus -> plus d1 d2
    Minus -> minus d1 d2
    Mult -> (d1 `mult` e1) `plus` (e1 `mult` d2)
    Frac -> ((d1 `mult` e1) `minus` (d2 `mult` e1)) `div` (pow e2 2)
    Pow ->
      case e2 of
        EReal n -> if ExpParser.isInt n then
                     (n `realMult` (pow e1 (n-1))) `mult` d1
                   else Debug.crash "pow"
        _       -> Debug.crash "pow"
    -- add more binary operators
    _ -> Debug.crash "chain2"
    

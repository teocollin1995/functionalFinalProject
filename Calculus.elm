module Calculus where 

import Expression exposing (..)
import ExpParser exposing (parse)
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
    

--numeric stuff
--higher order diffence qout
--should implement checks for h == 0 and what not

---
epsilon = 0.0000000000001
interationMax = 50000
--numeric diff stuff -> WILL NOT WORK IF THE DERIVATIVE DOES NOT EXIST!
symetricDiffrenceQout : (Float -> Float) -> Float -> Float -> Float
symetricDiffrenceQout f x h = 
  if h == 0 then Debug.crash "Can't divide by 0"
  else
    (f (x+h) - f (x-h))/(2*h)


stencil : (Float -> Float) -> Float -> Float -> Float
stencil f x h = 
  if h == 0 then Debug.crash "Can't divide by 0 "
  else 
    ((-1) * f (x+2*h) + 8 * f (x+h) - 8*f(x - h) + f(x-2*h)) / (12 * h)

numDiff : (Float -> Float) -> Float -> Float -> Float -> Int ->  Float
numDiff f ff x h n =
  let 
    ff' = symetricDiffrenceQout f x (h / 5)
  in
    if abs (ff - ff') < epsilon 
    then ff' 
    else if n > interationMax then ff'
    else numDiff f ff' x (h / 5) (n+1)
  
-- numDiff' f ff x h =
--   let 
--     ff' = stencil f x (h / 5)
--   in
--     if abs (ff - ff') < epsilon 
--     then ff' 
--     else numDiff' f ff' x (h / 5)


numericDiff : (Float -> Float) -> Float -> Float
numericDiff f x = numDiff f 100000000000000000 x (0.1) 0
      




type alias Partitions = List (Float,Float)

genPartitions : Int -> Float -> Float -> Partitions
genPartitions n a b = 
  let
    delta = (b-a)/(toFloat n)
    interval n = (a+delta*n,a+delta*(n+1))
  in
    List.map interval [0..((toFloat n)-1)]


splitPartitions : Int -> Partitions -> Partitions
splitPartitions n p = List.concatMap ( \(a,b) -> genPartitions n a b) p
    

integralApproximation :  (Float -> Float) -> ((Float -> Float) -> Partitions -> Float ) -> Partitions -> Float -> Int -> Float
integralApproximation f app p s n = 
  let
    newPartitions = splitPartitions 6 p 
    newSum = app f newPartitions
  in
    if abs (newSum - s) < 0.000001 then newSum --we don't have enough memory in elm to be that picky... we could optimize but there is crap to do
    else if n > interationMax then newSum
    else integralApproximation f app newPartitions newSum (n+1)

trapzoid : (Float -> Float) -> (Float, Float) -> Float
trapzoid f (a,b) = (b-a) * ((f a) + (f b)) /2 

trapzoidSum : (Float -> Float) -> Partitions -> Float 
trapzoidSum f p = List.foldr (+) 0 (List.map (\ i -> trapzoid f i) p)

--most    
trapazoidIntegral : (Float -> Float) -> (Float, Float) -> Float
trapazoidIntegral f (a,b) = integralApproximation f trapzoidSum (splitPartitions 6 [(a,b)]) 10000000000000 0 


simpson : (Float -> Float) -> (Float, Float) -> Float
simpson f (a,b) = ((b-a)/6) * (f a + 4 * f (( a+ b)/2) + f b)

simpsonSum : (Float -> Float) -> Partitions -> Float 
simpsonSum f p =  List.foldr (+) 0 (List.map (\ i -> simpson f i) p)

--better if some derivative exists?
simpsonIntegral : (Float -> Float) -> (Float, Float) -> Float
simpsonIntegral f (a,b) = integralApproximation f simpsonSum (splitPartitions 6 [(a,b)]) 10000000000000 0


--if we want something faster we could look at: https://en.wikipedia.org/wiki/Romberg%27s_method


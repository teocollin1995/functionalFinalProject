module Eval where

import Expression exposing (..)
import Complex as C
import Linear as L

import Array as A

eval : Exp -> Exp
eval e =
  case e of
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

type alias UnaryFunc =
   { realFun : Real -> Real
   , complexFun : Complex -> Complex
   --, realToComplex : Real -> Complex
   --, complexToReal : Complex -> Real
   }
                     
genUnaryFunc : Op -> UnaryFunc -> Exp -> Exp
genUnaryFunc op f e =
  case e of
    EReal x -> EReal <| f.realFun x
    EComplex x -> EComplex <| f.complexFun x  
    _  -> Debug.crash <| toString op
          
toRealfunc : Op -> (Complex -> Real) -> Exp -> Exp
toRealfunc op f e =
  case e of
    EComplex x -> EReal <| f x
    _          -> Debug.crash <| toString op

realfunc : Op -> (Real -> Real) -> Exp -> Exp
realfunc op f e =
  case e of
    EReal x -> EReal <| f x
    _       -> Debug.crash <| toString op

isNum : Exp -> Bool
isNum e =
  case e of
    EReal _ -> True
    EComplex _ -> True
    _ -> False

toNum : Exp -> Complex
toNum e =
  case e of
    EReal x -> C.fromReal x
    EComplex x -> x
    _  -> Debug.crash "fail to convert: not a number"
          
convertEVector : Vector Exp -> Vector Complex
convertEVector v =
  let foo a acc = if isNum a then A.push (toNum a) acc
                  else Debug.crash "fail to convert: not a number"
  in
    A.foldr foo A.empty v
   
convertEMatrix : Matrix Exp -> Matrix Complex
convertEMatrix m =
  A.foldr (\a -> A.push (convertEVector a)) A.empty m

vectorToExp : Vector Complex -> Vector Exp
vectorToExp v = A.map EComplex v

matrixToExp : Matrix Complex -> Matrix Exp
matrixToExp m = A.map vectorToExp m

unwrapMatrix : Exp -> Matrix Exp
unwrapMatrix m =
  case m of
    EMatrix m' -> m'
    _          -> Debug.crash "not a matrix"
                  
unparseUOp : Op -> Exp -> Exp
unparseUOp op =
  let foo = genUnaryFunc op in
  let bar = toRealfunc op in
  let baz = realfunc op in
  case op of
    Sin -> foo { realFun = sin, complexFun = C.csin }
    Cos -> foo { realFun = cos, complexFun = C.ccos }
    Tan -> foo { realFun = tan, complexFun = C.ctan }
    ArcSin -> foo { realFun = asin, complexFun = flip C.casin 0 } --this needs to be fixed
    ArcCos -> foo { realFun = acos, complexFun = flip C.casin 0 }
    ArcTan -> foo { realFun = atan, complexFun = flip C.catan 0 }
    Floor ->  baz <| toFloat << floor
    Ceiling -> baz <| toFloat << ceiling
    Round -> baz <| toFloat << round
    Sqrt -> foo { realFun = sqrt, complexFun = fst << C.sqrt } -- this needs to be fixed
    Log -> foo { realFun = logBase 10, complexFun = flip C.ln 0 } -- also this
    Abs -> \e ->
           case e of
             EReal x -> EReal <| abs x
             EComplex x -> EReal <| C.abs x
             _   -> Debug.crash "abs"
    Re  -> bar C.real
    Im  -> bar C.imaginary
    Det -> EComplex << L.simpleDet L.complexSpace << convertEMatrix << unwrapMatrix
    EigenValue -> \m -> case L.eigenValues (convertEMatrix <| unwrapMatrix m) of
                          Just x -> EVector <| vectorToExp x
                          _      -> Debug.crash "eigenvalue"
    EigenVector -> \m -> case L.eigenVectors (convertEMatrix <| unwrapMatrix m) of
                           Just x -> EMatrix <| matrixToExp x
                           _      -> Debug.crash "eigenvector"
    Inv -> \m -> case L.invert expSpace (unwrapMatrix m) of
                   Just m1 -> EMatrix m1
                   _       -> Debug.crash "matrix not invertible"
    _  -> Debug.crash "unParseUOp"

unparseBOp : Op -> Exp -> Exp -> Exp
unparseBOp op =
  let foo = genBinaryFunc op in
  let dummy = L.identity expSpace 0 in
  case op of
    Plus -> foo { realFun = (+), complexFun = C.add, matrixFun = matrixMult }
    Minus -> foo { realFun = (-), complexFun = C.sub, matrixFun = matrixMinus }
    Mult -> foo { realFun = (*), complexFun = C.mult, matrixFun = matrixMult }
    Frac -> foo { realFun = (/), complexFun = C.div, matrixFun = always <| always dummy }
    Pow  -> foo { realFun = (^), complexFun = C.pow, matrixFun = always <| always dummy }
    _    -> Debug.crash "unparseBOp"

type alias BinaryFunc =
  { realFun : Float -> Float -> Float
  , complexFun : Complex -> Complex -> Complex
  , matrixFun : Exp -> Exp -> Matrix Exp
  }
                
genBinaryFunc : Op -> BinaryFunc -> Exp -> Exp ->  Exp
genBinaryFunc op f e1 e2 =
  case (e1, e2) of
    (EReal x, EReal y) -> EReal <| f.realFun x y
    (EReal x, EComplex y) -> EComplex <| f.complexFun (C.fromReal x) y
    (EComplex x, EReal y) -> EComplex <| f.complexFun x (C.fromReal y)
    (EComplex x, EComplex y) -> EComplex <| f.complexFun x y
    _   -> EMatrix <| f.matrixFun e1 e2

type alias NumBinaryFunc =
  { real: Float -> Float -> Float
  , complex : Complex -> Complex -> Complex
  }

numBinaryFunc : Op -> NumBinaryFunc -> Exp -> Exp -> Exp
numBinaryFunc op f e1 e2 =
  case (e1, e2) of
    (EReal x, EReal y) -> EReal <| f.real x y
    (EReal x, EComplex y) -> EComplex <| f.complex (C.fromReal x) y
    (EComplex x, EReal y) -> EComplex <| f.complex x (C.fromReal y)
    (EComplex x, EComplex y) -> EComplex <| f.complex x y
    _    -> Debug.crash <| "numBinaryFunc: " ++ toString op

-- expressions space
expSpace : L.Space Exp
expSpace =
  { zero = EComplex C.zero
  , one  = EComplex C.one
  , add  = numBinaryFunc Plus { real = (+), complex = C.add }
  , mult = numBinaryFunc Mult { real = (*), complex = C.mult }
  , sub  = numBinaryFunc Minus { real = (-), complex = C.sub }
  , div  = numBinaryFunc Frac { real = (/), complex = C.div }
  , fromReal = EComplex << C.fromReal
  , abs  = \e ->
             case e of
               EReal x -> abs x
               EComplex x -> C.abs x
               _  -> Debug.crash "abs"
  }

matrixMult : Exp -> Exp -> Matrix Exp
matrixMult e1 e2 =
  case (e1,e2) of
    (EMatrix m1, EMatrix m2) -> L.matrixMult expSpace m1 m2
    (EReal x, EMatrix m) -> L.scaleMatrix expSpace e1 m
    (EComplex x, EMatrix m) -> L.scaleMatrix expSpace e1 m
    (EMatrix m, EReal x) -> L.scaleMatrix expSpace e2 m
    (EMatrix m, EComplex x) -> L.scaleMatrix expSpace e2 m
    _ -> Debug.crash "matrixMult"

matrixPlus : Exp -> Exp -> Matrix Exp
matrixPlus e1 e2 =
  case (e1, e2) of
    (EMatrix m1, EMatrix m2) -> L.elementWise expSpace.add m1 m2
    _ -> Debug.crash "matrixPlus"

matrixMinus : Exp -> Exp -> Matrix Exp
matrixMinus e1 e2 =
  case (e1, e2) of
    (EMatrix m1, EMatrix m2) -> L.elementWise expSpace.sub m1 m2
    _ -> Debug.crash "matrixMinus"

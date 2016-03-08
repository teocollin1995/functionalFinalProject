module Eval where

import Expression exposing (..)
import Complex as C
import Linear as L
import Calculus as Ca
import ExpParser as Parser

import Array as A
import Result as R

(>>=) = R.andThen
        
eval : Exp -> Result String Exp
eval e = R.map Parser.simplify <|
  case e of
    EConst const -> Ok <|
      case const of
        Pi -> EReal pi
        E  -> EReal Basics.e
        _  -> Debug.crash <| "eval: impossible"
    EUnaryOp op e ->
      let f = unparseUOp op in (eval e) >>= f
    EBinaryOp op e1 e2 ->
      let f = unparseBOp op in
      let (res1, res2) = (eval e1, eval e2) in
      res1 >>= \e1 ->
        res2 >>= \e2 ->
          f e1 e2
    _ -> Ok e

type alias UnaryFunc =
   { realFun : Real -> Real
   , complexFun : Complex -> Complex
   --, realToComplex : Real -> Complex
   --, complexToReal : Complex -> Real
   }
                     
genUnaryFunc : Op -> UnaryFunc -> Exp -> Result String Exp
genUnaryFunc op f e =
  case e of
    EReal x -> Ok <| EReal <| f.realFun x
    EComplex x -> Ok <| EComplex <| f.complexFun x
    EVar _ -> Ok <| EUnaryOp op e
    EFun _ _ _ -> Ok <| EUnaryOp op e
    _  -> Err <| toString op ++ ": invalid input"
          
toRealfunc : Op -> (Complex -> Real) -> Exp -> Result String Exp
toRealfunc op f e =
  case e of
    EComplex x -> Ok <| EReal <| f x
    EVar _ -> Ok <| EUnaryOp op e
    EFun _ _ _ -> Ok <| EUnaryOp op e
    _          -> Err <| toString op ++ ": invalid input"

realfunc : Op -> (Real -> Real) -> Exp -> Result String Exp
realfunc op f e =
  case e of
    EReal x -> Ok <| EReal <| f x
    EVar _ -> Ok <| EUnaryOp op e
    EFun _ _ _ -> Ok <| EUnaryOp op e
    _       -> Err <| toString op ++ ": invalid input"
          
convertEVector : Vector Exp -> Vector Complex
convertEVector v =
  let foo a acc = if Parser.isNum a then A.push (Parser.toNum a) acc
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
                  
unparseUOp : Op -> Exp -> Result String Exp
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
             EReal x -> Ok <| EReal <| abs x
             EComplex x -> Ok <| EReal <| C.abs x
             _   -> Err "abs: invalid input."
    Re  -> bar C.real
    Im  -> bar C.imaginary
    Det -> \m -> case L.simpleDet1 L.complexSpace <| convertEMatrix <| unwrapMatrix m of
                   Just x -> Ok <| EComplex x
                   _      -> Err <| "det: invalid input."
    EigenValue -> \m -> case L.eigenValues (convertEMatrix <| unwrapMatrix m) of
                          Just x -> Ok <| EVector <| vectorToExp x
                          _      -> Err "eigenvalue: invalid input"
    EigenVector -> \m -> case L.eigenVectors (convertEMatrix <| unwrapMatrix m) of
                           Just x -> Ok <| EMatrix <| matrixToExp x
                           _      -> Err "eigenvector: invalid input"
    Inv -> \m -> case L.invert expSpace (unwrapMatrix m) of
                   Just m1 -> Ok <| EMatrix m1
                   _       -> Err "inverse: matrix not invertible"
    Diagonalize -> \m -> case L.diagonalization (convertEMatrix <| unwrapMatrix m) of
                           Just (m1,m2,m3) -> let foo = L.matrixMult L.complexSpace in
                                              Ok <| EMatrix <| matrixToExp ((m1 `foo` m2) `foo` m3)
                           _               -> Err "matrix not diagonalizable"
    _  -> Debug.crash "unParseUOp"

unparseBOp : Op -> Exp -> Exp -> Result String Exp
unparseBOp op =
  let foo = genBinaryFunc op in
  let dummy = L.identity expSpace 0 in
  case op of
    Plus -> foo { realFun = (+), complexFun = C.add, matrixFun = matrixMult }
    Minus -> foo { realFun = (-), complexFun = C.sub, matrixFun = matrixMinus }
    Mult -> foo { realFun = (*), complexFun = C.mult, matrixFun = matrixMult }
    Frac -> foo { realFun = (/), complexFun = C.div, matrixFun = always <| always dummy }
    Pow  -> foo { realFun = (^), complexFun = C.pow, matrixFun = always <| always dummy }
    Derv -> \var e ->
             case var of
               EVar x -> eval <| Ca.derivative x e
               _      -> Debug.crash "derv: impossible"
    _    -> Debug.crash "unparseBOp"

type alias BinaryFunc =
  { realFun : Float -> Float -> Float
  , complexFun : Complex -> Complex -> Complex
  , matrixFun : Exp -> Exp -> Matrix Exp
  }
                
genBinaryFunc : Op -> BinaryFunc -> Exp -> Exp -> Result String Exp
genBinaryFunc op f e1 e2 =
  case (e1, e2) of
    (EReal x, EReal y) -> Ok <| EReal <| f.realFun x y
    (EReal x, EComplex y) -> Ok <| EComplex <| f.complexFun (C.fromReal x) y
    (EComplex x, EReal y) -> Ok <| EComplex <| f.complexFun x (C.fromReal y)
    (EComplex x, EComplex y) -> Ok <| EComplex <| f.complexFun x y
    (EVar _, _) -> Ok <| EBinaryOp op e1 e2
    (_, EVar _) -> Ok <| EBinaryOp op e1 e2
    (EFun _ _ _, _) -> Ok <| EBinaryOp op e1 e2
    (_, EFun _ _ _) -> Ok <| EBinaryOp op e1 e2
    (EMatrix _, _) -> Ok <| EMatrix <| f.matrixFun e1 e2
    (_, EMatrix _) -> Ok <| EMatrix <| f.matrixFun e1 e2
    _  -> if isFunc e1 || isFunc e2 then Ok <| EBinaryOp op e1 e2
          else Err <| toString op ++ ": invalid input"

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

isFunc : Exp -> Bool
isFunc e =
  case e of
    EVar _ -> True
    EFun _ _ _ -> True
    EUnaryOp _ e1 -> isFunc e1
    EBinaryOp _ e1 e2 -> isFunc e1 || isFunc e2
    _ -> False

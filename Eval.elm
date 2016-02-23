module Eval where

import Expression exposing (..)
import Complex as C
import Linear as L

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
                  
unparseUOp : Op -> Exp -> Exp
unparseUOp op =
  let foo = genUnaryFunc op in
  let undefined = Debug.crash <| toString op ++ " :undefined for complex" in
  let bar = toRealfunc op in
  case op of
    Sin -> foo { realFun = sin, complexFun = C.csin }
    Cos -> foo { realFun = cos, complexFun = C.ccos }
    Tan -> foo { realFun = tan, complexFun = C.ctan }
    ArcSin -> foo { realFun = asin, complexFun = flip C.casin 0 } --this needs to be fixed
    ArcCos -> foo { realFun = acos, complexFun = flip C.casin 0 }
    ArcTan -> foo { realFun = atan, complexFun = flip C.catan 0 }
    Floor -> foo { realFun = toFloat << floor, complexFun = undefined }
    Ceiling -> foo { realFun = (toFloat << ceiling), complexFun = undefined }
    Round -> foo { realFun = (toFloat << round), complexFun = undefined }
    Sqrt -> foo { realFun = sqrt, complexFun = fst << C.sqrt } -- this needs to be fixed
    Log -> foo { realFun = logBase 10, complexFun = flip C.ln 0 } -- also this
    Abs -> \e ->
           case e of
             EReal x -> EReal <| abs x
             EComplex x -> EReal <| C.abs x
             _   -> Debug.crash "abs"
    Re  -> bar C.real
    Im  -> bar C.imaginary
    _  -> Debug.crash "unParseUOp"

unparseBOp : Op -> Exp -> Exp -> Exp
unparseBOp op =
  let foo = genBinaryFunc op in
  case op of
    Plus -> foo { realFun = (+), complexFun = C.add, matrixFun = always identity } -- the matrixFun needs to be added
    Minus -> foo { realFun = (-), complexFun = C.sub, matrixFun = always identity }
    Mult -> foo { realFun = (*), complexFun = C.mult, matrixFun = always identity }
    Frac -> foo { realFun = (/), complexFun = C.div, matrixFun = always identity }
    Pow  -> foo { realFun = (^), complexFun = C.pow, matrixFun = always identity }
    _    -> Debug.crash "unparseBOp"

type alias BinaryFunc =
  { realFun : Float -> Float -> Float
  , complexFun : Complex -> Complex -> Complex
  , matrixFun : Matrix Exp -> Matrix Exp -> Matrix Exp
  }
                
genBinaryFunc : Op -> BinaryFunc -> Exp -> Exp ->  Exp
genBinaryFunc op f e1 e2 =
  case (e1, e2) of
    (EReal x, EReal y) -> EReal <| f.realFun x y
    (EReal x, EComplex y) -> EComplex <| f.complexFun (C.fromReal x) y
    (EComplex x, EReal y) -> EComplex <| f.complexFun x (C.fromReal y)
    (EComplex x, EComplex y) -> EComplex <| f.complexFun x y
    (EMatrix m1, EMatrix m2) -> EMatrix <| f.matrixFun m1 m2
    _   -> Debug.crash <| toString op

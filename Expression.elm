module Expression where

type Exp =
  EBinaryOp Op Exp Exp
  | EUnaryOP Op Exp
  | EConst Op
  | EInt Int
  | EFloat Float
  | EPoly Poly

type Poly = List Mono
type alias Mono = { coeff : Float, var: String, pow: Int}

-- Op refers to built in functions/constant
type Op =
   -- constants
   Pi | E
   -- unary ops
   | Sin | Cos | Tan | ArcSin | ArcCos | ArcTan
   | Floor | Ceiling | Round
   | Sqrt | Log
   -- binary ops
   | Plus | Minus | Mult | Frac
   | Pow | Mod
   | LogBase
   

module Expression where
import Array exposing (Array)
--see http://infoscience.epfl.ch/record/169879/files/RMTrees.pdf for array implementation detail
--in any event, if we really need to, the javascript ffi turns these arrays into javascript arrays
--so we can keep the representation the same even if we end up using it

type Exp =
  EBinaryOp Op Exp Exp
  | EUnaryOP Op Exp
  | EConst Op
  | Variable String --
  | EInt Int
  | EFloat Float
  | EComplex Float Float
  | EPoly Poly
  | Matrix Exp
  | Vector Exp

type Poly = List Mono
type alias Mono = { coeff : Float, var: String, pow: Int}
type alias Vector a = Array a
--type alias RowVector a = Vector a
--type alias ColVector a = Vector a
type alias Matrix a = Vector (Vector a)


-- initVectorSample : Int -> Vector Exp
-- initVectorSample a = Array.initialize a (\x -> EInt x)
-- initMatrixSample : Int -> Matrix Exp
-- initMatrixSample a = Array.initialize a (\x -> initVectorSample a)

-- Op refers to built in functions/constant
type Op =
   -- constants
   Pi | E
   -- unary ops
   | Sin | Cos | Tan | ArcSin | ArcCos | ArcTan
   | Floor | Ceiling | Round
   | Sqrt | Log
   | Re | Img 
   | Abs 
   -- binary ops
   | Plus | Minus | Mult | Frac
   | Pow | Mod
   | LogBase
   | Derv --We may want people to be able to add these in with other expressions? 
   

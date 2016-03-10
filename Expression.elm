module Expression where
import Array exposing (Array)
--see http://infoscience.epfl.ch/record/169879/files/RMTrees.pdf for array implementation detail
--in any event, if we really need to, the javascript ffi turns these arrays into javascript arrays
--so we can keep the representation the same even if we end up using it

type Exp =
  EBinaryOp Op Exp Exp
  | EUnaryOp Op Exp
  | EConst Op
  | EVar Var
  | EReal Real
  | EComplex Complex 
  | EPoly Poly
  | EMatrix (Matrix Exp)
  | EVector (Vector Exp)
  | EFun Name (List Var) Exp -- for example f(x,y) = x^2 + y^2
  | EAnnot String Exp --stuff some information for unparsing
  | EIntegral Float Float Exp -- integral has 3 arguments, so we hack like this
    
type alias Var = String
type alias Name = String
                
type Poly = List Mono
type alias Mono = { coeff : Float, var: String, pow: Int}
                
type alias Complex = {re : Float, im: Float}
type alias Real = Float

type alias Vector a = Array a
type alias Matrix a = Vector (Vector a)

-- Op refers to built in functions/constant
type Op =
   -- constants
   Pi | E
   -- unary ops
   | Sin | Cos | Tan | ArcSin | ArcCos | ArcTan
   | Floor | Ceiling | Round
   | Sqrt | Log
   | Re | Im 
   | Abs
   | Negate
   -- binary ops
   | Plus | Minus | Mult | Frac
   | Pow | Mod
   -- domain specific operators
   | Derv
   | NumDerv
   --| Integral
   | Det
   | EigenValue
   | EigenVector
   | Inv
   | Diagonalize
   | RRef
   | Solve
   -- more to be added
   

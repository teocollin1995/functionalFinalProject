module CostlyLinear where
import Expression exposing (Matrix, Vector, Complex)
import Complex as C
import Array
import Native.CostlyLinear

type alias JavaComplexNum  = {x : Float, y: Float}
type alias JavaComplexVector = {x : Vector Float, y : Vector Float}
type alias JavaComplexMatrix = {x : Matrix Float, y: Matrix Float}

goodComplexToEvil : Complex ->  JavaComplexNum
goodComplexToEvil z = {x = z.re, y = z.im}

goodComplexVectorToEvil : Vector Complex -> JavaComplexVector
goodComplexVectorToEvil z = {x = Array.map (C.real) z, y= (Array.map) (C.imaginary) z}

goodComplexMatrixToEvil : Matrix Complex -> JavaComplexMatrix
goodComplexMatrixToEvil z = {x = Array.map (\v -> Array.map (C.real) v) z, y= Array.map (\v -> Array.map (C.imaginary) v) z}

--eigen : Matrix Complex -> Float
--eigen m = Native.CostlyLinear.eigens (goodComplexMatrixToEvil m)
--r : Matrix (Complex)
r =  Array.fromList [  Array.fromList [C.fromReal 1, C.fromReal 2, C.fromReal 5], Array.fromList [C.fromReal 3, C.fromReal 5, C.fromReal (-1)], Array.fromList [C.fromReal 7, C.fromReal (-3), C.fromReal 5]]
--toFloat((Array.Extra.getUnsafe 0 (Array.fromList l)).re)
--l = Native.CostlyLinear.eigens r



eigen : Matrix (Complex) -> {values: Vector Complex, cols: Matrix Complex}
eigen m = Native.CostlyLinear.eigens (Array.toList (Array.map (Array.toList) m))

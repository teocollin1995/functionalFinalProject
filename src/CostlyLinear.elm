module CostlyLinear where
import Expression exposing (Matrix, Vector, Complex)
import Complex as C
import Array
import Native.CostlyLinear


r =  Array.fromList [  Array.fromList [C.fromReal 1, C.fromReal 2, C.fromReal 5], Array.fromList [C.fromReal 3, C.fromReal 5, C.fromReal (-1)], Array.fromList [C.fromReal 7, C.fromReal (-3), C.fromReal 5]]
--toFloat((Array.Extra.getUnsafe 0 (Array.fromList l)).re)
--l = Native.CostlyLinear.eigens r



eigen : Matrix (Complex) -> {values: Vector Complex, cols: Matrix Complex}
eigen m = Native.CostlyLinear.eigens (Array.toList (Array.map (Array.toList) m))
--randomness in a horrible horrible way... for testing purpose
randomComplex : a -> Complex
randomComplex = Native.CostlyLinear.random_complex

testDet : Matrix (Complex) -> Complex
testDet m = Native.CostlyLinear.test_det  (Array.toList (Array.map (Array.toList) m))

randomInt : a -> Int 
randomInt = Native.CostlyLinear.random_int
--doubles as diagproduct if matrix is nonsquare
testTrace : Matrix (Complex) -> Complex
testTrace m = Native.CostlyLinear.test_trace (Array.toList (Array.map (Array.toList) m))

module CostlyLinear where
import Expression exposing (Matrix, Vector, Complex)
import Complex as C
import Array
import Native.CostlyLinear



r =  Array.fromList [  Array.fromList [C.fromReal 1, C.fromReal 2, C.fromReal 5], Array.fromList [C.fromReal 3, C.fromReal 5, C.fromReal (-1)], Array.fromList [C.fromReal 7, C.fromReal (-3), C.fromReal 5]]
--toFloat((Array.Extra.getUnsafe 0 (Array.fromList l)).re)
--l = Native.CostlyLinear.eigens r



eigen : Matrix (Complex) -> {values: Vector Complex, cols: Matrix Complex}
eigen m = 
      let
        anyC = List.all (\x -> x == True) (Array.toList (Array.map (\x -> List.all (\x -> x== True) (Array.toList (Array.map (C.isReal) x))) m ))
      in
        if not anyC then eigen3 m else eigen2 (Array.map (\x -> Array.map (C.real) x) m)
        
        
        

eigen3 : Matrix (Complex) -> {values: Vector Complex, cols: Matrix Complex}
eigen3 m = 
  let
    x = Native.CostlyLinear.eigens (Array.toList (Array.map (Array.toList) m))
  in
    {values = Array.fromList x.values, cols = Array.fromList (List.map (Array.fromList) x.cols)}
eigen2 : Matrix (Float) -> {values: Vector Complex, cols: Matrix Complex}
eigen2 m = 
  let
    x = Native.CostlyLinear.eigens2 (Array.toList (Array.map (Array.toList) m))
  in
    {values = Array.fromList x.values, cols = (Array.fromList (List.map (Array.fromList) x.vectors))} --may need to transpose??

eigen4 m = 
   let
    x = Native.CostlyLinear.eigens2 (Array.toList (Array.map (Array.toList) m))
  in
    x
  
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

testInverse : Matrix (Complex) -> Matrix (Complex) -> Bool
testInverse m ci = 1 == (Native.CostlyLinear.test_inverse (Array.toList (Array.map (Array.toList) m)) (Array.toList (Array.map (Array.toList) ci)))
               
                 


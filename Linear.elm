module Linear where 
import Expression exposing (Matrix, Vector, Exp)
import Array exposing (Array)
import Complex
import Debug


dimV : Vector a -> Int
dimV m = Array.length m


--row by cols
dimM : Matrix a -> (Int, Int)
dimM m =
  let 
    rows = Array.length m
    fstcol = Array.get 0 m
  in
    case fstcol of
      Just x -> (rows, Array.length x)
      Nothing -> (0,0)
      

--not used in det...
square : Matrix a -> Bool
square m = 
  case (dimM m) of
    (0,0) -> False
    (a,b) -> a == b

--https://en.wikipedia.org/wiki/Crout_matrix_decomposition
--ludecomp : Matrix -> (Matrix, Matrix, Matrix)
-- array indexed map, array indexed filter 

unsafeGet :  Int -> Array a -> a
unsafeGet i a  = 
  case (Array.get i a) of 
    Just x -> x
    _ -> Debug.crash "index out of range"

unsafeGetM : Int -> Int -> Matrix a -> a
unsafeGetM row col m = (unsafeGet col (unsafeGet row m))


--returns the minor and the member of the top row at x
minor : Int  -> Matrix a  -> (a, Float, Matrix a)
minor x m  = 
  let
    (rows, cols) = dimM m
    top = unsafeGetM 0 x m
    minusTop = Array.slice 1 (rows) m --I'm not sure how efficient slice is or really anything about this library
    minusx = Array.map (\m -> Array.append (Array.slice 0 x m) (Array.slice (x+1) cols m)) minusTop
    sign = if (x % 2 == 0) then 1.0 else (-1.0)
  in
    (top, sign, minusx)
    
minors : Matrix a -> Array (a, Float, Matrix a) 
minors m =
  Array.indexedMap (\a throw -> minor a m) m


-- in progress, but I thought I'd commit..
simpleDet : Matrix (Expression.Complex) -> Expression.Complex
simpleDet m = 
  let 
    (rows, cols) = (dimM m)
  in
    if rows == 0 || (rows /= cols) then Debug.crash "We are going to wrap this to make this test...."
    else if (rows == 2) then 
           let
             a = unsafeGetM 0 0 m
             b = unsafeGetM 0 1 m 
             c = unsafeGetM 1 0 m
             d = unsafeGetM 1 1 m 
           in
             (a `Complex.mult` d `Complex.sub` b `Complex.mult` c)
         else
           Array.foldr (\(p, sgn, sub) start -> start `Complex.add` (Complex.fromReal sgn) `Complex.mult` p `Complex.mult` (simpleDet sub)) (Complex.fromReal 0) (minors m)
           


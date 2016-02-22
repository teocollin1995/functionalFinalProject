module Linear where 
import Expression exposing (Matrix, Vector, Exp)
import Array exposing (Array)
import Complex
import Debug
import List
import List.Extra as ListE
import Array.Extra as ArrayE

--Todo:
--Clean up code
--generalize for expressions -> most helpers are fully general -> det is in complex only -> most higher level things are in float
--I've decided to rethink how to generalize anythign to make the code less clunky -> we really only need add, mult, negate, div, zero, and one so a data type could be made out of it
--write tests
--https://en.wikipedia.org/wiki/Crout_matrix_decomposition
--crout : Matrix Float -> (Matrix Float, Matrix Float, Matrix Float) lower,upper,permutation
--fix Array.slice    
--replace with Array.extra 
--col stuff
--diganolization
--eigen
  



--helpers
unsafeGet :  Int -> Array a -> a
unsafeGet i a  = 
  case (Array.get i a) of 
    Just x -> x
    _ -> Debug.crash "index out of range"

arraymap2 : (a -> b -> c) -> Array a -> Array b -> Array c
arraymap2 = ArrayE.map2


--generators

vector : Int -> (Int -> a) -> Vector a 
vector n f = Array.initialize n f
--f takes row then col coordinate
matrix : Int -> Int -> (Int -> Int -> a) -> Matrix a
matrix rows cols f = 
  Array.initialize rows (\row -> vector cols (f row))


rowVector : Vector a -> Matrix a 
rowVector = Array.repeat 1 

colVector : Vector a -> Matrix a 
colVector v =  Array.map (Array.repeat 1) v


--mapping
mapRow : (Vector a -> Vector b) -> Matrix a -> Matrix b
mapRow f m = Array.map f m

--uses transpose so best to avoid
mapCol : (Vector a -> Vector b) -> Matrix a -> Matrix b
mapCol f m = transpose (mapRow f (transpose m))


indexedMapRow : (Int -> Vector a -> Vector b) -> Matrix a -> Matrix b
indexedMapRow f m = Array.indexedMap f m

--uses tranpose so best to avoid
indexedMapCol : (Int -> Vector b -> Vector c) -> Matrix b -> Matrix c
indexedMapCol f m = transpose (indexedMapRow f (transpose m))


map : (a -> b) -> Matrix a -> Matrix b
map f m = Array.map (Array.map f) m


indexedMap : (Int -> Int -> a -> b) -> Matrix a -> Matrix b
indexedMap f m = Array.indexedMap (\r -> Array.indexedMap (\c v -> f r c v) ) m

--definining triangular as 
isTriangular : b -> Matrix b -> Bool
isTriangular zero m1 = 
  let
    tester1 = \row col v -> if row == col then v /= zero else if row > col then v == zero else  True
  in
    if (List.all (\x -> x) (toList (indexedMap tester1 m1 ))) then True
    else
      let
        tester2 = \row col v -> if row == col then v /= zero else if row < col then v == zero else True
      in
        (List.all (\x -> x) (toList (indexedMap tester2 m1 )))



vectorFromList : (List a) -> Vector a
vectorFromList = Array.fromList


taker : Int -> List a -> List (List a)
taker x ls =  case ls of 
                [] -> []
                _ -> (List.take x ls) :: (taker x (List.drop x ls))


fromList : (List a) -> Int -> Int -> Matrix a
fromList xs rows cols = 
  if (List.length xs) == rows*cols then Debug.crash "fromList"
  else fromLists (taker cols xs)

fromLists : (List (List a)) -> Matrix a 
fromLists xs = Array.fromList (List.map (Array.fromList) xs)        


toList : Matrix a -> (List a)
toList xs = Array.foldr (List.append) [] (Array.map (Array.toList ) xs)

toLists : Matrix a -> (List (List a))
toLists xs = Array.toList (Array.map (Array.toList ) xs)

toVector : Matrix a -> Vector a
toVector xs = Array.foldr (Array.append) Array.empty xs



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


nrows : Matrix a -> Int
nrows = Array.length
ncols : Matrix a -> Int
ncols m = snd (dimM m)     

--not used in det...
isSquare : Matrix a -> Bool
isSquare m = 
  case (dimM m) of
    (0,0) -> False
    (a,b) -> a == b





unsafeGetM : Int -> Int -> Matrix a -> a
unsafeGetM row col m = (unsafeGet col (unsafeGet row m))

unsafeGetRow : Int -> Matrix a -> Vector a
unsafeGetRow row m =  (unsafeGet row m)

unsafeGetCol : Int -> Matrix a -> Vector a 
unsafeGetCol col m = Array.map (\r -> unsafeGetM r col m) (Array.fromList [0..((fst (dimM m)) - 1)])
--columns
unsafeGetDiag : Matrix a -> Vector a
unsafeGetDiag m = 
  let 
    (rows, cols) = dimM m
    dim = min rows cols 
  in
    vector dim (\i -> unsafeGetM i i m)
  
  

setRow : Int -> Vector a -> Matrix a -> Matrix a 
setRow row newrow m = Array.set row newrow m


setCol : Int -> Vector a -> Matrix a -> Matrix a 
setCol col newCol m = indexedMap (\r ccol ret -> if ccol == col then (ArrayE.getUnsafe r newCol) else ret ) m

set : Int -> Int -> a -> Matrix a -> Matrix a
set row col rep m = 
  let 
    (rows,cols) = dimM m
    mTargetRow = Array.get row m
  in
    case mTargetRow of 
      Nothing -> m
      Just targetRow -> if cols <= col then m 
                        else setRow row (Array.set col rep targetRow) m

vectorSwap : Int -> Int -> Vector a -> Vector a
vectorSwap i j v = 
  let
    ith = ArrayE.getUnsafe i v
    jth = ArrayE.getUnsafe j v
  in
    Array.set i jth (Array.set j ith v)

columnSwap : Int -> Int -> Matrix a -> Matrix a
columnSwap i j m = Array.map (vectorSwap i j) m

--lazyness, of course
rowSwap : Int -> Int -> Matrix b -> Matrix b
rowSwap i j m = vectorSwap i j m

      

transpose : Matrix a -> Matrix a
transpose m = 
  let 
    (rows,cols) = dimM m
  in
    matrix cols rows (\r c -> unsafeGetM c r m)

--amount to extend by
extendRows : Int -> a -> Matrix a -> Matrix a
extendRows i a m = Array.map (\v -> Array.append v (Array.repeat i a)) m

extendCols : Int -> a -> Matrix a -> Matrix a 
extendCols i a m = 
  let
    rows = nrows m
    extension = same i rows a
  in
    verticalJoin m extension

extendMatrix : Int -> Int -> a -> Matrix a -> Matrix a  
extendMatrix rows cols a m = extendCols cols a (extendRows rows a m)

extendRowsTo : Int -> a -> Matrix a -> Matrix a 
extendRowsTo i a m = 
  let
    cols = ncols m
  in
    if i <= cols then m 
    else extendRows (i-cols) a m

extendColsTo : Int -> a -> Matrix a -> Matrix a 
extendColsTo i a m =
  let 
    rows = nrows m
  in
    if i <= rows then m 
    else
      extendCols (i-rows) a m 


extendTo : Int -> Int -> a -> Matrix a -> Matrix a 
extendTo rows cols a m = extendColsTo cols a (extendRowsTo rows a m)

       
  


same : Int -> Int -> a -> Matrix a
same row col s = 
  Array.repeat row (Array.repeat col s)


identity : Int -> a -> a -> Matrix a
identity n zero one = matrix n n (\x y -> if x == y then one else zero)

isIdentity : a -> a -> Matrix a -> Bool
isIdentity zero one m =
  let
    (rows,cols) = dimM m
  in
    if rows /= cols then False 
    else
      m == (identity rows zero one)

permMatrix : Int -> Int -> Int -> a -> a -> Matrix a
permMatrix size i j zero one = columnSwap i j (identity size zero one)

allpermutationMatricies : Int -> a -> a -> List (Matrix a)
allpermutationMatricies size zero one = 
  let 
    xs = [0..(size-1)]
    perms = ListE.permutations xs
    switches = List.map (List.map2 (,) xs) perms
    id = identity size zero one
    setFromid = \(i,j) m -> setCol j (unsafeGetCol i id) m
    --makeSwap = \(i,j) m -> columnSwap i j m 
    makeAllSwaps = List.foldr (setFromid) id 
  in
    List.map makeAllSwaps switches



--row, col
inBounds : Int -> Int -> Matrix a -> (Bool, (Int, Int))
inBounds row col m = 
  let
    (rows, cols) = dimM m
  in
    ((row <= rows || col <= cols), (rows, cols))

--start row, end row, start col, end col
submatrix : Int -> Int -> Int -> Int -> Matrix a -> Matrix a
submatrix sr er sc ec m = 
  if List.any (\x -> x < 0) [sr,er,sc,ec] then Debug.crash "submatrix 1 "
  else if sr > er || sc > ec then Debug.crash "submatrix 2"
  else if not (fst (inBounds er ec m)) then Debug.crash "submatrix 3"
  else 
    Array.slice sr er (Array.map (Array.slice sc ec) m)

horizontalSplit : Int -> Matrix a -> (Matrix a, Matrix a) 
horizontalSplit i m = 
  if i < 0 then Debug.crash "horizontalSplit"
  else let
    (rows, cols) = dimM m
 in
   if rows < i then Debug.crash "horizontalSplit"
   else
     (submatrix 0 rows 0 i m , submatrix 0 rows i cols m)

splitBlocks : Int -> Int -> Matrix a -> (Matrix a, Matrix a, Matrix a, Matrix a) --row, col, matrix, (tl,tr,bl,br)
splitBlocks row col m = 
  let
    (rows, cols) = dimM m
    tl = submatrix 0 row 0 col m
    bl = submatrix row rows 0 col m
    tr = submatrix 0 row col cols m 
    br = submatrix row rows col cols m
  in
    (tl,tr,bl,br)


--needs to check if the number cols is the same...
verticalJoin : Matrix a -> Matrix a -> Matrix a 
verticalJoin = Array.append

horizontalJoin : Matrix a -> Matrix a -> Matrix a 
horizontalJoin m1 m2 = 
  let 
    rows1 = nrows m1
    rows2 = nrows m2
  in
    if rows1 /= rows2 then Debug.crash "horizontalJoin"
    else
      let
        m1appenders = (Array.map Array.append m1)
      in
        Array.indexedMap (\i f -> f (unsafeGetRow i m2)) m1appenders



elementWise : (a -> b -> c) -> Matrix a -> Matrix b -> Matrix c 
elementWise f m1 m2 = ArrayE.map2 (\a b -> ArrayE.map2 f a b) m1 m2

scaleMatrix : a -> (a -> a -> a) -> Matrix a -> Matrix a
scaleMatrix scalar mult m = map (mult scalar) m

scaleVector : a -> (a -> a -> a) -> Vector a -> Vector a
scaleVector scalar mult m = Array.map (mult scalar) m
--Array.map2

    
addToVector : a -> (a -> a -> a) -> Vector a -> Vector a
addToVector a add v = Array.map (add a) v

addVector : (a -> a -> a) -> Vector a -> Vector a -> Vector a
addVector add = arraymap2 add 

scaleRow : Int -> a -> (a -> a -> a) -> Matrix a -> Matrix a
scaleRow i scalar mult m = indexedMapRow (\r v -> if r==i then scaleVector scalar mult v else v  ) m
--add checking for outofbounds...
combineRow : a -> (a -> a -> a) -> (a -> a -> a) -> Int -> Int -> Matrix a -> Matrix a 
combineRow scalar mult add target origin m = setRow target (addVector add (unsafeGetRow target m) (Array.map (mult scalar) (unsafeGetRow origin m))) m

switchRow : Int -> Int -> Matrix a -> Matrix a 
switchRow row1 row2 m = 
  let
    r1 = unsafeGetRow row1 m
    r2 = unsafeGetRow row2 m 
  in
    setRow row2 r1 (setRow row1 r2 m)

--switchCols: Probably not needed... we will stick to row operations 

invert : Matrix Float -> Maybe (Matrix Float)
invert m1 = 
  let
    (rows, cols) = dimM m1
  in
    if rows /= cols then Nothing
    else
      let
        id = identity rows 0 1
        newmatrix = horizontalJoin m1 id
        reduced = rowReduce newmatrix
        blocks = horizontalSplit rows reduced
      in
        if (isIdentity 0 1 (fst blocks)) then Just (snd blocks) else Nothing

invertable : Matrix Float -> Bool
invertable m1 = case (invert m1) of 
                  Nothing -> False
                  _ -> True


rowReduce : Matrix Float -> Matrix Float
rowReduce m1 = gaussianEliminationBackwards (gaussianEliminationForward m1)


--naming inconsistnecy! 
gaussianEliminationForward : Matrix Float -> Matrix Float
gaussianEliminationForward m =
  let
    (rows, cols) = dimM m
    elims = (min rows cols) - 1
  in
    gaussianEliminationHelper' 0 elims m

gaussianEliminationBackwards : Matrix Float -> Matrix Float
gaussianEliminationBackwards m = 
  let
    (rows, cols) = dimM m
    elims = (min rows cols) - 1
  in
    gaussianEliminationHelperBackwards' elims m

gaussianEliminationHelperBackwards' : Int -> Matrix Float -> Matrix Float
gaussianEliminationHelperBackwards' row m =
  if row < 0 then m else gaussianEliminationHelperBackwards' (row - 1) (gaussianEliminationHelperBackwards row m)

gaussianEliminationHelper' : Int -> Int -> Matrix Float -> Matrix Float
gaussianEliminationHelper' row max m = -- should just be foldr
  if row > max then m else gaussianEliminationHelper' (row + 1 ) max (gaussianEliminationHelper row m)

gaussianEliminationHelper : Int -> Matrix Float -> Matrix Float
gaussianEliminationHelper row m = 
  let
    (rows, cols) = dimM m
    currow = unsafeGetRow row m
    pivot = ArrayE.getUnsafe row currow 
    pivotedMatrix = if pivot /= 0.0 then Just m 
                    else let
                      colbelow = Array.slice (row + 1) (rows + 1) (ArrayE.map2 (,) (Array.fromList [0..rows]) (unsafeGetCol row m))
                      firstNonzero = Array.slice 0 1 (Array.filter (\x -> (snd x) /= 0) colbelow )
                   in
                     if Array.length firstNonzero == 0 then Nothing
                     else 
                       let
                         (x,y) = ArrayE.getUnsafe 0 firstNonzero
                       in Just (switchRow x row m)
                       
  in
    case pivotedMatrix of 
      Nothing -> m
      Just m -> let
        onePivotedMatrix = scaleRow row (1/pivot) (*) m --maybe I should clean this line up?
        targets = (Array.filter (\x -> (snd x) /= 0) (Array.slice (row+1) (rows+1) (ArrayE.map2 (,) (Array.fromList [0..rows]) (unsafeGetCol row onePivotedMatrix))))
     in
        (Array.foldr (\ (x,y) m ->  combineRow (0 - y) (*) (+) x row m ) onePivotedMatrix targets)
                   
        
gaussianEliminationHelperBackwards : Int -> Matrix Float -> Matrix Float
gaussianEliminationHelperBackwards row m = 
  let
    (rows, cols) = dimM m
    currow = unsafeGetRow row m
    pivot = ArrayE.getUnsafe row currow 
    pivotedMatrix = if pivot /= 0.0 then Just m 
                    else let
                      colabove = Array.slice (0) (rows - 1) (ArrayE.map2 (,) (Array.fromList [0..rows]) (unsafeGetCol row m))
                      firstNonzero = Array.slice 0 1 (Array.filter (\x -> (snd x) /= 0) colabove )
                   in
                     if Array.length firstNonzero == 0 then Nothing
                     else 
                       let
                         (x,y) = ArrayE.getUnsafe 0 firstNonzero
                       in Just (switchRow x row m)
                       
  in
    case pivotedMatrix of 
      Nothing -> m
      Just m -> let
        onePivotedMatrix = scaleRow row (1/pivot) (*) m --maybe I should clean this line below up?
        targets = (Array.filter (\x -> (snd x) /= 0 && (fst x) /= row) (Array.slice (0) (rows - 1) (ArrayE.map2 (,) (Array.fromList [0..rows]) (unsafeGetCol row onePivotedMatrix))))
     in
        (Array.foldr (\ (x,y) m ->  combineRow (0 - y) (*) (+) x row m ) onePivotedMatrix targets)
        
                      
                      
             


trace : a -> (a -> a -> a) -> Matrix a -> a
trace zero add m = Array.foldr add zero (unsafeGetDiag m)

diagProd : a -> (a -> a -> a) -> Matrix a -> a
diagProd one mult m = Array.foldr mult one (unsafeGetDiag m)

--returns the minor and the member of the top row at x and the sign
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

-- O(n!) so really bad...
-- in progress, but I thought I'd commit..
-- rephrase in more general terms i.e with add/mult.zero 


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
           



--basic operations
--doprod vector vector mult add a
dotProd : Vector a -> Vector a -> (a -> a -> a) -> (a -> a -> a) -> a -> a
dotProd v1 v2 mult add zero = 
  let 
    vlength = Array.length v1 
  in
  if vlength == 0 then Debug.crash "Crash in Dotproduct" 
  else if vlength /= Array.length v2 then Debug.crash "Crash in Dotproduct"
  else
    let
      mults = (List.map2 mult (Array.toList v1) (Array.toList v2))
    in
      List.foldr (add) zero mults
    


matrixMult : Matrix a -> Matrix a -> (a -> a -> a) -> (a -> a -> a) -> a -> Matrix a
matrixMult m1 m2 mult add zero = 
  let 
    m1d = dimM m1
    m2d = dimM m2
  in
    if (snd m1d) /= (fst m2d) then Debug.crash "matrix mult" 
    else
      let
        
        rowsofm1 = Array.indexedMap unsafeGetRow (Array.repeat (fst m1d) m1)
        cols = snd m2d
        colsofm2 = Array.map (\f -> f m2) (Array.map unsafeGetCol (Array.fromList [0..(cols - 1)]))
        localDotProd = \v1 v2 -> dotProd v1 v2 mult add zero
      in
        Array.map (\x -> Array.map x colsofm2) (Array.map localDotProd rowsofm1 )
    


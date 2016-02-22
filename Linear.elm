module Linear where 
import Expression exposing (Matrix, Vector, Exp)
import Array exposing (Array)
import Complex
import Debug
import List
import List.Extra as ListE
import Array.Extra as ArrayE


type alias Space a = {zero: a, one: a, add: a -> a -> a, mult: a -> a -> a, sub: a -> a -> a, div: a -> a -> a , fromReal : Float -> a}

complexSpace : Space Expression.Complex
complexSpace = {zero= Complex.one, one= Complex.zero, add= Complex.add, mult= Complex.mult, sub= Complex.sub, div= Complex.div, fromReal = Complex.fromReal}

--Todo:
--Clean up code
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
unsafeGet i a  = ArrayE.getUnsafe i a

arraymap2 : (a -> b -> c) -> Array a -> Array b -> Array c
arraymap2 = ArrayE.map2


taker : Int -> List a -> List (List a)
taker x ls =  case ls of 
                [] -> []
                _ -> (List.take x ls) :: (taker x (List.drop x ls))
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


isTriangular : Space b -> Matrix b -> Bool
isTriangular space m1 = 
  let
    zero = space.zero
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


identity : Space a -> Int ->  Matrix a
identity space n = 
  let
    zero = space.zero
    one = space.one 
  in
    matrix n n (\x y -> if x == y then one else zero)

isIdentity : Space a-> Matrix a -> Bool
isIdentity space m =
  let
    (rows,cols) = dimM m
  in
    if rows /= cols then False 
    else
      m == (identity space rows )

permMatrix : Space a -> Int -> Int -> Int -> Matrix a
permMatrix space size i j = columnSwap i j (identity space size )

allpermutationMatricies :Space a -> Int -> a -> a -> List (Matrix a)
allpermutationMatricies space size zero one = 
  let 
    xs = [0..(size-1)]
    perms = ListE.permutations xs
    switches = List.map (List.map2 (,) xs) perms
    id = identity space size 
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


---vertical split

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

scaleMatrix : Space a -> a -> Matrix a -> Matrix a
scaleMatrix space scalar m = map (space.mult scalar) m

scaleVector : Space a -> a -> Vector a -> Vector a
scaleVector space scalar m = Array.map (space.mult scalar) m
--Array.map2

    
addToVector : Space a -> a -> Vector a -> Vector a
addToVector space a v = Array.map (space.add a) v

addVector : Space a -> Vector a -> Vector a -> Vector a
addVector space = ArrayE.map2 space.add 

scaleRow : Space a -> Int -> a  -> Matrix a -> Matrix a
scaleRow space i scalar m = indexedMapRow (\r v -> if r==i then scaleVector space scalar v else v  ) m


--add checking for outofbounds...
combineRow : Space a -> a -> Int -> Int -> Matrix a -> Matrix a 
combineRow space scalar target origin m = 
  let
    add = space.add
    mult = space.mult
  in
    setRow target (addVector space (unsafeGetRow target m) (Array.map (mult scalar) (unsafeGetRow origin m))) m

switchRow : Int -> Int -> Matrix a -> Matrix a 
switchRow row1 row2 m = 
  let
    r1 = unsafeGetRow row1 m
    r2 = unsafeGetRow row2 m 
  in
    setRow row2 r1 (setRow row1 r2 m)

--switchCols: Probably not needed... we will stick to row operations 

invert : Space a -> Matrix a -> Maybe (Matrix a)
invert space m1 = 
  let
    (rows, cols) = dimM m1
  in
    if rows /= cols then Nothing
    else
      let
        id = identity space rows
        newmatrix = horizontalJoin m1 id
        reduced = rowReduce space newmatrix
        blocks = horizontalSplit rows reduced
      in
        if (isIdentity space (fst blocks)) then Just (snd blocks) else Nothing

invertable : Space a -> Matrix a -> Bool
invertable space m1 = case (invert space m1) of 
                  Nothing -> False
                  _ -> True


rowReduce : Space a ->  Matrix a -> Matrix a
rowReduce space m1 = gaussianEliminationBackwards space (gaussianEliminationForward space m1)


--naming inconsistnecy! 
gaussianEliminationForward : Space a -> Matrix a -> Matrix a
gaussianEliminationForward space m =
  let
    (rows, cols) = dimM m
    elims = (min rows cols) - 1
  in
    gaussianEliminationHelper' space 0 elims m

gaussianEliminationBackwards : Space a -> Matrix a -> Matrix a
gaussianEliminationBackwards space m = 
  let
    (rows, cols) = dimM m
    elims = (min rows cols) - 1
  in
    gaussianEliminationHelperBackwards' space elims m

gaussianEliminationHelperBackwards' : Space a -> Int -> Matrix a -> Matrix a
gaussianEliminationHelperBackwards' space row m =
  if row < 0 then m else gaussianEliminationHelperBackwards' space (row - 1) (gaussianEliminationHelperBackwards space row m)

gaussianEliminationHelper' : Space a -> Int -> Int -> Matrix a -> Matrix a
gaussianEliminationHelper' space row max m = -- should just be foldr
  if row > max then m else gaussianEliminationHelper' space (row + 1 ) max (gaussianEliminationHelper space row m)

gaussianEliminationHelper : Space a -> Int -> Matrix a -> Matrix a
gaussianEliminationHelper space row m = 
  let
    zero = space.zero
    div = space.div
    one = space.one
    recip = space.div space.one
    sub = space.sub
    neg = space.sub space.zero
    (rows, cols) = dimM m
    currow = unsafeGetRow row m
    pivot = ArrayE.getUnsafe row currow 
    pivotedMatrix = if pivot /= zero then Just m 
                    else let
                      colbelow = Array.slice (row + 1) (rows + 1) (ArrayE.map2 (,) (Array.fromList [0..rows]) (unsafeGetCol row m))
                      firstNonzero = Array.slice 0 1 (Array.filter (\x -> (snd x) /= zero) colbelow )
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
        onePivotedMatrix = scaleRow space row (recip pivot) m --maybe I should clean this line up?
        targets = (Array.filter (\x -> (snd x) /= zero) (Array.slice (row+1) (rows+1) (ArrayE.map2 (,) (Array.fromList [0..rows]) (unsafeGetCol row onePivotedMatrix))))
     in
        (Array.foldr (\ (x,y) m ->  combineRow space (neg y) x row m ) onePivotedMatrix targets)
                   
        
gaussianEliminationHelperBackwards : Space a -> Int -> Matrix a -> Matrix a
gaussianEliminationHelperBackwards space row m = 
  let
    zero = space.zero
    div = space.div
    one = space.one
    recip = space.div space.one
    sub = space.sub
    neg = space.sub space.zero
    (rows, cols) = dimM m
    currow = unsafeGetRow row m
    pivot = ArrayE.getUnsafe row currow 
    pivotedMatrix = if pivot /= zero then Just m 
                    else let
                      colabove = Array.slice (0) (rows - 1) (ArrayE.map2 (,) (Array.fromList [0..rows]) (unsafeGetCol row m))
                      firstNonzero = Array.slice 0 1 (Array.filter (\x -> (snd x) /= zero) colabove )
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
        onePivotedMatrix = scaleRow space row (recip pivot) m --maybe I should clean this line below up?
        targets = (Array.filter (\x -> (snd x) /= zero && (fst x) /= row) (Array.slice (0) (rows - 1) (ArrayE.map2 (,) (Array.fromList [0..rows]) (unsafeGetCol row onePivotedMatrix))))
     in
        (Array.foldr (\ (x,y) m ->  combineRow space (neg y) x row m ) onePivotedMatrix targets)
        
                      
                      
             


trace : Space a -> Matrix a -> a
trace space m = Array.foldr space.add space.zero (unsafeGetDiag m)

diagProd : Space a -> Matrix a -> a
diagProd space m = Array.foldr space.mult space.one (unsafeGetDiag m)

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


simpleDet : Space a -> Matrix a -> a
simpleDet space m = 
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
             (space.sub (space.mult a d) (space.mult b c))
         else
           let
             folder = ( \ (p, sgn, sub) start -> space.add start (space.mult (space.fromReal sgn) (space.mult p (simpleDet space sub))))
           in
             Array.foldr folder (space.fromReal 0) (minors m)
           



--basic operations
--doprod vector vector mult add a
dotProd : Space a -> Vector a -> Vector a -> a
dotProd space v1 v2  = 
  let 
    vlength = Array.length v1 
    mult = space.mult
    add = space.add
    zero = space.zero
    one = space.one
  in
  if vlength == 0 then Debug.crash "Crash in Dotproduct" 
  else if vlength /= Array.length v2 then Debug.crash "Crash in Dotproduct"
  else
    let
      mults = (List.map2 mult (Array.toList v1) (Array.toList v2))
    in
      List.foldr (add) zero mults
    


matrixMult : Space a -> Matrix a -> Matrix a -> Matrix a
matrixMult space m1 m2 = 
  let 
    m1d = dimM m1
    m2d = dimM m2
    mult = space.mult
    add = space.add
    zero = space.zero
    one = space.one
  in
    if (snd m1d) /= (fst m2d) then Debug.crash "matrix mult" 
    else
      let
        
        rowsofm1 = Array.indexedMap unsafeGetRow (Array.repeat (fst m1d) m1)
        cols = snd m2d
        colsofm2 = Array.map (\f -> f m2) (Array.map unsafeGetCol (Array.fromList [0..(cols - 1)]))
        localDotProd = \v1 v2 -> dotProd space v1 v2 
      in
        Array.map (\x -> Array.map x colsofm2) (Array.map localDotProd rowsofm1 )
    


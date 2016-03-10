module Linear 
  (Space, complexSpace,Specialization, specalize, complex,
  vector, matrix, rowVector, colVector,
  dimV, nrows, ncols,
  same, identity, isIdentity, permMatrix, allPermutationMatricies, isTriangular, isSquare,
  vectorFromList, fromList, fromLists, toList, toLists, toVector,
  unsafeGetM, unsafeGetRow, unsafeGetCol, unsafeGetDiag,
  set, setRow, setCol,setDiag,
  map, indexedMap, mapVector, indexedMapVector,
  extendMatrix, extendMatrixTo,
  submatrix, splitBlocks, verticalJoin, horizontalJoin, minor, minors,
  transpose, scaleVector, scaleMatrix, scaleRow, combineRow, switchRow, rowReduce, gaussianEliminationForward, gaussianEliminationBackwards,
   elementWise, vectorMap2, dotProd,vectorNorm, normalizeVector, matrixMult,matrixPower,
    invert, invertable, trace, diagProd, simpleDet, simpleDet1,
    eigenValues, eigenVectors,diagonalization,eigen) where 

{-| The Linear module provides a variety of tools from Linear Algebra. Matrix and Vector are defined in expression, but tools for manipulating them (e.g. though maps, dot products, norms, row operations, determiants, eigen values, and what not) are stored here. 

In order to allow you to accomplish these operations in full generality, we have created a Space type where you define zero, one, addition, multiplication, subtraction, division, and from real. Once you supply this for a particular type, you can specalize all the functions that require any of these operations. Any function that did not require these operations can be used for any Matrix a or Vector a.

Most of everything should sort of work. The only parts that have no been subjected to some testing are extendMatrix throught horizontalJoin. Everything else should be at leat OKAY. With regard to the row reduction stuff, I will note that these could be improved in a few ways such as telling you when they can't do the full reduction and collecting the coefficents along the privots so that they can be used for more advanced determiant testing.

Note that for all functions take rows and cols, the rows are alwalys given first and then the cols. So for unsafeGetM : Int -> Int -> Matrix a -> a , the first argument is a row, the second is the column. 



# Space 
@docs Space, complexSpace, Specialization, specalize, complex

# Builders
@docs vector, matrix, rowVector, colVector

# Dimensions 
@docs dimV, nrows, ncols

# Special Matrices
@docs same, identity, isIdentity, permMatrix, allPermutationMatricies, isTriangular, isSquare

# List Conversions
@docs vectorFromList, fromList, fromLists, toList, toLists, toVector

# Accessing 
@docs unsafeGetM, unsafeGetRow, unsafeGetCol, unsafeGetDiag

# Setting
@docs set, setRow, setCol,setDiag

# Mapping
@docs map, indexedMap, mapVector, indexedMapVector

# Extensions
@docs extendMatrix, extendMatrixTo

# Submatricies and Blocks
@docs submatrix, splitBlocks, verticalJoin, horizontalJoin, minor, minors

# Single Matrix, Row Operations, and Single Vector Operations 
@docs transpose, scaleVector, scaleMatrix, scaleRow, combineRow, switchRow, rowReduce, gaussianEliminationForward, gaussianEliminationBackwards,vectorNorm, normalizeVector

# Operations on Two Matricies or Two Vectors
@docs elementWise, vectorMap2, dotProd,matrixMult, matrixPower

# Matrix properties
@docs  invert, invertable, trace, diagProd, simpleDet, simpleDet1

# Numerical Linear Algebra 
@docs eigenValues, eigenVectors,diagonalization,eigen
-}





import Expression exposing (Matrix, Vector, Exp)
import Array exposing (Array)
import Complex
import Debug
import List
import List.Extra as ListE
import Array.Extra as ArrayE
import CostlyLinear
import Native.CostlyLinear

{-| A mechanism for specificying the context of various operations. Basically, I want to be able to use my rowReduce function for real and complex numbers. So, I write a real and complex space and supply the real one to rowReduce when I'm using real numbers and the complex one to rowReduce when using complex numbers. The specalize function (TBW) gives a record containing all functions like rowReduce for a given space.

-}
type alias Space a = 
  { zero: a,
    one: a,
    add: a -> a -> a,
    mult: a -> a -> a,
    sub: a -> a -> a,
    div: a -> a -> a,
    fromReal : Float -> a,
    abs: a-> Float
  }


{-| A record type produced by the specalize function that contains all the functions that require the space argument prefixed with the space a. So, if you wanted the identity function for the real numbers you might use (specalize realSpace).identity instead of identity realSpace.

-}

type alias Specialization a = 
  { identity : Int -> Matrix a,
    isIdentity : Matrix a -> Bool,
    permMatrix :  Int -> Int -> Int -> Matrix a,
    allPermutationMatricies : Int -> List (Matrix a),
    isTriangular : Matrix a -> Bool,
    scaleVector : a -> Vector a -> Vector a,
    scaleMatrix : a -> Matrix a -> Matrix a,
    scaleRow : Int -> a -> Matrix a -> Matrix a ,
    combineRow : a -> Int -> Int -> Matrix a -> Matrix a,
    rowReduce : Matrix a -> Matrix a,
    gaussianEliminationForward : Matrix a -> Matrix a,
    gaussianEliminationBackwards : Matrix a -> Matrix a,
    dotProd : Vector a -> Vector a -> a ,
    vectorNorm : Vector a -> Float,
    normalizeVector : Vector a -> Vector a,
    matrixMult : Matrix a -> Matrix a -> Matrix a,
    invert : Matrix a -> Maybe (Matrix a),
    invertable : Matrix a -> Bool,
    trace : Matrix a -> a,
    diagProd : Matrix a -> a,
    simpleDet : Matrix a -> a
  }

{-| Produces a specalization for a space as detailed above.

-}
specalize : Space a -> Specialization a 
specalize s = 
    { identity = identity s,
      isIdentity = isIdentity s,
      permMatrix =  permMatrix s,
      allPermutationMatricies  = allPermutationMatricies  s,
      isTriangular = isTriangular s,
      scaleVector = scaleVector s,
      scaleMatrix = scaleMatrix s,
      scaleRow = scaleRow s, 
      combineRow = combineRow s,
      rowReduce = rowReduce s,
      gaussianEliminationForward = gaussianEliminationForward s,
      gaussianEliminationBackwards = gaussianEliminationBackwards s,
      dotProd = dotProd s,
      vectorNorm = vectorNorm s,
      normalizeVector = normalizeVector s,
      matrixMult = matrixMult s,
      invert = invert s,
      invertable = invertable s,
      trace = trace s,
      diagProd = diagProd s,
      simpleDet = simpleDet s
  }

{-| The Complex Specalization

-}
complex : Specialization Expression.Complex
complex = specalize complexSpace

{-| An example of a space
-}
complexSpace : Space Expression.Complex
complexSpace = {zero= Complex.zero, one= Complex.one, add= Complex.add, mult= Complex.mult, sub= Complex.sub, div= Complex.div, fromReal = Complex.fromReal, abs= Complex.abs}


{-| Generates a vector of length n from a function that takes an index and generates a member of the vector:

    vector 2 (\x -> x) = Vector (0 1 2)

-}
vector : Int -> (Int -> a) -> Vector a 
vector n f = Array.initialize n f
{-| Generates a matrix. For example, if you wanted to generate a 2 by 3 matrix where each member was the sum of the indicies:
                                 (0 1 2)
    matrix 2 3 (\x y -> x + y) = (1 2 3)

-}
matrix : Int -> Int -> (Int -> Int -> a) -> Matrix a
matrix rows cols f = 
  Array.initialize rows (\row -> vector cols (f row))

{-| Generates a matrix that is just a row vector.

-}
rowVector : Vector a -> Matrix a 
rowVector = Array.repeat 1 

{-| Generates a matrix that is just a column vector.

-}
colVector : Vector a -> Matrix a 
colVector v =  Array.map (Array.repeat 1) v





{-| Length of a vector

-}
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

{-| What it says on the tin

-}

nrows : Matrix a -> Int
nrows = Array.length


{-| What it says on the tin

-}

ncols : Matrix a -> Int
ncols m = snd (dimM m)     



{-| Generates a row by col matrix of one member of type a.


-}

same : Int -> Int -> a -> Matrix a
same row col s = 
  Array.repeat row (Array.repeat col s)


{-| Generates an n by n matrix that is the identity matrix for the Space a.

-}

identity : Space a -> Int ->  Matrix a
identity space n = 
  let
    zero = space.zero
    one = space.one 
  in
    matrix n n (\x y -> if x == y then one else zero)
{-| Tests if a matrix is an identity matrix for a particular space.
-}
isIdentity : Space a-> Matrix a -> Bool
isIdentity space m =
  let
    (rows,cols) = dimM m
  in
    if rows /= cols then False 
    else
      m == (identity space rows )--could be more efficient?


{-| Generates a permutation matrix for Space a by switching two columns of the identity matrix of a size. Takes the size then ith and jth columns.

-}
permMatrix : Space a -> Int -> Int -> Int -> Matrix a
permMatrix space size i j = columnSwap i j (identity space size )


{-| Generates all possible permutation matrices of a size nfor a Space a.

-}
allPermutationMatricies :Space a -> Int -> List (Matrix a)
allPermutationMatricies space size = 
  let
    zero = space.zero
    one = space.one 
    xs = [0..(size-1)]
    perms = ListE.permutations xs
    switches = List.map (List.map2 (,) xs) perms
    id = identity space size 
    setFromid = \(i,j) m -> setCol j (unsafeGetCol i id) m
    makeAllSwaps = List.foldr (setFromid) id 
  in
    List.map makeAllSwaps switches

{-| Tests if a matrix is triangular in a space a

-}
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

{-| Tests if any matrix is square.

-}

--not used in det...
isSquare : Matrix a -> Bool
isSquare m = 
  case (dimM m) of
    (0,0) -> False
    (a,b) -> a == b

{-| Generates a vector from a list.

-}
vectorFromList : (List a) -> Vector a
vectorFromList = Array.fromList


{-| Converts a vector to a List

-}

toListVector : Vector a -> List a
toListVector = Array.toList


{-| Generates a matrix of size rows*cols from a list. If rows*cols \= List.length xs then it crashes. 

                          (0 1 2)
                          (3 4 5)
    fromList [0..8] 3 3 = (6 7 8)


-}

fromList : (List a) -> Int -> Int -> Matrix a
fromList xs rows cols = 
  if (List.length xs) == rows*cols then Debug.crash "fromList"
  else fromLists (taker cols xs)


--implement invariant testing--need to maintain that
{-| Generats a matrix from a list of lists where each list is a row.

-}
fromLists : (List (List a)) -> Matrix a 
fromLists xs = Array.fromList (List.map (Array.fromList) xs)        
{-| Converts a list of lists to a matrix

-}

{-| Converts a matrix to a list


-}
toList : Matrix a -> (List a)
toList xs = Array.foldr (List.append) [] (Array.map (Array.toList ) xs)

{-| Converts a matrix to a list of lists where each list is a row.

-}

toLists : Matrix a -> (List (List a))
toLists xs = Array.toList (Array.map (Array.toList ) xs)

{-| Converts a matrix to a single vector containing all elements


-}

toVector : Matrix a -> Vector a
toVector xs = Array.foldr (Array.append) Array.empty xs






{-| Gets an element from a matrix and crashes if it is out of bounds. To get the 2nd element of the 1st row:
    
    unsafeGetM 1 2 m


-}

unsafeGetM : Int -> Int -> Matrix a -> a
unsafeGetM row col m = (unsafeGet col (unsafeGet row m))

{-| Gets a row.

-}

unsafeGetRow : Int -> Matrix a -> Vector a
unsafeGetRow row m =  (unsafeGet row m)

{-| Gets a column 

-}

unsafeGetCol : Int -> Matrix a -> Vector a 
unsafeGetCol col m = Array.map (\r -> unsafeGetM r col m) (Array.fromList [0..((fst (dimM m)) - 1)])

{-| Gets the diagonal of a matrix.

-}

unsafeGetDiag : Matrix a -> Vector a
unsafeGetDiag m = 
  let 
    (rows, cols) = dimM m
    dim = min rows cols 
  in
    vector dim (\i -> unsafeGetM i i m)
  



{-| Sets a value of one matrix cell. To set the 3rd value of the 2nd row:
    set 2 3 replacement matrix

-}
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
  
{-| Sets a row to the value of another vector


-}

setRow : Int -> Vector a -> Matrix a -> Matrix a 
setRow row newrow m = Array.set row newrow m
{-| Sets a column to the value of another vector


-}

setCol : Int -> Vector a -> Matrix a -> Matrix a 
setCol col newCol m = indexedMap (\r ccol ret -> if ccol == col then (ArrayE.getUnsafe r newCol) else ret ) m
{-| Sets the diagnoal of a matrix to a vector.

-}


setDiag : Vector a -> Matrix a -> Matrix a 
setDiag v m = indexedMap (\row col a -> if row == col then (ArrayE.getUnsafe row v) else a) m



--mapping
mapRow : (Vector a -> Vector b) -> Matrix a -> Matrix b
mapRow f m = Array.map f m

--uses transpose so best to avoid
mapCol : (Vector a -> Vector b) -> Matrix a -> Matrix b
mapCol f m = transpose (mapRow f (transpose m))

{-| A map function for a matrix

-}

map : (a -> b) -> Matrix a -> Matrix b
map f m = Array.map (Array.map f) m

{-| An indexed map function for a matrix. The mapping function take the current row and then the current column.

-}

indexedMap : (Int -> Int -> a -> b) -> Matrix a -> Matrix b
indexedMap f m = Array.indexedMap (\r -> Array.indexedMap (\c v -> f r c v) ) m

{-| What it says on the tin

-}
mapVector : (a -> b) -> Vector a -> Vector b
mapVector f v = Array.map f v

{-| What it says on the tin

-}
indexedMapVector : (Int -> a -> b) -> Vector a -> Vector b
indexedMapVector f v = Array.indexedMap f v

--who cares about these?

indexedMapRow : (Int -> Vector a -> Vector b) -> Matrix a -> Matrix b
indexedMapRow f m = Array.indexedMap f m

--uses tranpose so best to avoid
indexedMapCol : (Int -> Vector b -> Vector c) -> Matrix b -> Matrix c
indexedMapCol f m = transpose (indexedMapRow f (transpose m))


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

{-| Extends a matrix to new rows + old rows by new cols + old cols and fills the new elements with some member of the type a. To extend a matrix of 2 by 2 integers to 3 by 3 integers with 0s:

                                 (1 1 0)
                       (1 1)     (1 1 0)
    extendMatrix 1 1 0 (1 1) =   (0 0 0)



-}
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

{-| Like extendMatrix but the rows and columns specified are the new dimensions of the matrix (as opposed to adding row many rows and col many columns). The same example: 

                                   (1 1 0)
                         (1 1)     (1 1 0)
    extendMatrixTo 3 3 0 (1 1) =   (0 0 0)

-}

extendMatrixTo : Int -> Int -> a -> Matrix a -> Matrix a 
extendMatrixTo rows cols a m = extendColsTo cols a (extendRowsTo rows a m)


--start row, end row, start col, end col

{-| Selects a subMatrix. The integer arguments are start row, end row, start column, and end column.

-}
submatrix : Int -> Int -> Int -> Int -> Matrix a -> Matrix a
submatrix sr er sc ec m = 
  if List.any (\x -> x < 0) [sr,er,sc,ec] then Debug.crash "submatrix 1 "
  else if sr > er || sc > ec then Debug.crash "submatrix 2"
  else if not (fst (inBounds er ec m)) then Debug.crash "submatrix 3"
  else 
    Array.slice sr er (Array.map (Array.slice sc ec) m)

{-| I'm getting lazy about this. Just see https://hackage.haskell.org/package/matrix-0.3.4.4/docs/Data-Matrix.html#g:8


-}
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
---join blocks



--needs to check if the number cols is the same...
{-| Vertically joins togeather one matrix with another.

-}
verticalJoin : Matrix a -> Matrix a -> Matrix a 
verticalJoin = Array.append


{-| Horizontally joins togeather one matrix with another.

-}
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


--returns the minor and the member of the top row at x and the sign
{-| Creates the minor matrix of from the ith element of the 1st row. It returns the ith element of the 1st row, the sign (-1.0 or 1.0), and the minor matrix.

-}
minor : Int  -> Matrix a  -> (a, Float, Matrix a)
minor x m  = 
  let
    (rows, cols) = dimM m
    top = unsafeGetM 0 x m
    minusTop = Array.slice 1 (rows) m --I'm not sure how efficient slice is or really anything about this library
    minusx = Array.map (\m -> Array.append (Array.slice 0 x m) (Array.slice (x+1) cols m)) minusTop
    sign = (-1.0)^((toFloat x))
  in
    (top, sign, minusx)
    
{-| Returns all possible minors with their signs and corresponding elements.

-}

minors : Matrix a -> Array (a, Float, Matrix a) 
minors m =
  Array.indexedMap (\a throw -> minor a m) m












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

      
{-| Transposes a matrix. 

-}

transpose : Matrix a -> Matrix a
transpose m = 
  let 
    (rows,cols) = dimM m
  in
    matrix cols rows (\r c -> unsafeGetM c r m)

{-| Scales a vector in some space by some scalar in that space. 


-}
scaleVector : Space a -> a -> Vector a -> Vector a
scaleVector space scalar m = Array.map (space.mult scalar) m    
   

{-| Scales a matrix in some space by some scalar in that space. 


-}
scaleMatrix : Space a -> a -> Matrix a -> Matrix a
scaleMatrix space scalar m = map (space.mult scalar) m


{-| Scales just one row by some scalar.

-}
scaleRow : Space a -> Int -> a  -> Matrix a -> Matrix a
scaleRow space i scalar m = indexedMapRow (\r v -> if r==i then scaleVector space scalar v else v  ) m
{-| Adds one row times a scalar to another. To add the 3rd row times 4 to the 2nd row:

    combineRow realSpace 4 2 3 matrix


-}
    
combineRow : Space a -> a -> Int -> Int -> Matrix a -> Matrix a 
combineRow space scalar target origin m = 
  let
    add = space.add
    mult = space.mult
  in
    setRow target (addVector space (unsafeGetRow target m) (Array.map (mult scalar) (unsafeGetRow origin m))) m
{-| Switches two rows of a matrix.


-}


switchRow : Int -> Int -> Matrix a -> Matrix a 
switchRow row1 row2 m = 
  let
    r1 = unsafeGetRow row1 m
    r2 = unsafeGetRow row2 m 
  in
    setRow row2 r1 (setRow row1 r2 m)

--switchCols: Probably not needed... we will stick to row operations 

{-| Row reduces a matrix in a space a


-}

rowReduce : Space a ->  Matrix a -> Matrix a
rowReduce space m1 = gaussianEliminationBackwards space (gaussianEliminationForward space m1)

{-| Reduces a matrix to a upper triangular matrix if possible. Does not signal if this is impossible (yet)...


-}


--naming inconsistnecy! 
gaussianEliminationForward : Space a -> Matrix a -> Matrix a
gaussianEliminationForward space m =
  let
    (rows, cols) = dimM m
    elims = (min rows cols) - 1
  in
    gaussianEliminationHelper' space 0 elims m


{-| Reduces a matrix to a lower triangular matrix if possible. Does not signal if this is impossible (yet)...


-}

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
        
                      
                      


{-| Takes the norm of the vector i.e the square root of the sum of the squares of the absolute values.

-}

vectorNorm : Space a -> Vector a -> Float
vectorNorm s v = sqrt (Array.foldr (+) 0 (Array.map (\x -> (s.abs x )^2) v))

{-| Normalizes a vector

-}

normalizeVector : Space a -> Vector a -> Vector a
normalizeVector s v = 
  let
    norm = vectorNorm s v 
  in
    Array.map (\x -> s.mult (s.div s.one (s.fromReal norm )) x) v
  








addToVector : Space a -> a -> Vector a -> Vector a
addToVector space a v = Array.map (space.add a) v

addVector : Space a -> Vector a -> Vector a -> Vector a
addVector space = ArrayE.map2 space.add 




--add checking for outofbounds...

  
{-| Basically List.map2 but for matricies.

-}
elementWise : (a -> b -> c) -> Matrix a -> Matrix b -> Matrix c 
elementWise f m1 m2 = ArrayE.map2 (\a b -> ArrayE.map2 f a b) m1 m2

{-| Basically List.map2 but for vectors.

-}

vectorMap2 : (a -> b -> c) -> Vector a -> Vector b -> Vector c 
vectorMap2 = ArrayE.map2







{-| Computes the dot product of two vectors in a space.

-}

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

  
{-| Matrix multiplication.

-}

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

{-| compute the power of a matrix -}

matrixPower : Space a -> Int -> Matrix a -> Matrix a
matrixPower space n m =
  if n < 0 then case invert space m of
                  Nothing -> Debug.crash "matrix not invertible"
                  Just m' -> matrixPower space (-n) m'
  else if n == 0 then identity space (nrows m)
  else matrixMult space m (matrixPower space (n-1) m)

{-| Attemps to invert a matrix. Returns Just (the inverse) if it can and returns Nothing if there is no inverse.

-}
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
{-| Checks if a matrix is invertable.

-}
invertable : Space a -> Matrix a -> Bool
invertable space m1 = case (invert space m1) of 
                  Nothing -> False
                  _ -> True




{-| Calculates the trace of a matrix.

-}

trace : Space a -> Matrix a -> a
trace space m = Array.foldr space.add space.zero (unsafeGetDiag m)


{-| Calculates the products of the numbers in the diagnoal of a matrix.

-}
diagProd : Space a -> Matrix a -> a
diagProd space m = Array.foldr space.mult space.one (unsafeGetDiag m)



-- O(n!) so really bad...
-- in progress, but I thought I'd commit..
-- rephrase in more general terms i.e with add/mult.zero 
{-| Calculates the determiant of a matrix with the cofactor expansion. This is O((n-1)!). I will probably add other versions of it to use rowReduction, but this can be done later.


-}

simpleDet : Space a -> Matrix a -> a
simpleDet space m = 
  let 
    (rows, cols) = (dimM m)
  in
    if rows == 0 || (rows /= cols) then Debug.crash "We are going to wrap this to make this test...."
    else if (rows == 1) then (unsafeGetM 0 0 m)
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
             folder = ( \ (p, sgn, sub) start 
                          -> space.add start (space.mult (space.fromReal sgn) (space.mult p (simpleDet space sub))))
           in
             Array.foldr folder (space.fromReal 0) (minors m)

{-| a wrapper that prevents the program from crashing -}

simpleDet1 : Space a -> Matrix a -> Maybe a
simpleDet1 space m =
  let (rows, cols) = (dimM m) in
  if rows == 0 || rows /= cols then Nothing
  else Just <| simpleDet space m

--wolframalpha output of a matirx
--complex number printer











--Just a way of checking that eigen returns what it should
type alias EigenInfo = {values: Vector Expression.Complex, cols: Matrix Expression.Complex}
{-|

-}
eigen : Matrix (Expression.Complex) -> Maybe EigenInfo --Maybe {values: Vector Complex, cols: Matrix Complex}
eigen m = if not (isSquare m) then Nothing 
          else
            let 
              x = (CostlyLinear.eigen m)
              epsilon = 0.0000000001
              epsizero = \x -> if (abs x) < epsilon then 0 else x
              cepsizero = \x -> {re = epsizero x.re, im= epsizero x.im}
            in
              Just {values = x.values, cols = x.cols}
          


{-| Retuns Just a vector of eigen values or nothing if the matrix is not square or something horrible happens. Uses native code.


-}
eigenValues : Matrix (Expression.Complex) -> Maybe (Vector Expression.Complex)
eigenValues m = case (eigen m) of 
                  Just x -> Just x.values
                  _ -> Nothing
{-| Retuns Just a matrix of eigenvectors where each eigenvector is a column. Returns Nothing is the matrix is not square or something horrible happens. Uses native code.


-}
eigenVectors : Matrix Expression.Complex -> Maybe (Matrix Expression.Complex)
eigenVectors m = case (eigen m) of 
                   Just x -> Just x.cols
                   _ -> Nothing


{-| Takes A and returns Nothing if A is not diagonalizable. If it is, returns P^-1, A, P. 

-}

diagonalization : Matrix Expression.Complex -> Maybe ((Matrix Expression.Complex,Matrix Expression.Complex,Matrix Expression.Complex))
diagonalization m = 
  case eigen m of 
    Nothing -> Nothing --do we have eigne values and is it square
    Just eigeninfo ->
      let
        r = nrows eigeninfo.cols
        eigenVectors = transpose (eigeninfo.cols )
      in
        case (invert complexSpace eigenVectors) of --is the matrix invertable?
          Nothing -> Nothing
          Just pinverse -> let
            diagnoal = setDiag eigeninfo.values (identity complexSpace r )
         in
           Just (pinverse, diagnoal,transpose (eigeninfo.cols ) )

      


--Todo that is probably out of date:
--Clean up code
--write tests
--https://en.wikipedia.org/wiki/Crout_matrix_decomposition
--crout : Matrix Float -> (Matrix Float, Matrix Float, Matrix Float) lower,upper,permutation
--fix Array.slice    
--replace with Array.extra 
--col stuff
--diganolization
--maintain invaritans

  



--helpers that are not exported

unsafeGet :  Int -> Array a -> a
unsafeGet i a  = ArrayE.getUnsafe i a

arraymap2 : (a -> b -> c) -> Array a -> Array b -> Array c
arraymap2 = ArrayE.map2


taker : Int -> List a -> List (List a)
taker x ls =  case ls of 
                [] -> []
                _ -> (List.take x ls) :: (taker x (List.drop x ls))



--row, col
inBounds : Int -> Int -> Matrix a -> (Bool, (Int, Int))
inBounds row col m = 
  let
    (rows, cols) = dimM m
  in
    ((row <= rows || col <= cols), (rows, cols))



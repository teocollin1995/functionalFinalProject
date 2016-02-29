module Tests where
import ElmTest exposing (..)
import Linear as L
import CostlyLinear as CL
import Complex as C
import Expression exposing (Matrix, Vector, Complex)
--https://github.com/Bogdanp/elm-combine/blob/2.0.1/tests/TestRunner.elm testing structure


--test square matricies
--1x1
onebyone : Matrix Complex
onebyone = L.matrix 1 1 (\a b -> CL.randomComplex a)
--2x2
oneMatrix : List (Matrix Complex)
oneMatrix = [onebyone,onebyone,onebyone]

twobytwo : Matrix Complex
twobytwo = L.matrix 2 2 (\a b -> CL.randomComplex a)

twoMatrix : List (Matrix Complex)
twoMatrix = List.map (\x -> twobytwo) [0..4]

--3x3
threebythree : Matrix Complex
threebythree = L.matrix 3 3 (\a b -> CL.randomComplex a)

threeMatrix = List.map (\x -> threebythree) [0..4]
--5x5
fivebyfive : Matrix Complex
fivebyfive = L.matrix 5 5 (\a b -> CL.randomComplex a)

fiveMatrix : List (Matrix Complex)
fiveMatrix = List.map (\x -> fivebyfive) [0..4]

tenbyten : Matrix Complex 
tenbyten = L.matrix 10 10 (\a b -> CL.randomComplex a)

tenMatrix : List (Matrix Complex)
tenMatrix = List.map (\x -> tenbyten) [0..4]


epsilon = 0.1
--detTest
ourDet = L.simpleDet L.complexSpace
thereDet = CL.testDet 
testDet m = C.abs (C.sub (ourDet m) (thereDet m)) < epsilon
testDetList l = List.all (\x -> x == True) (List.map (testDet) l)

testDetOne = test "one by one det" (assert (testDetList oneMatrix))
testDetTwo = test "two by two det" (assert (testDetList twoMatrix))
testDetThree = test "Three by three det" (assert (testDetList threeMatrix))
testDetFive = test "five by five det" (assert (testDetList fiveMatrix))
testDetTen = test "ten by ten det" (assert (testDetList tenMatrix))
detTest : Test
detTest = suite "Determiants Tests" [testDetOne, testDetTwo,testDetThree, testDetFive, testDetTen ]


linearSuite : Test
linearSuite = suite "" [detTest]


allTests : Test
allTests =
  suite "All testing suites" [linearSuite ]

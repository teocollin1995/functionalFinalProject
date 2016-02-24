module Tests where
import ElmTest exposing (..)
import Linear as L
--https://github.com/Bogdanp/elm-combine/blob/2.0.1/tests/TestRunner.elm testing structure

linearSuite : Test
linearSuite = suite "" [test "Try" (equiv 1 1)]


allTests : Test
allTests =
  suite "All testing suites" [linearSuite ]

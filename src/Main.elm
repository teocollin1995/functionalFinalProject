module Main where

import CostlyLinear 

import Graphics.Element exposing (show)
import Linear
import Complex
import Array
import Complex as C
--main = show <| CostlyLinear.testInverse (Linear.fromLists [[Complex.fromReal 1, Complex.fromReal 2, Complex.fromReal 3],[Complex.fromReal 0, Complex.fromReal 1, Complex.fromReal 4],[Complex.fromReal 5, Complex.fromReal 6, Complex.fromReal 0]])

main = show <|   CostlyLinear.eigen (Linear.fromLists [[Complex.fromReal 1,Complex.fromReal 0],[Complex.fromReal 0, Complex.fromReal 1]])

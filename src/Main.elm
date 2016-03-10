module Main where

import CostlyLinear 
import Native.CostlyLinear
import Graphics.Element exposing (show)
import Linear
import Complex
import Array
import Complex as C
--main = show <| CostlyLinear.testInverse (Linear.fromLists [[Complex.fromReal 1, Complex.fromReal 2, Complex.fromReal 3],[Complex.fromReal 0, Complex.fromReal 1, Complex.fromReal 4],[Complex.fromReal 5, Complex.fromReal 6, Complex.fromReal 0]])

--main = show <|   CostlyLinear.eigen (Linear.fromLists [[Complex.fromReal 1,Complex.fromReal 0],[Complex.fromReal 0, Complex.fromReal 1]])

--main = show <| Native.CostlyLinear.crap "https://eigenserver-1245.appspot.com/eigen/\"[['0+0j','1+0j'],['0+0j','1+1j']]\""
  
main = show <| CostlyLinear.eigen5 (Array.fromList [Array.fromList [{re= 0.5,im=0.1},{re= 0.5,im=0.1}],Array.fromList [{re= 0.5,im=0.1},{re= 0.5,im=0.1}]])

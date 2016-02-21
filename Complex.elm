module Complex where

import Expression exposing (Complex)

real : Complex -> Float
real c = c.re

fromReal : Float -> Complex
fromReal r = 
  {re = r, im = 0}

imaginary : Complex -> Float
imaginary c = c.im

negation : Complex -> Complex
negation c = 
  {re = (-1) * c.re, im = (-1) * c.im}

abs : Complex -> Float 
abs c = 
  (c.re^2 + c.im^2)^(0.5)

absC : Complex -> Complex
absC c = 
  {re = abs c, im = 0}

conjugage : Complex -> Complex
conjugage c1 = 
  {re = c1.re, im = (-1)*c1.im}


add : Complex -> Complex -> Complex
add c1 c2 = 
  {re = (c1.re + c2.re), im = (c1.im + c2.im)}


sub : Complex -> Complex -> Complex
sub c1 c2 = add c1 (negation c2)


mult : Complex -> Complex -> Complex
mult c1 c2 = 
  {re = c1.re * c2.re - (c1.im * c2.im), im = c1.re * c2.im + c2.re * c1.im}

div : Complex -> Complex -> Complex 
div c1 c2 = 
  let
    numRe = c1.re * c2.re + c1.im * c2.im
    numIm = c1.im * c2.re - c1.re * c2.im
    den = c2.re^2 + c2.im^2
  in 
    {re = numRe/den, im = numIm/den}

--reciprocal 
rec : Complex -> Complex
rec c1 = 
  div {re = 1, im = 0} c1

sgn : Complex -> Float
sgn c = 
  case (c.re, c.im) of 
    (0,0) -> 0 
    (0,b) -> if b > 0 then (1) else if b < 0 then (-1) else 0
    (a,b) -> if a > 0 then 1 else (-1)


sqrt : Complex -> (Complex, Complex)
sqrt c1 = 
  let
  gamma = ((c1.re + (abs c1)) /2)^(0.5)
  delta = (((-1) * c1.re + (abs c1)) /2)^(0.5)
  in
    ({re=gamma, im=delta}, {re = (-1)*gamma, im = (-1)* delta})


euler : Float -> Complex
euler x = 
  {re=cos x, im=sin x}
  
--https://hackage.haskell.org/package/base-4.8.2.0/docs/src/GHC.Float.html#atan2
atan2 : number -> number' -> Float
atan2 y x = 
  if x > 0 then atan (y/x)
  else if x == 0 && y > 0 then pi / 2
  else if x < 0 && y > 0 then pi + atan (y/x)
  else if (x <= 0 && y < 0 ) then 0 - (atan2 (-y) x)
  else if (y == 0 && (x < 0)) then pi
  else if x == 0 && y == 0 then y
  else x+y
  

arg : Complex -> Float
arg c = 
  case (c.re, c.im) of 
    (0,0) -> 0 
    (x,y) -> atan2 y x

ln : Complex -> (Int -> Complex)
ln z = 
  \k -> {re = logBase (Basics.e) (abs z), im = (arg z) + 2 * Basics.pi * (toFloat k)}

exp : Complex -> Complex
exp c = 
  mult {re = Basics.e ^(real c), im = 0} (euler (imaginary c))

<<<<<<< HEAD
pow : Complex -> Complex -> Complex
pow z w = exp  ({re=logBase (Basics.e) (abs z), im=(arg z)} `mult` w)
=======
toComplex : Float -> Complex
toComplex x = {re = x, im = 0}
>>>>>>> 287994b0c91a2bfc5a1d83a39ea3e22830b96f89

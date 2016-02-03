module Complex where 

type alias Complex = {re : Float, img: Float}


real : Complex -> Float
real c = c.re

imaginary : Complex -> Float
imaginary c = c.img

negation : Complex -> Complex
negation c = 
  {re = (-1) * c.re, img = (-1) * c.img}

abs : Complex -> Float 
abs c = 
  (c.re^2 + c.img^2)^(0.5)

absC : Complex -> Complex
absC c = 
  {re = abs c, img = 0}

conjurage : Complex -> Complex
conjurage c1 = 
  {re = c1.re, img = (-1)*c1.img}


add : Complex -> Complex -> Complex
add c1 c2 = 
  {re = (c1.re + c2.re), img = (c1.img + c2.img)}


sub : Complex -> Complex -> Complex
sub c1 c2 = add c1 (negation c2)


mult : Complex -> Complex -> Complex
mult c1 c2 = 
  {re = c1.re * c2.re - (c1.img * c2.img), img = c1.re * c2.img + c2.re * c1.img}

div : Complex -> Complex -> Complex 
div c1 c2 = 
  let
    numRe = c1.re * c2.re + c1.img * c2.img
    numImg = c1.img * c2.re - c1.re * c2.img
    den = c2.re^2 + c2.img^2
  in 
    {re = numRe/den, img = numImg/den}

--reciprocal 
rec : Complex -> Complex
rec c1 = 
  div {re = 1, img = 0} c1

sgn : Complex -> Float
sgn c = 
  case (c.re, c.img) of 
    (0,0) -> 0 
    (0,b) -> if b > 0 then (1) else if b < 0 then (-1) else 0
    (a,b) -> if a > 0 then 1 else (-1)


sqrt : Complex -> (Complex, Complex)
sqrt c1 = 
  let
  gamma = ((c1.re + (abs c1)) /2)^(0.5)
  delta = (((-1) * c1.re + (abs c1)) /2)^(0.5)
  in
    ({re=gamma, img=delta}, {re= (-1)*gamma, img= (-1)* delta})


euler : Float -> Complex
euler x = 
  {re=cos x, img =sin x}
  
--https://hackage.haskell.org/package/base-4.8.2.0/docs/src/GHC.Float.html#atan2
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
  case (c.re, c.img) of 
    (0,0) -> 0 
    (x,y) -> atan2 y x

ln : Complex -> (Int -> Complex)
ln z = 
  \k -> {re = logBase (Basics.e) (abs z), img = (arg z) + 2 * Basics.pi * (toFloat k)}

exp : Complex -> Complex
exp c = 
  mult {re = Basics.e ^(real c), img = 0} (euler (imaginary c))

module Complex where




{-| The complex module gives you most of what you could desire to use complex numbers. There is not much else to say. Do note that some functions return (Int -> Float). This is because there are no unique thigns for some complex operations (e.g. logs). You can typically just give the result a 0 and be fine with it, but sometimes you may want a particular class of values and this gives you the power to select them.

# Basics
@docs complex, i, one, zero

# Basic operations on one number 
@docs real, isReal, fromReal, imaginary, negation, abs, absC, conjugage, rec, sgn, sqrt

# Basic Binary Ops
@docs add, sub, mult, div

# Trig
@docs euler, atan2, arg, ccos,csin, ctan, cacos,casin,catan

# More advanced stuff
@docs ln, exp, pow


-}
import Expression exposing (Complex)
{-| Generates a complex number. E.g complex 1 2 = 1+2i

-}




complex : Float -> Float -> Complex
complex a b = {re = a, im = b}
{-| The number i.

-}
i : Complex
i = {re = 0, im = 1}
{-| The number 1.

-}
one : Complex
one = {re = 1, im = 0}
{-| The number 0.

-}

zero : Complex
zero = {re = 0, im = 0}

{-| Provides the real part of a complex number. 

-}

real : Complex -> Float
real c = c.re
{-| Tests if the numer is real

-}
isReal : Complex -> Bool
isReal c = c.im == 0

{-| Creates a complex number from one real numer. So fromReal 5 = 5 + 0i

-}

fromReal : Float -> Complex
fromReal r = 
  {re = r, im = 0}

{-| Takes the imaginary part of the complex number.

-}

imaginary : Complex -> Float
imaginary c = c.im

{-| Negates a complex number. E.g negation 1+2i = -1-2i

-}

negation : Complex -> Complex
negation c = 
  {re = (-1) * c.re, im = (-1) * c.im}

{-| Takes the absolute value of a complex nuber 
-}

abs : Complex -> Float 
abs c = 
  (c.re^2 + c.im^2)^(0.5)

{-| Takes the absolute value of a complex number, but keeps it in complex space

-}

absC : Complex -> Complex
absC c = 
  {re = abs c, im = 0}

{-| Returns the conjugate of a complex number e.g conjugate 2+3i = 2 - 3i

-}

conjugage : Complex -> Complex
conjugage c1 = 
  {re = c1.re, im = (-1)*c1.im}

{-| Adds two complex numbers

-}
add : Complex -> Complex -> Complex
add c1 c2 = 
  {re = (c1.re + c2.re), im = (c1.im + c2.im)}

{-|Subtacts two complex numbers.

-}

sub : Complex -> Complex -> Complex
sub c1 c2 = add c1 (negation c2)

{-| Multiplies two complex numbers

-}
mult : Complex -> Complex -> Complex
mult c1 c2 = 
  {re = c1.re * c2.re - (c1.im * c2.im), im = c1.re * c2.im + c2.re * c1.im}

{-| Divides two complex numbers.

-}
div : Complex -> Complex -> Complex 
div c1 c2 = 
  let
    numRe = c1.re * c2.re + c1.im * c2.im
    numIm = c1.im * c2.re - c1.re * c2.im
    den = c2.re^2 + c2.im^2
  in 
    {re = numRe/den, im = numIm/den}

{-| Reciprocal of a complex number

-} 
rec : Complex -> Complex
rec c1 = 
  div {re = 1, im = 0} c1

{-| Sign of a complex number

-}
sgn : Complex -> Float
sgn c = 
  case (c.re, c.im) of 
    (0,0) -> 0 
    (0,b) -> if b > 0 then (1) else if b < 0 then (-1) else 0
    (a,b) -> if a > 0 then 1 else (-1)


{-| Square root of a complex number. Returns both possibilites.

-}
sqrt : Complex -> (Complex, Complex)
sqrt c1 = 
  let
  gamma = ((c1.re + (abs c1)) /2)^(0.5)
  delta = (((-1) * c1.re + (abs c1)) /2)^(0.5)
  in
    ({re=gamma, im=delta}, {re = (-1)*gamma, im = (-1)* delta})

{-|Euler's formula

-}

euler : Float -> Complex
euler x = 
  {re=cos x, im=sin x }
  

{-| A really well made version of atan to be used in the argument

-}
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
  
{-| The argument of a complex number. It is in radians

-}
arg : Complex -> Float
arg c = 
  case (c.re, c.im) of 
    (0,0) -> 0 
    (x,y) -> atan2 y x

{-| The natrual log of a complex number

-}

ln : Complex -> (Int -> Complex)
ln z = 
  \k -> {re = logBase (Basics.e) (abs z), im = (arg z) + 2 * Basics.pi * (toFloat k)}

{-| The exponent of a complex number.

-}
exp : Complex -> Complex
exp c = 
  mult {re = Basics.e ^(real c), im = 0} (euler (imaginary c))

{-| Take a complex number to a complex power

-}
pow : Complex -> Complex -> Complex
pow z w = exp  ({re=logBase (Basics.e) (abs z), im=(arg z)} `mult` w)

{-| Complex cosine

-}

ccos : Complex -> Complex 
ccos z = div (add (exp (mult i z)) (exp (negation (mult i z)))) {re = 2, im = 0}

{-| Complex sine.

-}
csin : Complex -> Complex
csin z =  div (sub (exp (mult i z)) (exp (negation (mult i z)))) {re = 0, im = 2}

{-| Complex tangent

-}
ctan : Complex -> Complex
ctan z = 
  let
    num = mult i (sub (exp (negation (mult i z))) (exp ( (mult i z))))
    den = (add (exp (negation (mult i z))) (exp ( (mult i z))))
  in
    div num den

{-| Complex inverse sine.

-}
casin : Complex -> (Int -> Complex)
casin z = \k -> mult (negation i) (ln (add (mult i z) (pow (sub one (pow z {re=2,im =0})) {re=0.5, im=0})) k)

{-| Complex inverse cosine

-}
cacos : Complex -> (Int -> Complex)
cacos z = \k -> sub {re=Basics.pi/2, im =0} (casin z k)

{-| Complex inverse tan

-}
catan : Complex -> (Int -> Complex)
catan z = \k ->  mult (mult i {re = 0.5, im = 0}) (sub (ln (sub one (mult i z)) k) (ln (add one (mult i z)) k))

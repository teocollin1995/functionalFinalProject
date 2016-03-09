module Examples where

basic1 = "3+4"

basic2 = "(4+3)/2"

basic3 = "(1+5)*(2-8)"

function1 = "sin(4)"

function2 = "cos(3)*sin(3)"

complex1 = "(3+4i)*(1+7i)"

complex2 = "(6+8i)/i"

complex3 = "sin(4+3i)"

complex4 = "(4+i)^10"

linear1 = "{{1,2},{3,4}}*{{4,3},{2,1}}"

linear2 = "eigenvalue {{1,4,5},{2,1,10},{-1,-4,9}}"

linear3 = "eigenvector {{43,10},{-10,3}}"

linear4 = "det {{3,1,4},{2,176,9},{24,821,190}}"

linear5 = "inv {{452,1},{3,8}}"

calculus1 = "d/dx x"

calculus2 = "d/dx (x^2 +y)"

calculus3 = "d/dx (sin(x) + cos(y))"

calculus4 = "d/dx x^2 at 2"

calculus5 = "int sin(x) from -1 to 2"
            
examples : List (String, String)
examples =
  [ ("examples","")
  , ("number: add", basic1)
  , ("number: div", basic2)
  , ("number: parens" , basic3)
  , ("function: sin", function1)
  , ("function: cos", function2)
  , ("complex: mult", complex1)
  , ("complex: div", complex2)
  , ("complex: sin", complex3)
  , ("complex: exponential", complex4)
  , ("matrix: mult", linear1)
  , ("matrix: eigenvalue", linear2)
  , ("matrix: eigenvector", linear3)
  , ("matrix: det", linear4)
  , ("matrix: inverse", linear5)
  , ("calculus: derivative", calculus1)
  , ("calculus: partial derivative1", calculus2)
  , ("calculus: partial derivative2", calculus3)
  , ("calculus: numeric differentiation", calculus4)
  , ("calculus: numeric integration", calculus5)
  ]

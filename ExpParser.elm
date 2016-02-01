module ExpParser where

import Char
import Maybe exposing (withDefault)
import Result exposing (toMaybe)
import String

import Expression exposing (..)
import OurParser as P exposing (Parser, (*>))

-- switch to haskell syntax
(+++) = P.or
(<++) = P.left_or
(<$>) = P.map
(>>=) = P.andThen

--the following part is copied from the Parser.Number library

--TODO : copy other functions from the Parser.Number library and Parser.Char library
digit : Parser Int
digit =
    let
        charToInt c = Char.toCode c - Char.toCode '0'
    in
        P.map charToInt (P.satisfy Char.isDigit)

{-| Parse a natural number -}
natural : Parser Int
natural =
    P.some digit
    |> P.map (List.foldl (\b a -> a * 10 + b) 0)

{-| Parse a optional sign, succeeds with a -1 if it matches a minus `Char`, otherwise it returns 1 -}
sign : Parser Int
sign =
    let
        plus =
            P.map (always -1) (P.symbol '-')
        min =
            P.map (always 1) (P.symbol '+')
    in
        P.optional (plus `P.or` min) 1

{-| Parse an integer with optional sign -}
integer : Parser Int
integer =
    P.map (*) sign
    |> P.andMap natural

{-| The fromOk function extracts the element out of a Ok, with a default. -}
fromOk : a -> Result e a -> a
fromOk default result =
    withDefault default (toMaybe result)
                
{-| Parse a float with optional sign -}
float : Parser Float
float =
    let
        toFloatString (i, ds) =
          toString i ++ "." ++ String.concat (List.map toString ds)
        convertToFloat sig int digs =
          toFloat sig * (fromOk 0.0 << String.toFloat << toFloatString) (int, digs)
    in
        P.map convertToFloat sign
        |> P.andMap integer
        |> P.andMap (P.symbol '.' *> P.some digit)

--------------------------------------------------------------

--TODO:
-- clean up unnecessary code
-- include the parser for float
-- expand parseExp to include all Ops

token1 : a -> String -> Parser a
token1 val str = skipSpaces *> (always val <$> P.token str)
                
parseInt : Parser Exp
parseInt = skipSpaces *> (EInt <$> integer)

parseFloat : Parser Exp
parseFloat = skipSpaces *> (EFloat <$> float)

parseNum : Parser Exp
parseNum = P.recursively <| \_ -> parseFloat <++ parseInt

isSpace : Char -> Bool
isSpace a  = a == ' ' || a == '\n' || a == '\t'
             
skipSpaces : Parser ()
skipSpaces = P.map (\_ -> ()) <| P.many <| P.satisfy isSpace

parens : Parser a -> Parser a
parens p =
  skipSpaces *>
  P.token "(" *>
  skipSpaces *>
  p >>= \x ->
  skipSpaces *>
  P.token ")" *>
  P.succeed x
   
parseConst : Parser Exp
parseConst =
     ((\_ -> EConst Pi) <$> P.token "pi")
 <++ ((\_ -> EConst E) <$> P.token "e")

allOps : List String
allOps =
  ["pi","e"
  ,"sin", "cos", "tan", "arcsin", "arccos", "arctan", "floor","ceiling","round","sqrt","log"
  , "+","-","*","/", "logBase"]

opStr : String -> Op
opStr s =
  case s of
    "pi" -> Pi
    "e"  -> E
    "sin" -> Sin
    "cos" -> Cos
    "tan" -> Tan
    "arcsin" -> ArcSin
    "arccos" -> ArcCos
    "arctan" -> ArcTan
    "floor" -> Floor
    "ceiling" -> Ceiling
    "round" -> Round
    "sqrt" -> Sqrt
    "log" -> Log
    "+" -> Plus
    "-" -> Minus
    "*" -> Mult
    "/" -> Frac
    "logBase" -> LogBase
    _ -> Debug.crash <| "opStr: " ++ s
        
parseExp : Parser Exp
parseExp = P.recursively <| \_ ->
   let  prec0 = P.recursively <| \_ -> P.chainl1 prec1 <|
        (token1 (EBinaryOp Plus) "+")
        <++ (token1 (EBinaryOp Minus) "-")
        prec1 = P.recursively <| \_ -> P.chainl1 prec2 <|
        (token1 (EBinaryOp Mult) "*")
        <++ (token1 (EBinaryOp Frac) "/")
        prec2 = P.recursively <| \_ -> parseNum <++ parens prec0
   in prec0
      
test = P.parseAll parseExp "2 * (4 + 3)"

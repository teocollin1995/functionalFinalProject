module Main where
--https://github.com/Bogdanp/elm-combine/blob/2.0.1/tests/TestRunner.elm testing structure
import ElmTest exposing (consoleRunner)
import Console exposing (IO, run)
import Task

import Tests


console : IO ()
console = consoleRunner Tests.allTests

port runner : Signal (Task.Task x ())
port runner = run console

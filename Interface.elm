module Interface where

import Html exposing (Html, Attribute)
import Html.Attributes as Attr
import Html.Events as Events
import Signal exposing (Mailbox, mailbox)
import Time

import Expression exposing (..)
import ExpParser as Parser
import Eval as E

-- CSS classes here ---

basicStyle =
      [ ("font-size","12pt")
      , ("font-family", "monospace")
      , ("white-space","pre")
      ]

containerStyle : Attribute
containerStyle =
  Attr.style <|
      basicStyle ++
           [ ("position","relative")
           , ("width","800pt")
           ]
      
inputStyle : Attribute
inputStyle =
  Attr.style <|
      basicStyle ++
             [ ("position","absolute")
             , ("height","100pt")
             , ("width", "300pt")
             , ("left", "0pt")
             , ("border", "3pt")
             , ("border-style", "solid")
             , ("border-color","blue")
             ]

outputStyle : Attribute
outputStyle =
  Attr.style <|
      basicStyle ++
             [ ("position","absolute")
             , ("height", "100pt")
             , ("width","300pt")
             , ("left", "400pt")
             , ("border", "3pt")
             , ("border-style", "solid")
             , ("border-color", "green")
             ]

buttonStyle : Attribute
buttonStyle =
  Attr.style
      [ ("position","absolute")
      , ("left", "305pt")
      , ("background-color", "green")
      , ("border","none")
      , ("color", "white")
      , ("padding", "10pt")
      , ("text-align","center")
      , ("text-decoration", "none")
      , ("display", "inline-block")
      , ("font-size","16pt")
      , ("cursor", "pointer")
      ]
  
compute : String -> String
compute input =
  case Parser.parse input of
    Ok exp -> Parser.unparse <| E.eval exp
    Err s -> Debug.crash s
             
btnMailbox : Mailbox String
btnMailbox = mailbox ""

evtMailbox : Mailbox Event
evtMailbox = mailbox (UpModel identity)

-- add more fields to model if necessary
type alias Model =
  { input : String,
    output : String
  }

type Event = UpModel (Model -> Model)

upstate : Event -> Model -> Model
upstate event model =
  case event of
    UpModel f -> f model

events : Signal Event
events = Signal.merge evtMailbox.signal eventsFromJS
         
view : Model -> Html
view model =
  let input =
        Html.textarea
         [ inputStyle, Attr.contenteditable True, Attr.id "input" ]
         [ Html.text model.input ]
  in
  let output =
        Html.div
            [ outputStyle, Attr.contenteditable False, Attr.id "output" ]
            [ Html.text model.output ]
  in
  let btn =
        Html.button
            [ Attr.contenteditable False
            , buttonStyle
            , Events.onMouseDown btnMailbox.address "clear"
            , Events.onClick btnMailbox.address "update"
            , Events.onMouseUp btnMailbox.address "tex"
            ] 
            [ Html.text "See Result" ]
  in
  Html.div
      [ containerStyle ]
      [ input, btn, output ]

initModel : Model
initModel = { input = "", output = ""}

--- interaction with javascript ---

eventsFromJS : Signal Event 
eventsFromJS =
  let foo s = UpModel <| \model -> { input = s, output = "$$" ++ compute s ++ "$$" } in
  Signal.map foo signalFromJS

port signalFromJS : Signal String
                    
port signalToJS : Signal String
port signalToJS = btnMailbox.signal
                  
main : Signal Html
main = Signal.map view (Signal.foldp upstate initModel events)

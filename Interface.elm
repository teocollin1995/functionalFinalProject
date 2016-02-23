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

basicStyle : Attribute
basicStyle =
  Attr.style
      [ ("font-size","12pt")
      , ("font-family", "monospace")
      , ("white-space","pre")
      , ("border","3pt")
      , ("border-style","solid")
      , ("border-color","black")
      , ("width", "300px")
      , ("height","300px")
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
        Html.div
         [ basicStyle, Attr.contenteditable True, Attr.id "input" ]
         [ Html.text model.input ]
  in
  let output =
        Html.div
            [ basicStyle, Attr.contenteditable False, Attr.id "output" ]
            [ Html.text model.output ]
  in
  let btn =
        Html.button
            [ Attr.contenteditable False
            , Events.onMouseDown btnMailbox.address "clear"
            , Events.onClick btnMailbox.address "update"
            ]
            [ Html.text "See Result" ]
  in
  Html.div
      [ basicStyle ]
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
port signalToJS =
  Signal.merge btnMailbox.signal
    <| Signal.map (always "tex") <| Time.every (5*Time.second)
                  
main : Signal Html
main = Signal.map view (Signal.foldp upstate initModel events)

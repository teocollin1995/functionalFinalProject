module Interface where

import Html exposing (Html, Attribute)
import Html.Attributes as Attr
import Html.Events as Events
import Signal exposing (Mailbox, mailbox)
import Time
import Result as R
import Json.Decode as Decode

import Expression exposing (..)
import ExpParser as Parser
import Eval as E
import Examples exposing (examples)

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
           , ("top", "50pt")
           , ("left","100pt")
           , ("width","800pt")
           --, ("height", "100%")
           ]
      
inputStyle : Attribute
inputStyle =
  Attr.style <|
      basicStyle ++
             [ ("position","relative")
             , ("height","50pt")
             , ("width", "300pt")
             --, ("left", "0pt")
             , ("border", "3pt")
             , ("border-style", "solid")
             , ("border-color","blue")
             , ("background-color","white")
             ]

outputStyle : Attribute
outputStyle =
  Attr.style <|
      basicStyle ++
             [ ("position","relative")
             , ("height", "150pt")
             , ("width","450pt")
             --, ("top","50pt")
             --, ("left", "-50pt")
             , ("border", "3pt")
             , ("border-style", "solid")
             , ("border-color", "green")
             , ("background-color", "white")
             ]

buttonStyle : Attribute
buttonStyle =
  Attr.style
      [ ("position","absolute")
      , ("top", "30pt")
      , ("left", "330pt")
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

captionStyle : Attribute
captionStyle =
  Attr.style
      [ ("font-size", "36pt")
      , ("font-family","Times New Roman")
      , ("text-align","center")
      , ("color", "red")
      ]

captionStyle1 : Attribute
captionStyle1 =
  Attr.style
      [ ("font-size", "24pt")
      , ("font-family", "Courier")
      , ("color", "black")
      ]
  
bodyStyle : Attribute
bodyStyle =
  Attr.style
      [ ("background-color", "grey") ]

errorStyle : Attribute
errorStyle =
  Attr.style
      [ ("font-size", "20pt")
      , ("font-family", "Arial Black")
      , ("color", "red")
      ]

dropDownStyle : Attribute
dropDownStyle =
  Attr.style
      [ ("position","absolute")
      , ("right", "50pt")
      , ("width", "200pt")
      , ("font-size", "20pt")
      , ("font-family", "Book Antiqua")
      ]

--------------------------------------------------

compute : String -> Result String String
compute input =
  case Parser.parse input of
    Ok exp -> R.map Parser.unparse <| E.eval exp
    Err s -> Err <| "parse error: please check your input"
             
btnMailbox : Mailbox String
btnMailbox = mailbox ""

evtMailbox : Mailbox Event
evtMailbox = mailbox (UpModel identity)

-- add more fields to model if necessary
type alias Model =
  { input : String
  , output : Result String String
  }

type Event = UpModel (Model -> Model)

upstate : Event -> Model -> Model
upstate event model =
  case event of
    UpModel f -> f model

events : Signal Event
events = Signal.merge evtMailbox.signal eventsFromJS

fromOk : Result String String -> String
fromOk mx =
  case mx of
    Ok s -> s
    Err s -> s

-- http://stackoverflow.com/questions/32426042/how-to-print-index-of-selected-option-in-elm
targetSelectedIndex : Decode.Decoder Int
targetSelectedIndex = Decode.at ["target", "selectedIndex"] Decode.int

index : Int -> List a -> a
index n xs =
  if n < 0 then Debug.crash "index: negative index"
  else case xs of
         [] -> Debug.crash "index: empty list"
         x::xs' -> if n == 0 then x else index (n-1) xs'
          
view : Model -> Html
view model =
  let body =
        let options =
              let foo (name,code) =
                    Html.option [ Attr.value name] [ Html.text name ]
              in
                List.map foo examples
        in
        let dropDown =
              Html.select
                  [ Attr.contenteditable False
                  --, dropDownStyle
                  , Events.on "change" targetSelectedIndex <| \i ->
                    let (_,code) = index i examples in
                    Signal.message evtMailbox.address <| UpModel <| \model ->
                      { model | input = code }
                   ]
              options
        in
        let br = Html.br [] [] in
        let example = Html.span
                      [ dropDownStyle ]
                      [ Html.text "Examples", br, dropDown ]
        in
        let input =
              Html.div
                    [ inputStyle, Attr.contenteditable True, Attr.id "input" ]
                    [ Html.text model.input ]
        in
        let output =
              case model.output of
                Ok s -> Html.div
                         [ outputStyle, Attr.contenteditable False, Attr.id "output" ]
                         [ Html.text s ]
                Err s -> Html.div
                          [ outputStyle, Attr.contenteditable False, Attr.id "output" ]
                          [ Html.strong [ errorStyle ] [ Html.text s]]
        in
        let btn =
            Html.button
              [ Attr.contenteditable False
              , buttonStyle
              , Events.onMouseDown btnMailbox.address "update"
              , Events.onMouseUp btnMailbox.address (fromOk model.output)
              ] 
              [ Html.text "See Result" ]
        in
        let inputCaption =
              Html.span [ captionStyle1 ] [ Html.text "Input"]
        in
        let outputCaption =
              Html.span [ captionStyle1 ] [ Html.text "Output"]
        in
        Html.div
          [ containerStyle ]
          [ inputCaption, example, br, input, btn, br, br, outputCaption, output ]
  in
  let header =
     let caption =
           Html.h1 [ captionStyle ] [ Html.text "WolframAlpha in Elm" ]
      in
        Html.header [] [ caption ]
  in      
     Html.body [ bodyStyle ] [ header, body ]

initModel : Model
initModel = { input = "", output = Ok ""}

--- interaction with javascript ---

eventsFromJS : Signal Event 
eventsFromJS =
  let foo s = UpModel <| \model ->
              case compute s of
                Ok s' -> { model | input = s, output = Ok <| "$$" ++ s' ++ "$$" }
                Err s' -> { model | input = s, output = Err s'}  
  in
  Signal.map foo signalFromJS

port signalFromJS : Signal String
                    
port signalToJS : Signal String
port signalToJS = btnMailbox.signal
                  
main : Signal Html
main = Signal.map view (Signal.foldp upstate initModel events)

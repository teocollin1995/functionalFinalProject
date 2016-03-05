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
           , ("top", "50pt")
           , ("left","200pt")
           , ("width","800pt")
           --, ("height", "100%")
           ]
      
inputStyle : Attribute
inputStyle =
  Attr.style <|
      basicStyle ++
             [ ("position","relative")
             --, ("height","100pt")
             , ("width", "300pt")
             --, ("left", "0pt")
             , ("border", "3pt")
             , ("border-style", "solid")
             , ("border-color","blue")
             , ("placeholder", "'Enter your expression here'")
             ]

outputStyle : Attribute
outputStyle =
  Attr.style <|
      basicStyle ++
             [ ("position","relative")
             , ("height", "100pt")
             , ("width","300pt")
             --, ("top","50pt")
             --, ("left", "400pt")
             , ("border", "3pt")
             , ("border-style", "solid")
             , ("border-color", "green")
             , ("background-color", "white")
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
  { input : String
  , output : String
  , display : Bool
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
  let body = 
        let input =
              Html.textarea
                    [ inputStyle, Attr.contenteditable True, Attr.id "input" ]
                    [ Html.text model.input ]
        in
        let output =
              if model.display == True then
                Html.div
                    [ outputStyle, Attr.contenteditable False, Attr.id "output" ]
                    [ Html.text model.output ]
              else
                Html.div
                    [ outputStyle, Attr.contenteditable False, Attr.id "output"]
                    []
        in
        let btn =
            Html.button
              [ Attr.contenteditable False
              , buttonStyle
              , Events.onMouseDown btnMailbox.address "update"
              --, Events.onClick btnMailbox.address "update"
              , Events.onMouseUp btnMailbox.address model.output
              ] 
              [ Html.text "See Result" ]
        in
        let br = Html.br [] [] in
        let inputCaption =
              Html.span [ captionStyle1 ] [ Html.text "Input"]
        in
        let outputCaption =
              Html.span [ captionStyle1 ] [ Html.text "Output"]
        in
        Html.div
          [ containerStyle ]
          [ inputCaption, br, input, btn, br, br, outputCaption, output ]
  in
  let header =
     let caption =
           Html.h1 [ captionStyle ] [ Html.text "WolframAlpha in Elm" ]
      in
        Html.header [] [ caption ]
  in      
     Html.body [ bodyStyle ] [ header, body ]

initModel : Model
initModel = { input = "", output = "", display = True}

--- interaction with javascript ---

eventsFromJS : Signal Event 
eventsFromJS =
  let foo s =
        if s == "false" then UpModel <| \model -> { model | display = False }
        else UpModel <| \model -> { model | input = s, output = "$$" ++ compute s ++ "$$" }
  in
  Signal.map foo signalFromJS

port signalFromJS : Signal String
                    
port signalToJS : Signal String
port signalToJS = btnMailbox.signal
                  
main : Signal Html
main = Signal.map view (Signal.foldp upstate initModel events)

module Interface where

import Html exposing (Html, Attribute)
import Html.Attributes as Attr
import Html.Events as Events
import Signal exposing (Mailbox, mailbox)
import Time
import Result as R
import Json.Decode as Decode
import Graphics.Element as GE
import Graphics.Collage

import Expression exposing (..)
import ExpParser as Parser
import Eval as E
import Examples exposing (examples)
import Graphic as G

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
             , ("height", "100pt")
             , ("width","350pt")
             --, ("top","50pt")
             --, ("left", "-50pt")
             , ("border", "3pt")
             , ("border-style", "solid")
             , ("border-color", "green")
             , ("background-color", "white")
             ]

graphicOutputStyle : Attribute
graphicOutputStyle =
  Attr.style <|
      basicStyle ++
        [ ("position", "absolute")
        , ("height", "270pt")
        , ("width", "300pt")
        , ("top","60pt")
        , ("right", "0pt")
        , ("border","3pt")
        , ("border-style", "solid")
        , ("border-color", "green")
        , ("background-color", "white")
        ]
      
buttonBasic =
  [ ("position","absolute")
  , ("left", "330pt")
  , ("border","none")
  , ("border-radius","8pt")
  , ("color", "white")
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
      [ ("font-size", "20pt")
      , ("font-family", "Palatino Linotype")
      , ("color", "black")
      ]

captionStyle2 : Attribute
captionStyle2 =
  Attr.style
      [ ("position","absolute")
      , ("right", "180pt")
      , ("top","35pt")
      , ("font-size", "20pt")
      , ("font-family", "Palatino Linotype")
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
      , ("top", "-40pt")
      , ("right", "50pt")
      , ("width", "200pt")
      , ("height", "40pt")
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
  , graphic : Maybe GE.Element
  }

type Event = UpModel (Model -> Model)

upstate : Event -> Model -> Model
upstate event model =
  case event of
    UpModel f -> f model

events : Signal Event
events = Signal.merge evtMailbox.signal eventsFromJS

updateGraphic : String -> (Maybe String, Maybe GE.Element)
updateGraphic input =
  case Parser.parse input of
    Ok e -> (Nothing, Just <| G.plot (-1,1) 150 e)
    Err s -> (Just "parse error: Please check your input", Nothing)
             
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
                          [ Html.text s]
        in
        let graphicOutput =
               case model.graphic of
                Just graph ->  Html.div
                                 [ graphicOutputStyle, Attr.id "graphicOutput" ]
                                 [ Html.fromElement graph ]
                _          ->  Html.div [ graphicOutputStyle, Attr.id "graphicOutput" ] []
        in
        let computeBtn =
            Html.button
              [ Attr.contenteditable False
              , Attr.style <|
                    buttonBasic ++
                      [ ("top", "0pt")
                      , ("background-color", "green")
                      , ("padding", "10pt")
                      ]
              , Events.onMouseDown btnMailbox.address "update"
              , Events.onMouseUp btnMailbox.address (fromOk model.output)
              ] 
              [ Html.text "Compute" ]
        in
        let clearBtn =
              Html.button
                  [ Attr.contenteditable False
                  , Attr.style <|
                        buttonBasic ++
                          [ ("top", "45pt")
                          , ("background-color", "#269F40")
                          , ("padding", "10pt 24pt")
                          ]
                  , Events.onClick evtMailbox.address <| UpModel <| \model ->
                    { model | input = "", output = Ok "", graphic = Nothing}
                  -- , Events.onMouseUp btnMailbox.address "clear"
                  ]
                  [ Html.text "Clear" ]
        in
        let plotBtn =
              Html.button
                  [ Attr.contenteditable False
                  , Attr.style <|
                        buttonBasic ++
                          [ ("top", "90pt")
                          , ("background-color","#73B76D")
                          , ("padding", "10pt 29pt")
                          ]
                  , Events.onClick btnMailbox.address "graphicUpdate"
                  ]
                  [ Html.text "Plot" ]
        in
        let inputCaption =
              Html.span [ captionStyle1 ] [ Html.text "Input"]
        in
        let outputCaption =
              Html.span [ captionStyle1 ] [ Html.text "Output"]
        in
        let graphicCaption =
              Html.span [ captionStyle2 ] [ Html.text "Graphic Output" ]
        in
        Html.div
          [ containerStyle ]
          [ inputCaption, example, br, input, computeBtn, clearBtn, plotBtn, graphicCaption, graphicOutput, br, br, br, outputCaption, output ]
  in
  let header =
     let caption =
           Html.h1 [ captionStyle ] [ Html.text "WolframAlpha in Elm" ]
      in
        Html.header [] [ caption ]
  in      
     Html.body [ bodyStyle ] [ header, body ]

initModel : Model
initModel = { input = "", output = Ok "", graphic = Nothing}

--- interaction with javascript ---

eventsFromJS : Signal Event 
eventsFromJS =
  let foo (info, s) =
        case info of
          "update" -> UpModel <| \model ->
                        case compute s of
                          Ok s' -> { model | input = s, output = Ok <| "$$" ++ s' ++ "$$" }
                          Err s' -> { model | input = s, output = Err s'}
          "graphicUpdate" -> UpModel <| \model ->
                               case updateGraphic s of
                                 (Nothing, g) -> { model | input = s, graphic = g }
                                 (Just s', _) -> { model | input = s, output = Err s', graphic = Nothing }
          _ -> Debug.crash "signalFromJS"
  in
  Signal.map foo signalFromJS

port signalFromJS : Signal (String, String)
                    
port signalToJS : Signal String
port signalToJS = btnMailbox.signal
                  
main : Signal Html
main = Signal.map view (Signal.foldp upstate initModel events)

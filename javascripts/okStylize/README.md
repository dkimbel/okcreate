# okStylize

*Styling for unstyleable form elements: checkboxes*

## Usage

See example.html

## Options

option           | default                | description
---------------- | ---------------------- | -------------
addClassStates   | true                   | Whether or not replaced elements will get additional UI information on hover, active, focus, blur etc.
disabledClass    | "disabled"             | Class added to the container when the input is disabled
activeClass      | "active"               | Class added to the container when the input is disabled
focusClass       | "focus"                | Class added to the container when the input is focused
hoverClass       | "hover"                | Class added to the container when the input is hovered over
className        | "styled"               | Class added to the containing element for all all replaced inputs
fileButtonHtml   | "Choose File"          | Text used for the file input's button
fileDefaultHtml  | "No file selected"     | Text used for an file input without a selected file
selectAutoGrow   | !!$.textMetrics        | Autogrow the select if the textMetrics plugin is available

## Notes

* If you want to dynamically enabled/disable inputs, just disable/enable them as
  normal and add/remove the disabledClass from the namespaced container element.

* Don't set the input to 'display:none' otherwise some browsers (IE) will ignore
  bound events

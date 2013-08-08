# okValidate

*okValidate uses HTML5 semantics and data attributes to ensure that valdiation is data-driven, with ONE canonical ruleset.* 

## Usage

    $("form").okValidate({...options...})

Depending on the attributes attached to a given input, the input will be
validated differently. For example, an input with a required attribute, will
trigger a validation error unless the field has a value (logically enough),
creating an input of type=email will validate the field as an email address etc.
See jquery.okValidate.rules for more details about attribute usage.

#### Note

When validating checkbox and radio groups you only _need_ to add validation
attributes to one input in the group. 

* Requires jQuery 1.7 or higher as this makes heavy use of deferreds.

#### Changelog

08/04/13 - Plugin rewrite. Support HTML5 attributes and move UI outside of core

## Options

options             | default                             | description
--------------------|-------------------------------------|--------------
ui                  | 'inline',                           | UI used for displaying error messages
validatingClass     | "validating",                       | Class added to input while it is being validated
errorClass          | "error",                            | Class added to input when it fails validation
validClass          | "valid",                            | Class added to input when it passes validation
errorElement        | "label",                            | Element used by the UI to append errors
defaultMessage      | "Please fix this field",            | Default error message
events              | { keyup : false, focusout : true }, | Determine whether or not a an event should trigger validations. Can be a boolean to always/never trigger or a function which returns a boolean.
onSubmit            | function(form){ form.submit(); }    | Called when a form is valid and the form submitted

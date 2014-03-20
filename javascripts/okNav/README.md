# okTabs

*Provides abstractions over several different types of in-page navigation.*

## Usage

The minimum requirements are:

* The tab interface must be made up of links. These links may or may not be container within an element. By default, it expects them to be list items.
* The anchors of the links must match the id of the content element that they correspond to. 

    $("#my_container").okTabs([options]); // Called on the navigation

You can also dynamically change the ui by using the refresh method


    var tabs = $("#my_container").okTabs();
    // Called without arguments, refreshes the current UI
    // Called with the name of a UI - changes the UI 
    // Called with false - unbinds events
    tabs.refresh('accordian');


## Options

option                | default                | description
--------------------- | ---------------------- | -------------
ui                    | 'tabs'                 | Which navigation UI to use
event                 | 'click'                | Which event will trigger a tab change
in                    | { effect: null }       | Defines the in transition. Takes standard options (e.g. duration, easing) in addition to an 'effect' which the other options will be applied to in order to create the desired effect.
out                   | { effect: null }       | Defines the out transition. Takes standard options (e.g. duration, easing) in addition to an 'effect' which the other options will be applied to in order to create the desired effect.
replaceHistory        | true,                  | If false, selecting will add hashchanges to the history
scroll                | false                  | False to disable, true to get the default (jumping) or an object of options to pass to the scrollto plugin plugin (https://github.com/balupton/jquery-scrollto) to smoothly scroll to the target element
activeClass           | 'active'               | className given to the currently selected tab
activeElementSelector | 'li'                   | Which element receives the active class
afterSetup            | function(){}           | Called after the plugin has bound to each tabbed interface
afterSelect           | function(){}           | Called whenever a tab change occurs
autoActivate          | true                   | Whether an element should activated if no elements have the activeClass set on init (only applicable to tabs)

## Notes

* Requires jQuery 1.7+. This is due to usage of `on`. You can replace this with `delegate` if you need it to run on < 1.7

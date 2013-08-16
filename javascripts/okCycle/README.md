# okCycle

*Tiny, modular, flexible slideshow* 

okCycle is an slideshow UI focused on modularity and ease of customization.
While I hate to reinvent the wheel for the Nth time, there are too many bloated
(but pretty!), spaghetti-code slideshows that only work well enough until you
step off their "golden path" and actually try to adapt it to your needs. What I
needed was a small plugin, with sensible defaults, that was easy customize. 

This is that.

## Usage

    $("#my_slideshow").okCycle();


### okCycle is made up of three components:

* *core* - Supplies the core functionality of the plugin. This is all you really need, but it doesn't do anything by itself.

* *transitions* - How we get from one slide to the next

* *ui* - Add useful things like, you know, user controls.

See each file for information on how to extend and write your own transitions/user interface elements.

### Lazy Loading

okCycle supports lazy loading of images. To enable this feature set the
`data-src` (name is configurable) attribute to the image src.

### Eager Loading

If you've elected to lazy load images, you can force okCycle to eager load
additional images by changing the eagerLoad option. The default forces the
plugin to wait until the first image has loaded before initialization will be
completed.


## Dependencies

 * jQuery imagesLoaded 

The image load event is an unreliable, and tricky beast. imagesLoaded paves over some of the quirks.

## Options

option           | default                            | description
---------------- | -----------------------------------|--------------
transition       | 'scroll'                           | Transition used to cycle between children
easing           | undefined                          | Easing used by the transition
ui               | []                                 | Any UI elements that we should build. Appended to the UI container source order
duration         | 2000                               | Time between animations
speed            | 300                                | Speed the children are transitioned between
dataAttribute    | "src"                              | Lazy load images by setting the dataAttribute (e.g. data-src) attribute rather than src attribute
eagerLoad        | 1                                  | During setup, force okCycle to N images before the slideshow is initialized. Set to 0 to load all images
autoplay         | false                              | Whether to start playing immediately. Provide a number (in milliseconds) to delay the inital start to the slideshow
hoverBehavior    | Function(slideshow)                | During autoplay, we'll generally want to pause the slideshow at some point. The default behavior is to pause when hovering the UI
afterSetup       | Function(slideshow)                | Called immediately after setup is performed
beforeMove       | Function(slideshow, transition)    | Called before moving to another slide
afterMove        | Function(slideshow, transition)    | Called after moving to another slide
onLoad           | Function(slideshow, imageData)     | Control how images are shown when loaded. Default is to hide the image until it is loaded and then fade in

## FAQ

* I want to use native CSS3 transitions rather than $.fn.animate. 

  Include [jquery.transit plugin](https://github.com/rstacruz/jquery.transit), 
  and okCycle will automatically take advantage of it.

* I want to control slideshows manually

  okCycle can control any number of slideshows simultaneously or independently:

      var slideshows = $(".slideshow").okCycle();

      slideshow.next(); // Every .slideshow element will move to the next slides

      var slideshows = $(".slideshow:first").okCycle();

      slideshow.next(); // Only the first .slideshow element will move to the next slides

## Notes

* As of v1.5, all built-in transitions work with responsive layouts

* Has been tested on jQuery 1.6.2 and higher

* As of version okCycle v1.2, jQuery v1.5 or higher is REQUIRED and >= v1.7 is SUGGESTED

* Although okCycle implements an autoplaying feature, as controls can exist anywhere on
  page, it may be necessary to rewrite the hoverBehavior function to take into
  account the position of your slideshow controls 

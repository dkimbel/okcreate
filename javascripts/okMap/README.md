# okMap

*Convience wrapper for Google Maps* 

## Usage

    var map  = $(".map").okMap(options);

You can manually control the map via the API (thanks isotope!)

    map.okMap('methodName', arguments);

## API

* `set` - Set the current set of places. Removes any existing places. Can either take multiple places as an argument list or an array of places
* `append` - Add one or more places. Can either take multiple places as an argument list or an array of places
* `remove` - Remove one or more places. Can either take multiple places as an argument list or an array of places. Called without args, removes all places
* `removeWithin` - Remove all places within a boundary
* `removeHidden` - Remove all places that aren't currently visible on the map
* `setLatLng` - Set a Google Map compatible latLng object based on either the places lat and lng properties or attempt to geocode the address. Returns a Deferred. You probably shouldn't need to use this
* `fit` - Ensure all places are visible
* `center` - Center the map around an arbitrary point

## Dependencies

 * Google Maps (derp)

## Options

option           | default                            | description
---------------- | -----------------------------------|--------------
events           | {}                                 | Specify marker events globally in event, handler pairs. Events can be one of 'click', 'dblclick', 'mouseup', 'mousedown', 'mouseover', 'mouseout'.
scope            | window                             | Object that event methods will be called on. Probably should not leave this as window - globals are bad mmkay?
autoFit          | true                               | Resize to fit when places are added or removed
keepZoom         | true                               | Used in conjunction with autoFit. Will keep current zoom level if the markers are already visible, otherwise will zoom to fit
maxZoom          | 15                                 | Used in conjunction with autoFit. If during autofit the map zooms in too far, it will be set to this level.
places           | []                                 | Initial list of places
whiney           | true                               | Whether or not failing geocoding logs the error
mapOptions       | {}                                 | Map options passed directly to the gmap instance

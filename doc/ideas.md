# Ideas

## Limit allowed first step types

Some steps don't really make sense in the first position, so shouldn't need to
write initializer code for them. e.g. R, Q, stereo.

## Zoom & pan

Zoom and pan with mouse.

## Adaptive camera distance

The rotation + scaling affect of the Q operator makes it seem appealing again.
Maybe can add a new GLSL uniform that hints to the vertex shader that it should
do a translation along the z-axis. This could work in concert with the possible
zoom and pan feature. The zoom level would feed into the magnitude and direction
of the translation.

## Code editor for pipe

_Now a work in progress_

Like with autocomplete and syntax highlighting and shit...

## Redo color

Make it a single input similar to pipe with its own grammar. Have the user
provide code that sets the values of builtin variables hue, saturation, and
value.

## Misc

- Link to the github repo in the overlay

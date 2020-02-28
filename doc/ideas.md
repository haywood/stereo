# Ideas

## Point size based on number of points

The more points on the sceen, the more likely they are to overlap, so it makes
sense to shrink them as the number grows large. Not sure if it needs to be
smooth though. Probably makes sense to do it based on order of magnitude (i.e.
log10(n)).

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

## Link to the github in the overlay

Duh...

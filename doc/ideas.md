# Ideas

## Code editing

- show description panel for the current argument when
  filling in step args

- display explanations of errors somewhere in the editor

- pop-up descriptions when mousing over tokens
  e.g.
    - show the description for Q when someone mouses over the Q
    - show where a variable assignment was made when mousing over it

## Redo color

Make it a single input similar to pipe with its own grammar. Have the user
provide code that sets the values of builtin variables hue, saturation, and
value.

## Sync input values with fragment

Currently, changes to the inputs affect the fragment. Changes to the fragment
should also affect the inputs.

In particular, when the fragment is updated via the forward and back buttons,
the inputs should also update.

May as well do it on any fragment change though.

Wait, maybe _when the fragment changes, just reload the whole page_, unless an
input has focus (which, again, is probably not possible)?

Tricky stuff:

- Shouldn't update the inputs if one of them is focused
  - this probably can't happen though, so wtf...
- What if the fragment is invalid?

## More detailed audio

- Expose powers for individual notes and/or chroma

Enables an effect like the following:

  - Assign hue using something like sin(2pi * i / n)

  - Assign value using something like cpower(i)
      ; cpower (chroma power) = power of chroma mod(i, abins) % nchroma

  - Assign saturation using something like 1 - opower(i)
      ; opower (octave power) = power of octave floor(mod(i, abins) / nchroma)

Then the points of each color will vary together with the intensity of their
associated note.

## Misc

- publish on push
- Update wiki with more info
  - section on thanks
    - feature ideas
      - chat with Alex
      - chats with Elliot
    - for graphics
      - https://threejs.org/
      - https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
      - chats with Elliot
      - chats with Thomas
    - for audio
      - https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
      - https://www.w3.org/TR/webaudio/
      - http://archive.gamedev.net/archive/reference/programming/features/beatdetection/
      - https://mziccard.me/2015/05/28/beats-detection-algorithms-1/
    - coffee & wifi
      - Revival

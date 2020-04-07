# Ideas

## Code editing

- show description panel for the current argument when
  filling in step args

- pop-up descriptions when mousing over tokens
  e.g.
    - show the description for Q when someone mouses over the Q
    - show where a variable assignment was made when mousing over a use

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

import { inputs } from '../inputs';

export const shortcuts = {
  ' '() {
    inputs.animate.value = !inputs.animate.value;
  },
  m: toggleAudio,
  M: toggleAudio,
  Enter() {
    inputs.fullscreen.value = !inputs.fullscreen.value;
  },
};

function toggleAudio() {
  inputs.mic.value = !inputs.mic.value;
}

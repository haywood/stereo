
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
requirejs(['exports', './constants-5f55962b'], function (exports, constants) { 'use strict';

  /**
   * This defines the placeholder used for power and chroma when audio is not enabled.
   */
  const AUDIO_PLACEHOLDER = {
      hue: 0.5,
      onset: 1,
      power: 1,
      pitch: 0.5,
      tempo: 0.5
  };
  const chromaCount = 12;
  const octaveMin = 0;
  const octaveMax = 8;
  const octaveCount = octaveMax - octaveMin;
  const quantumSize = 128;
  const binCount = octaveCount * chromaCount;

  const c0 = 16.35; // c0 per https://pages.mtu.edu/~suits/notefreqs.html
  class Spectrum {
      constructor(dbMin, dbMax) {
          this.dbMin = dbMin;
          this.dbMax = dbMax;
      }
  }
  Spectrum.octave = (k) => Math.floor(k / chromaCount);
  Spectrum.chroma = (k) => k % chromaCount;
  /**
   * Compute the frequency of bin k.
   */
  Spectrum.f = (k) => {
      constants.assert(0 <= k && k < binCount, `Spectrum.f: expected 0 <= k = ${k} < ${binCount}`);
      const octave = Spectrum.octave(k);
      const chroma = Spectrum.chroma(k);
      return c0 * Math.pow(2, (octave + chroma / chromaCount));
  };
  Spectrum.hue = (k) => {
      const chromaStep = 1 / chromaCount;
      const octaveStep = chromaStep / octaveCount;
      return chromaStep * Spectrum.chroma(k) + octaveStep * Spectrum.octave(k);
  };
  Spectrum.fmax = c0 * Math.pow(2, binCount);
  /**
   * Compute the relative pitch of bin k.
   */
  Spectrum.pitch = (k) => Spectrum.chroma(k) / (chromaCount - 1);

  exports.AUDIO_PLACEHOLDER = AUDIO_PLACEHOLDER;
  exports.Spectrum = Spectrum;
  exports.binCount = binCount;
  exports.quantumSize = quantumSize;

});
//# sourceMappingURL=spectrum-c3177c80.js.map

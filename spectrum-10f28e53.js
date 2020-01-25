
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
System.register(['./constants-c004b3f2.js'], function (exports) {
  'use strict';
  var assert;
  return {
    setters: [function (module) {
      assert = module.a;
    }],
    execute: function () {

      /**
       * This defines the placeholder used for power and chroma when audio is not enabled.
       */
      const AUDIO_PLACEHOLDER = exports('A', {
          hue: 0.5,
          onset: 1,
          power: 1,
          pitch: 0.5,
          tempo: 0.5
      });
      const chromaCount = 12;
      const octaveMin = 0;
      const octaveMax = 8;
      const octaveCount = octaveMax - octaveMin;
      const quantumSize = exports('q', 128);
      const binCount = exports('b', octaveCount * chromaCount);

      const c0 = 16.35; // c0 per https://pages.mtu.edu/~suits/notefreqs.html
      class Spectrum {
          constructor(dbMin, dbMax) {
              this.dbMin = dbMin;
              this.dbMax = dbMax;
          }
      } exports('S', Spectrum);
      Spectrum.octave = (k) => Math.floor(k / chromaCount);
      Spectrum.chroma = (k) => k % chromaCount;
      /**
       * Compute the frequency of bin k.
       */
      Spectrum.f = (k) => {
          assert(0 <= k && k < binCount, `Spectrum.f: expected 0 <= k = ${k} < ${binCount}`);
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

    }
  };
});
//# sourceMappingURL=spectrum-10f28e53.js.map

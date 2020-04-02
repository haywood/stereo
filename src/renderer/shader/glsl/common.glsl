#define zero(v) v = float[](0., 0., 0., 0., 0., 0., 0., 0., 0., 0.);

uniform float _t;
uniform float dpr;
uniform struct Audio {
  bool enabled;
  float power;
} audio;

varying float _i;

float power() {
  return audio.enabled ? audio.power : 0.;
}

float norm2(float[D_MAX] x) {
  float sum;
  for (int k = 0; k < D_MAX; k++) {
    sum += x[k] * x[k];
  }
  return sum;
}

float norm(float[D_MAX] x) {
  return sqrt(norm2(x));
}

float amix(float no_audio, float with_audio) {
  return audio.enabled ? with_audio : no_audio;
}

float log10(float x) {
  return log(x) / _ln10;
}

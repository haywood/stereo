#define zero(v) v = float[](0., 0., 0., 0., 0., 0., 0., 0., 0., 0.);
#define epsilon pow(2., -31.)

uniform float t;

uniform struct Audio {
  float power;
} audio;

varying float _i;

float power() {
  return audio.power;
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
  return mix(no_audio, with_audio, step(epsilon, power()));
}

float log10(float x) {
  return log(x) / ln10;
}

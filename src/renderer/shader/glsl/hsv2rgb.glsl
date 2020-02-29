// source: https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
vec3 hsv2rgb(float h, float s, float v) {
  h = max(0., min(360., h));
  s = max(0., min(1., s));
  v = max(0., min(1., v));

  float hprime = h / 60.;
  float c = v * s;
  float x = c * (1. - abs(mod(hprime, 2.) - 1.));
  float m = v - c;
  vec3 rgb;

  if (hprime <= 1.) {
    rgb = vec3(c, x, 0.);
  } else if (hprime <= 2.) {
    rgb = vec3(x, c, 0.);
  } else if (hprime <= 3.) {
    rgb = vec3(0., c, x);
  } else if (hprime <= 4.) {
    rgb = vec3(0., x, c);
  } else if (hprime <= 5.) {
    rgb = vec3(x, 0., c);
  } else if (hprime <= 6.) {
    rgb = vec3(c, 0., x);
  }

  rgb.x += m;
  rgb.y += m;
  rgb.z += m;

  return rgb;
}

// --- Atmosphere shader ----------------------------------------------------
// A slightly larger inverted sphere. The glow is strongest at the limb (high
// fresnel) and on the day side (facing the sun), giving a believable scatter.
// Kept as a hand-written vertex/fragment pair; because it's additive glow the
// exact colour pipeline matters little, and the bright limb is what the bloom
// pass latches onto.

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunDirection; // view space
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 normal = normalize(vNormal);
    // Backside sphere: fresnel peaks at the silhouette.
    float fresnel = pow(1.0 - abs(dot(normal, vViewDir)), 2.6);

    float sun = dot(normal, normalize(uSunDirection));
    float dayBias = smoothstep(-0.5, 0.5, sun) * 0.7 + 0.3;

    float alpha = clamp(fresnel * dayBias * uIntensity, 0.0, 1.0);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

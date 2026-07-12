"use client";

// Native WebGL2 port of the Shadertoy background (shadertoy.com/view/NcdGD8,
// visual pass only — the audio constants drive the beat-synced animation).
// Renders behind content; fails silently to the plain dark background.

import { useEffect, useRef } from "react";

const FRAG = `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
out vec4 fragColor_;

// ---- COMMON ----
#define BPM 98.0
#define TAU 6.28318530718

const float BEAT = 60.0/BPM;
const float BAR  = 4.0*BEAT;
const float LOOP = 16.0*BEAT;

const float MEL[32] = float[32](
    75.0, -1.0, -1.0, 72.0, -1.0, 70.0, -1.0, -1.0,
    -1.0, 67.0, -1.0, -1.0, 70.0, -1.0, -1.0, -1.0,
    72.0, -1.0, -1.0, 70.0, -1.0, 67.0, -1.0, 65.0,
    -1.0, -1.0, 67.0, -1.0, -1.0, -1.0, -1.0, -1.0
);

// ---- IMAGE ----
#define Rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
#define S(d) smoothstep(1.,-1., (d)/min(.05,fwidth(d)) )
#define B(p,s) max(abs(p).x-s.x,abs(p).y-s.y)
#define FLINE_THICK 0.02;

float kickEnv(float t){
    if(t < 0.0) return 0.0;
    return exp(-t*7.);
}

float bassEnv(float t, float dec){
    if(t < 0.0) return 0.0;
    return min(t*30.0, 1.0)*exp(-t*dec);
}

float random (vec2 p) {
    return fract(sin(dot(p.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

float hash21(vec2 p) {
    p = fract(p*vec2(234.56,789.34));
    p += dot(p,p+34.56);
    return fract(p.x+p.y);
}

vec2 hash22(vec2 p) {
    float x = hash21(p);
    float y = hash21(p + vec2(17.13, 9.71));
    return vec2(x,y);
}

vec2 valueNoise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);

    vec2 a = hash22(i) *2.0-1.0;
    vec2 b = hash22(i+vec2(1,0)) *2.0-1.0;
    vec2 c = hash22(i+vec2(0,1)) *2.0-1.0;
    vec2 d = hash22(i+vec2(1,1)) *2.0-1.0;

    vec2 ab = mix(a,b,u.x);
    vec2 cd = mix(c,d,u.x);
    return mix(ab,cd,u.y);
}

vec2 wander(float id, float t, float amp)
{
    vec2 off = vec2(0.0);
    float freq = 0.9;
    vec2 seed = vec2(id*17.13, id*9.71);
    vec2 samplePos = vec2(t*freq, 4.2) + seed;
    off += valueNoise2(samplePos) * amp;
    return off;
}

float lineTo(vec2 p, vec2 a, vec2 b, float val){
    float k = dot(p-a,b-a)/dot(b-a,b-a);
    vec2 closeTo = mix(a,b,clamp(k,0.,val));
    return distance(p,closeTo);
}

float cubicInOut(float t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : 0.5 * pow(2.0 * t - 2.0, 3.0) + 1.0;
}

vec2 leadState(float t){
    if(t < 0.0) return vec2(0.0, -1.0);
    float lt  = mod(t, LOOP);
    int   stp = int(lt/(0.5*BEAT));
    float n = -1.0, nt = 0.0;
    for(int k = 0; k < 6; k++){
        int s = stp - k;
        if(s < 0) break;
        if(MEL[s] >= 0.0){
            n  = MEL[s];
            nt = lt - float(s)*0.5*BEAT;
            break;
        }
    }
    if(n < 0.0) return vec2(0.0, -1.0);
    float env = min(nt*400.0, 1.0)*exp(-nt*5.0);
    return vec2(env, n);
}

float stripes(vec2 p){
    vec2 prevP = p;
    p*= Rot(radians(20.));
    p.x -=iTime*0.1;
    p.x = mod(p.x,0.05)-0.025;
    float d = abs(p.x)-0.005;
    p = prevP;
    p*= Rot(radians(45.));
    d = max(B(p,vec2(0.23)),d);
    return d;
}

float polyCircle(vec2 p, float r, float n){
    const int num = 10;
    float deg = 360. / float(num);
    float d = 10.;
    float amp = clamp(n, 0.5, 1.) * 0.05;

    vec2 verts[num];
    for (int i = 0; i < num; i++){
        float a = radians(deg * float(i));
        vec2 base = vec2(cos(a), sin(a)) * r;
        vec2 w = wander(float(i), n, amp);
        verts[i] = base + w;
    }

    for (int i = 0; i < num; i++){
        vec2 a = verts[i];
        vec2 b = verts[(i+1) % num];
        float d2 = lineTo(p, a, b, 1.) - 0.01;
        d = min(d, d2);
    }
    return d;
}

float c0(vec2 p){
    vec2 prevP = p;
    p.x = abs(p.x);
    float d = lineTo(p,vec2(0.1,0.2),vec2(0.1,-0.2),1.)-FLINE_THICK;
    p = prevP;
    p.y = abs(p.y);
    float d2 = lineTo(p,vec2(-0.1,0.2),vec2(0.1,0.2),1.)-FLINE_THICK;
    d = min(d,d2);
    return d;
}

float c1(vec2 p){
    float d = lineTo(p,vec2(0.0,0.2),vec2(0.0,-0.2),1.)-FLINE_THICK;
    return d;
}

float c2(vec2 p){
    vec2 prevP = p;
    p.y = abs(p.y);
    float d = lineTo(p,vec2(-0.1,0.2),vec2(0.1,0.2),1.)-FLINE_THICK;
    p = prevP;
    float d2 = lineTo(p,vec2(0.1,0.2),vec2(0.1,0.0),1.)-FLINE_THICK;
    d = min(d,d2);
    d2 = lineTo(p,vec2(-0.1,0.0),vec2(0.1,0.0),1.)-FLINE_THICK;
    d = min(d,d2);
    d2 = lineTo(p,vec2(-0.1,0.0),vec2(-0.1,-0.2),1.)-FLINE_THICK;
    d = min(d,d2);
    return d;
}

float c3(vec2 p){
    vec2 prevP = p;
    p.y = abs(p.y);
    float d = lineTo(p,vec2(-0.1,0.2),vec2(0.1,0.2),1.)-FLINE_THICK;
    p = prevP;
    float d2 = lineTo(p,vec2(0.1,0.2),vec2(0.1,-0.2),1.)-FLINE_THICK;
    d = min(d,d2);
    d2 = lineTo(p,vec2(-0.1,0.0),vec2(0.1,0.0),1.)-FLINE_THICK;
    d = min(d,d2);

    return d;
}

float c4(vec2 p){
    vec2 prevP = p;
    float d = lineTo(p,vec2(0.0,0.2),vec2(-0.1,-0.1),1.)-FLINE_THICK;
    p = prevP;
    float d2 = lineTo(p,vec2(0.05,0.1),vec2(0.05,-0.2),1.)-FLINE_THICK;
    d = min(d,d2);
    d2 = lineTo(p,vec2(-0.1,-0.1),vec2(0.1,-0.1),1.)-FLINE_THICK;
    d = min(d,d2);

    return d;
}

float c5(vec2 p){
    p.x*=-1.;
    float d = c2(p);
    return d;
}

float c6(vec2 p){
    vec2 prevP = p;
    p.y = abs(p.y);
    float d = lineTo(p,vec2(-0.1,0.2),vec2(0.1,0.2),1.)-FLINE_THICK;
    p = prevP;
    float d2 = lineTo(p,vec2(0.1,0.0),vec2(0.1,-0.2),1.)-FLINE_THICK;
    d = min(d,d2);
    d2 = lineTo(p,vec2(-0.1,0.0),vec2(0.1,0.0),1.)-FLINE_THICK;
    d = min(d,d2);
    d2 = lineTo(p,vec2(-0.1,0.2),vec2(-0.1,-0.2),1.)-FLINE_THICK;
    d = min(d,d2);
    return d;
}

float c7(vec2 p){
    vec2 prevP = p;
    float d = lineTo(p,vec2(-0.1,0.2),vec2(0.1,0.2),1.)-FLINE_THICK;
    p = prevP;
    float d2 = lineTo(p,vec2(0.1,0.2),vec2(0.,-0.2),1.)-FLINE_THICK;
    d = min(d,d2);

    return d;
}

float c8(vec2 p){
    vec2 prevP = p;
    p.x = abs(p.x);
    float d = lineTo(p,vec2(0.1,0.2),vec2(0.1,-0.2),1.)-FLINE_THICK;
    p = prevP;
    p.y = abs(p.y);
    float d2 = lineTo(p,vec2(-0.1,0.2),vec2(0.1,0.2),1.)-FLINE_THICK;
    d = min(d,d2);
    p = prevP;
    d2 = lineTo(p,vec2(-0.1,0.0),vec2(0.1,0.0),1.)-FLINE_THICK;
    d = min(d,d2);
    return d;
}

float c9(vec2 p){
    p*=-1.;
    return c6(p);
}

float renderNum(vec2 p, int num){
    float d = 10.;
    if(num == 0){
        d = c0(p);
    } else if(num == 1){
        d = c1(p);
    } else if(num == 2){
        d = c2(p);
    } else if(num == 3){
        d = c3(p);
    } else if(num == 4){
        d = c4(p);
    } else if(num == 5){
        d = c5(p);
    } else if(num == 6){
        d = c6(p);
    } else if(num == 7){
        d = c7(p);
    } else if(num == 8){
        d = c8(p);
    } else if(num == 9){
        d = c9(p);
    }
    return d;
}

float numbers(vec2 p, float speed){
    float d = renderNum(p-vec2(-0.3,0.),int(mod(2.*iTime*speed,10.)));
    float d2 = renderNum(p,int(mod(3.*iTime*speed,10.)));
    d = min(d,d2);
    d2 = renderNum(p-vec2(0.3,0.),int(mod(5.*iTime*speed,10.)));
    d = min(d,d2);
    return d;
}

vec3 renderVisual(vec2 p, vec3 col){
    float t = iTime;
    float lt = mod(t, LOOP);
    float bt = mod(lt, BAR);

    float dAmp = smoothstep(LOOP, LOOP + 0.05, t);
    float lAmp = smoothstep(2.0*LOOP, 2.0*LOOP + 0.05, t);

    float beat = 0.8*kickEnv(bt)
               + 0.7*kickEnv(bt - 2.0*BEAT)
               + 0.25*kickEnv(bt - 3.5*BEAT);
    beat *= dAmp;

    float bass = bassEnv(bt, 2.2)
               + 0.55*bassEnv(bt - 1.5*BEAT, 4.0)
               + 0.65*bassEnv(bt - 2.5*BEAT, 4.5);
    bass *= dAmp;

    vec2  ls  = leadState(t);
    float mel = ls.x * lAmp;
    float pitch = (ls.y >= 0.0) ? (ls.y - 65.0)/10.0 : 0.0;

    float duck = mix(1.0, 1.0 - 0.58*exp(-mod(bt, 2.0*BEAT)*7.0), dAmp);

    float angle = radians(-60.);
    float s = sin(angle);
    float c2 = cos(angle);
    float z  = 2.;
    mat3 rotationX = mat3(1., 0, 0., 0., c2, -s, 0., 0., z);

    mat3 modelMatrix = rotationX;

    vec3 transformedp = inverse(modelMatrix) * vec3(p, z);
    p = transformedp.xy / transformedp.z;

    p.x+=iTime*0.05;
    p*=5.;
    vec2 id = floor(p);
    vec2 gr = fract(p)-0.5;
    vec2 prevGr2 = gr;

    float thick = 0.01;
    vec2 a = vec2(-0.5,0.0);
    vec2 b = vec2(0.0,-0.5);

    vec2 c = vec2(0.5,0.0);
    vec2 dd = vec2(0.0,0.5);

    float r = 0.08;
    float n = random(id);
    if(n<0.5)gr.x*=-1.;
    prevGr2 = gr;

    float num = 7.;
    float speed = 3.+n;
    t = mod(iTime*speed,num);
    if(t<num*0.1){
        t = cubicInOut(t);
    } else {
        t = 1.-cubicInOut(t-(num*0.5));
    }

    float d = lineTo(gr,a,b,t)-thick;
    d = max(-(length(gr-a)-r),d);
    d = max(-(length(gr-b)-r),d);
    float d2 = lineTo(gr,c,dd,t)-thick;
    d2 = max(-(length(gr-c)-r),d2);
    d2 = max(-(length(gr-dd)-r),d2);
    d = min(d,d2);

    thick = 0.02;
    d2 = abs(length(gr-a)-r)-thick;
    d = min(d,d2);
    d2 = abs(length(gr-b)-r)-thick;
    d = min(d,d2);
    d2 = abs(length(gr-c)-r)-thick;
    d = min(d,d2);
    d2 = abs(length(gr-dd)-r)-thick;
    d = min(d,d2);

    thick = 0.01;
    r += n*0.2;
    float r2 = r+(0.08*mel*(0.8 + 0.4*pitch));
    if(n<0.5){
        if(n<0.2){
            d2 = abs(length(gr)-(r+(0.05*beat)))-thick;
        } else if(n>=0.2 && n<0.35){
            d2 = abs(length(gr)-(r+(0.05*bass)))-thick;
        } else if(n>=0.35){
            d2 = polyCircle(gr,r2,n*iTime*clamp(n,0.,0.5)*20.*duck);
        }
    }
    d = min(d,d2);

    if(n>=0.5 && n<0.7){
        d2 = stripes(gr);
    } else if(n>=0.7){
        gr*=Rot(radians(45.));
        gr *= 3.5;
        gr.x-=0.35;
        gr.y+=0.5;
        d2 = numbers(gr,n);
    }

    d = min(d,d2);

    gr = prevGr2;
    thick = 0.01;
    r = 0.08;
    float d3 = lineTo(gr,a,b,1.)-thick;
    d3 = max(-(length(gr-a)-r),d3);
    d3 = max(-(length(gr-b)-r),d3);
    float d4 = lineTo(gr,c,dd,1.)-thick;
    d4 = max(-(length(gr-c)-r),d4);
    d4 = max(-(length(gr-dd)-r),d4);
    d3 = min(d3,d4);
    col = mix(col,vec3(0.3),S(d3));

    col = mix(col,vec3(1.),S(d));

    float w =  length(fwidth(p));
    w*=1.2;
    float aa = 1.-smoothstep(-w, w, d);

    col = mix(col,vec3(1.),aa);
    return col*duck;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord-0.5*iResolution.xy)/iResolution.y;

    vec3 col = vec3(0.);
    col = renderVisual(uv,col);
    fragColor = vec4(col,1.0);
}

void main(){
    mainImage(fragColor_, gl_FragCoord.xy);
}
`;

const VERT = `#version 300 es
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export function ShaderBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) return; // no WebGL2 -> plain background

    function compile(type: number, src: string): WebGLShader | null {
      const sh = gl!.createShader(type);
      if (!sh) return null;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
        console.error("shader compile:", gl!.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("shader link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);
    const uRes = gl.getUniformLocation(prog, "iResolution");
    const uTime = gl.getUniformLocation(prog, "iTime");

    let raf = 0;
    const start = performance.now();

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(c.clientWidth * dpr);
      const h = Math.floor(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    }

    function frame(now: number) {
      const c = canvasRef.current;
      if (!c || !gl) return;
      resize();
      gl.viewport(0, 0, c.width, c.height);
      gl.uniform3f(uRes, c.width, c.height, 1);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={
        className ??
        "pointer-events-none absolute inset-0 h-full w-full opacity-30 [filter:sepia(1)_hue-rotate(320deg)_saturate(2)_brightness(0.8)]"
      }
    />
  );
}

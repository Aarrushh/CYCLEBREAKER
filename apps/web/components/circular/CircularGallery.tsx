"use client";

import { useEffect, useRef } from 'react';
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import styles from './CircularGallery.module.css';

type Item = { image: string; text: string };

function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: any;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(undefined, args), wait);
  } as T;
}

function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t;
}

function createTextTexture(gl: any, text: string, font = 'bold 30px Inter', color = 'white') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(parseInt(font, 10) * 1.2);
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas as any;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  mesh!: any;
  gl: any;
  plane: any;
  renderer: any;
  text: string;
  textColor: string;
  font: string;
  constructor({ gl, plane, renderer, text, textColor = '#ffffff', font = 'bold 30px Inter' }: any) {
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }
  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture as any } },
      transparent: true,
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = (this.plane as any).scale.y * 0.15;
    const textWidth = textHeight * aspect;
    (this.mesh as any).scale.set(textWidth, textHeight, 1);
    (this.mesh as any).position.y = -(this.plane as any).scale.y * 0.5 - textHeight * 0.5 - 0.05;
    (this.mesh as any).setParent(this.plane as any);
  }
}

class Media {
  geometry: any; gl: any; image!: string; index!: number; length!: number; renderer: any; scene: any; screen: any; text!: string; viewport: any; bend!: number; textColor!: string; borderRadius!: number; font!: string;
  program: any; plane: any; title: any; scale: number = 1; padding = 2; width = 0; widthTotal = 0; x = 0; extra = 0; speed = 0; isBefore = false; isAfter = false;
  constructor(opts: any) {
    Object.assign(this, opts);
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }
  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
      },
      transparent: true,
    });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      (texture as any).image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }
  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }
  createTitle() {
    this.title = new Title({ gl: this.gl, plane: this.plane, renderer: this.renderer, text: this.text, textColor: this.textColor, font: this.font });
  }
  update(scroll: any, direction: 'left' | 'right') {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;
    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }
    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }
  onResize({ screen, viewport }: any = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  container: HTMLElement;
  renderer!: any; gl!: any; camera: any; scene: any; planeGeometry: any; screen: any; viewport: any; medias: Media[] = []; mediasImages: Item[] = [];
  scroll = { ease: 0.05, current: 0, target: 0, last: 0 };
  onCheckDebounce: any; raf: number | undefined; scrollSpeed = 2;
  boundOnResize!: any; boundOnWheel!: any; boundOnTouchDown!: any; boundOnTouchMove!: any; boundOnTouchUp!: any;
  constructor(container: HTMLElement, { items, bend, textColor = '#ffffff', borderRadius = 0.05, font = 'bold 30px Inter', scrollSpeed = 2, scrollEase = 0.05 }: any = {}) {
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll.ease = scrollEase;
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
  }
  createRenderer() {
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) }) as any;
    this.gl = (this.renderer as any).gl;
    (this.gl as any).clearColor(0, 0, 0, 0);
    const canvas = (this.gl as any).canvas as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true');
    this.container.appendChild(canvas);
  }
  createCamera() {
    this.camera = new (Camera as any)(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }
  createScene() { this.scene = new Transform(); }
  createGeometry() { this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 }); }
  createMedias(items?: Item[], bend = 1, textColor?: string, borderRadius?: number, font?: string) {
    const galleryItems: Item[] = (items && items.length) ? items : [
      { image: `https://picsum.photos/seed/jobs/800/600?grayscale`, text: 'Jobs' },
      { image: `https://picsum.photos/seed/grants/800/600?grayscale`, text: 'Grants' },
      { image: `https://picsum.photos/seed/training/800/600?grayscale`, text: 'Training' },
      { image: `https://picsum.photos/seed/savings/800/600?grayscale`, text: 'Savings' },
      { image: `https://picsum.photos/seed/services/800/600?grayscale`, text: 'Services' },
    ];
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => new Media({
      geometry: this.planeGeometry,
      gl: this.gl,
      image: data.image,
      index,
      length: this.mediasImages.length,
      renderer: this.renderer,
      scene: this.scene,
      screen: this.screen,
      text: data.text,
      viewport: this.viewport,
      bend,
      textColor,
      borderRadius,
      font,
    }));
  }
  onTouchDown(e: any) {
    (this as any).isDown = true;
    (this.scroll as any).position = this.scroll.current;
    (this as any).start = e.touches ? e.touches[0].clientX : e.clientX;
  }
  onTouchMove(e: any) {
    if (!(this as any).isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = ((this as any).start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = (this.scroll as any).position + distance;
  }
  onTouchUp() { (this as any).isDown = false; this.onCheck(); }
  onWheel(e: any) {
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }
  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }
  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
    (this.renderer as any).setSize(this.screen.width, this.screen.height);
    (this.camera as any).perspective({ aspect: this.screen.width / this.screen.height });
    const fov = ((this.camera as any).fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * (this.camera as any).position.z;
    const width = height * (this.camera as any).aspect;
    this.viewport = { width, height };
    if (this.medias) this.medias.forEach((m) => m.onResize({ screen: this.screen, viewport: this.viewport }));
  }
  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) this.medias.forEach((m) => m.update(this.scroll, direction as any));
    (this.renderer as any).render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this) as any;
    this.boundOnWheel = this.onWheel.bind(this) as any;
    this.boundOnTouchDown = this.onTouchDown.bind(this) as any;
    this.boundOnTouchMove = this.onTouchMove.bind(this) as any;
    this.boundOnTouchUp = this.onTouchUp.bind(this) as any;
    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('wheel', this.boundOnWheel);
    window.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    window.addEventListener('touchstart', this.boundOnTouchDown, { passive: true } as any);
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true } as any);
    window.addEventListener('touchend', this.boundOnTouchUp);
  }
  destroy() {
    if (this.raf) window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    window.removeEventListener('wheel', this.boundOnWheel);
    window.removeEventListener('mousedown', this.boundOnTouchDown);
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    window.removeEventListener('touchstart', this.boundOnTouchDown);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchUp);
    const canvas = (this.renderer as any)?.gl?.canvas as HTMLCanvasElement | undefined;
    if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
  }
}

export default function CircularGallery({ items, bend = 3, textColor = '#ffffff', borderRadius = 0.05, font = 'bold 30px Inter', scrollSpeed = 2, scrollEase = 0.05 }: { items?: Item[]; bend?: number; textColor?: string; borderRadius?: number; font?: string; scrollSpeed?: number; scrollEase?: number; }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!ref.current) return;
    let app: App | null = null;
    try {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      app = new App(ref.current, { items, bend, textColor, borderRadius, font, scrollSpeed: prefersReducedMotion ? 0.5 : scrollSpeed, scrollEase: prefersReducedMotion ? 0.02 : scrollEase });
    } catch (e) {
      console.warn('[CircularGallery] init failed', e);
    }
    return () => { app?.destroy(); };
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase]);
  return <div className={styles.circularGallery} ref={ref} />;
}

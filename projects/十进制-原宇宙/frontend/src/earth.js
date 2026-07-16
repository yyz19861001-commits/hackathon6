import * as THREE from 'three';

/**
 * OriginVerse Earth - Three.js 3D globe with atmosphere
 */
export class Earth {
  constructor(scene) {
    this.scene = scene;
    this.rotationSpeed = 0.0008;

    this._createGlobe();
    this._createAtmosphere();
    this._createStars();
    this._createGrid();
  }

  _createGlobe() {
    const geometry = new THREE.SphereGeometry(5, 64, 64);
    const textureLoader = new THREE.TextureLoader();

    // Use procedural earth texture
    const canvas = this._generateEarthTexture();
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpScale: 0.02,
      specular: new THREE.Color(0x333333),
      specularMap: texture,
      shininess: 10,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  _generateEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Ocean base
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.3, '#0d2b4a');
    gradient.addColorStop(0.5, '#0f3460');
    gradient.addColorStop(0.7, '#0d2b4a');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simplified continents (approximate lat/lng to canvas coords)
    const continents = [
      // North America
      { x: 0.17, y: 0.32, w: 0.12, h: 0.20 },
      { x: 0.15, y: 0.35, w: 0.08, h: 0.12 },
      // South America
      { x: 0.24, y: 0.58, w: 0.07, h: 0.20 },
      // Europe
      { x: 0.45, y: 0.30, w: 0.10, h: 0.10 },
      // Africa
      { x: 0.47, y: 0.45, w: 0.12, h: 0.28 },
      // Asia
      { x: 0.55, y: 0.22, w: 0.28, h: 0.22 },
      { x: 0.60, y: 0.40, w: 0.20, h: 0.15 },
      // Australia
      { x: 0.82, y: 0.60, w: 0.08, h: 0.08 },
      // Greenland
      { x: 0.30, y: 0.12, w: 0.06, h: 0.08 },
    ];

    ctx.fillStyle = '#1a3a2a';
    for (const c of continents) {
      ctx.beginPath();
      const cx = c.x * canvas.width;
      const cy = c.y * canvas.height;
      const cw = c.w * canvas.width;
      const ch = c.h * canvas.height;
      ctx.ellipse(cx + cw/2, cy + ch/2, cw/2, ch/2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Brighter land details
    ctx.fillStyle = '#2a5a3a';
    for (const c of continents) {
      ctx.beginPath();
      const cx = c.x * canvas.width;
      const cy = c.y * canvas.height;
      const cw = c.w * canvas.width * 0.6;
      const ch = c.h * canvas.height * 0.6;
      ctx.ellipse(cx + c.w * canvas.width / 2, cy + c.h * canvas.height / 2, cw/2, ch/2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = (90 - lat) / 180 * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (let lng = 0; lng < 360; lng += 30) {
      const x = lng / 360 * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    return canvas;
  }

  _createAtmosphere() {
    const geometry = new THREE.SphereGeometry(5.1, 48, 48);
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(0.6 - dot(vNormal, viewDir), 3.0);
          intensity = clamp(intensity, 0.0, 1.0);
          gl_FragColor = vec4(0.2, 0.6, 1.0, intensity * 0.4);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.atmosphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.atmosphere);
  }

  _createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;

      sizes[i] = 0.3 + Math.random() * 1.0;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }

  _createGrid() {
    const gridHelper = new THREE.GridHelper(20, 20, 0x0066ff, 0x0033aa);
    gridHelper.position.y = -6;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.15;
    this.scene.add(gridHelper);
  }

  update() {
    this.mesh.rotation.y += this.rotationSpeed;
    this.atmosphere.rotation.y += this.rotationSpeed;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.atmosphere);
    this.scene.remove(this.stars);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.atmosphere.geometry.dispose();
    this.atmosphere.material.dispose();
    this.stars.geometry.dispose();
    this.stars.material.dispose();
  }
}

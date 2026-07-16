import * as THREE from 'three';

/**
 * OriginVerse Earth - Three.js 3D globe with atmosphere
 * Uses a real NASA Blue Marble texture with procedural fallback
 */
export class Earth {
  constructor(scene) {
    this.scene = scene;
    this.rotationSpeed = 0.0008;
    this.ready = false;

    this._createGlobe();
    this._createAtmosphere();
    this._createStars();
    this._createGrid();
  }

  _createGlobe() {
    const geometry = new THREE.SphereGeometry(5, 80, 80);
    const textureLoader = new THREE.TextureLoader();

    // Public domain Earth texture URLs (fallback chain)
    const textureUrls = [
      'https://unpkg.com/three-globe@2.24.8/example/img/earth-blue-marble.jpg',
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
    ];

    const material = new THREE.MeshPhongMaterial({
      color: 0x1a4466,
      bumpScale: 0.02,
      specular: new THREE.Color(0x4488aa),
      shininess: 15,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    // Try loading real textures
    this._loadTexture(textureUrls, 0, material);
  }

  _loadTexture(urls, index, material) {
    if (index >= urls.length) {
      // All URLs failed, fall back to procedural
      console.warn('[Earth] All texture URLs failed, using procedural texture');
      material.map = new THREE.CanvasTexture(this._generateFallbackTexture());
      material.color.set(0xffffff);
      material.needsUpdate = true;
      this.ready = true;
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      urls[index],
      (texture) => {
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
        this.ready = true;
        console.log(`[Earth] Loaded texture from ${urls[index]}`);
      },
      undefined,
      () => {
        // Failed, try next URL
        console.warn(`[Earth] Failed to load ${urls[index]}, trying next...`);
        this._loadTexture(urls, index + 1, material);
      }
    );
  }

  _generateFallbackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark ocean base
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.3, '#0d2b4a');
    gradient.addColorStop(0.5, '#0f3460');
    gradient.addColorStop(0.7, '#0d2b4a');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // High-quality continent paths (equirectangular projection)
    const continentPaths = [
      // North America (detailed)
      'M120,80 L140,70 L170,72 L195,80 L210,90 L205,110 L220,120 L225,135 L210,140 L200,130 L185,125 L170,120 L150,115 L130,110 Z',
      // Central America
      'M195,140 L210,140 L215,150 L210,160 L200,155 L195,148 Z',
      // South America
      'M200,165 L230,160 L255,170 L260,190 L250,210 L240,230 L225,250 L210,255 L200,240 L205,220 L195,200 L190,185 Z',
      // Europe (Western)
      'M435,100 L455,95 L470,100 L480,110 L475,125 L460,130 L445,125 L435,115 Z',
      // British Isles
      'M425,100 L432,98 L435,105 L428,108 Z',
      // Scandinavia
      'M470,75 L485,70 L495,80 L490,95 L475,95 L468,85 Z',
      // Africa
      'M445,145 L480,140 L515,145 L530,160 L525,185 L510,205 L490,215 L475,210 L460,200 L450,180 L440,160 Z',
      // Madagascar
      'M540,190 L548,192 L550,205 L542,208 Z',
      // Russia / Northern Asia
      'M520,75 L560,70 L620,72 L680,78 L730,85 L740,100 L730,115 L710,120 L680,115 L650,105 L620,100 L580,95 L540,90 L520,85 Z',
      // China / East Asia
      'M610,110 L650,105 L690,108 L720,115 L725,130 L710,140 L680,145 L650,140 L630,130 L615,120 Z',
      // India
      'M640,140 L665,138 L680,145 L678,160 L660,170 L645,165 L635,155 Z',
      // Southeast Asia
      'M700,145 L725,148 L740,155 L735,170 L720,175 L705,168 L695,158 Z',
      // Indonesia / Archipelago
      'M740,170 L765,168 L780,174 L775,182 L760,184 L745,180 Z',
      'M780,178 L795,180 L800,186 L790,190 Z',
      // Japan
      'M755,90 L762,88 L766,95 L763,105 L758,108 L752,100 Z',
      // Australia
      'M810,210 L865,205 L890,218 L888,240 L870,255 L840,258 L815,248 L805,230 Z',
      // New Zealand
      'M910,232 L916,230 L920,240 L918,248 L912,250 Z',
      // Greenland
      'M300,45 L330,40 L355,45 L360,60 L350,75 L330,78 L310,72 L298,60 Z',
      // Middle East
      'M570,135 L600,130 L620,138 L615,150 L595,155 L575,150 L568,142 Z',
      // Arabian Peninsula
      'M585,150 L615,148 L630,158 L628,170 L610,175 L590,170 L580,162 Z',
    ];

    // Draw land masses
    ctx.fillStyle = '#1a4a2a';
    for (const path of continentPaths) {
      const p = new Path2D(path);
      ctx.fill(p);
    }

    // Brighter inner land
    ctx.fillStyle = '#2a6a3a';
    for (const path of continentPaths) {
      const p = new Path2D(path);
      ctx.save();
      ctx.translate(3, 3);
      ctx.scale(0.85, 0.85);
      ctx.fill(p);
      ctx.restore();
    }

    // Subtle latitude/longitude grid
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.04)';
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

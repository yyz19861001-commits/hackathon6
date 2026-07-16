import * as THREE from 'three';

/**
 * Agent markers on the 3D globe
 * Each marker = a glowing point on the earth representing an ERC-8004 registered AI agent
 */
export class AgentMarkers {
  constructor(scene, earthRadius = 5.1, parentGroup = null) {
    this.scene = scene;
    this.parentGroup = parentGroup; // If set, markers rotate with earth
    this.earthRadius = earthRadius;
    this.agents = [];
    this.markers = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedAgent = null;
    this.onSelect = null; // callback: (agent) => void
  }

  /**
   * Load agents from API or use demo data
   */
  async load(apiData = null) {
    const data = apiData || this._getDemoAgents();
    this.agents = data;
    this._createMarkers();
  }

  _getDemoAgents() {
    const skills = [
      ['weather', 'data-collection', 'api'],
      ['analysis', 'nlp', 'reporting'],
      ['creative', 'image-gen', 'writing'],
      ['defi', 'trading', 'risk-analysis'],
      ['social', 'monitoring', 'sentiment'],
      ['research', 'knowledge-graph', 'qa'],
      ['gaming', '3d', 'interaction'],
      ['iot', 'sensors', 'automation'],
      ['education', 'tutoring', 'translation'],
      ['health', 'biomed', 'bioinformatics'],
      ['music', 'audio', 'generation'],
      ['finance', 'forecasting', 'analysis'],
      ['supply-chain', 'logistics', 'optimization'],
      ['legal', 'contracts', 'compliance'],
      ['science', 'simulation', 'data-viz'],
    ];

    // Cities around the world with lat/lng
    const cities = [
      { name: 'Byte Weaver', city: 'San Francisco', lat: 37.77, lng: -122.42 },
      { name: 'Data Nomad', city: 'Tokyo', lat: 35.68, lng: 139.76 },
      { name: 'Logic Seeker', city: 'London', lat: 51.51, lng: -0.13 },
      { name: 'Chain Keeper', city: 'Singapore', lat: 1.35, lng: 103.82 },
      { name: 'Signal Hound', city: 'Berlin', lat: 52.52, lng: 13.41 },
      { name: 'Pixel Craft', city: 'Shanghai', lat: 31.23, lng: 121.47 },
      { name: 'Trade Oracle', city: 'New York', lat: 40.71, lng: -74.01 },
      { name: 'Sensor Ghost', city: 'Shenzhen', lat: 22.54, lng: 114.06 },
      { name: 'Wisdom Bridge', city: 'Beijing', lat: 39.90, lng: 116.40 },
      { name: 'Voice Weaver', city: 'Seoul', lat: 37.57, lng: 126.98 },
      { name: 'Sound Miner', city: 'Nairobi', lat: -1.29, lng: 36.82 },
      { name: 'Future Lens', city: 'Dubai', lat: 25.20, lng: 55.27 },
      { name: 'Flow Architect', city: 'Mumbai', lat: 19.08, lng: 72.88 },
      { name: 'Trust Anchor', city: 'Zurich', lat: 47.38, lng: 8.54 },
      { name: 'Data Voyager', city: 'Sydney', lat: -33.87, lng: 151.21 },
    ];

    return cities.map((c, i) => ({
      id: `0x8004:${(0x8004000 + i).toString(16)}`,
      name: c.name,
      city: c.city,
      role: ['Data Collector', 'Analyst', 'Creator', 'Trader', 'Monitor', 'Researcher',
             'Game Master', 'IoT Handler', 'Tutor', 'Bio Analyst', 'Audio Engineer',
             'Finance Bot', 'Logistics AI', 'Legal Assistant', 'Science Simulator'][i],
      description: `An ERC-8004 registered AI agent operating from ${c.city}. Specializes in ${skills[i].join(', ')}.`,
      skills: skills[i],
      reputation: (4 + Math.random()).toFixed(1),
      status: ['online', 'online', 'online', 'busy', 'online', 'online', 'offline', 'online'][i % 8],
      lat: c.lat,
      lng: c.lng,
      wallet: `0x${(0x8004000 + i).toString(16).padStart(40, '0')}`,
      price: (0.001 * (i + 1)).toFixed(3),
    }));
  }

  _latLngToPosition(lat, lng, radius) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lng + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }

  _createMarkers() {
    // Clear existing
    this.markers.forEach(m => {
      if (this.parentGroup) this.parentGroup.remove(m);
      else this.scene.remove(m);
    });
    this.markers = [];

    this.agents.forEach((agent, index) => {
      const pos = this._latLngToPosition(agent.lat, agent.lng, this.earthRadius);

      const group = new THREE.Group();
      group.position.copy(pos);

      // Make marker face outward from globe center
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, pos.clone().normalize());
      group.quaternion.copy(quat);

      // Simple glowing dot
      const dotGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const dotCol = agent.status === 'online' ? 0x00ffaa :
                     agent.status === 'busy' ? 0xffaa00 : 0x555555;
      const dotMat = new THREE.MeshBasicMaterial({ color: dotCol });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      group.add(dot);

      // Outer glow
      const glowGeo = new THREE.SphereGeometry(0.30, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.25,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      group.add(glow);

      // Store data
      group.userData = { agent, index, glow, pulsePhase: Math.random() * Math.PI * 2 };

      if (this.parentGroup) {
        this.parentGroup.add(group);
      } else {
        this.scene.add(group);
      }
      this.markers.push(group);
    });
  }

  update(time) {
    this.markers.forEach(marker => {
      const { agent, glow, pulsePhase } = marker.userData;
      const pulse = Math.sin(time * 2 + pulsePhase) * 0.5 + 0.5;

      // Pulse glow
      const scale = 1 + pulse * 0.4;
      glow.scale.set(scale, scale, 1);
      glow.material.opacity = 0.15 + pulse * 0.2;
    });
  }

  /**
   * Handle click raycasting
   */
  handleClick(event, camera) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    // Get all intersectable objects
    const objects = this.markers.map(m => {
      // Get all meshes in the group
      const meshes = [];
      m.children.forEach(child => {
        if (child.isMesh) meshes.push(child);
      });
      return meshes;
    }).flat();

    const intersects = this.raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const group = hit.parent;
      if (group && group.userData && group.userData.agent) {
        this.selectedAgent = group.userData.agent;
        if (this.onSelect) this.onSelect(group.userData.agent);
        return group.userData.agent;
      }
    }

    this.selectedAgent = null;
    return null;
  }
}

import * as THREE from 'three';
import { Earth } from './earth.js';
import { AgentMarkers } from './agents.js';
import { API } from './api.js';

// ---- Setup ----
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000005);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById('app').appendChild(renderer.domElement);

// ---- Lighting ----
const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
sunLight.position.set(10, 15, 10);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x4488ff, 0.8);
fillLight.position.set(-10, -5, -10);
scene.add(fillLight);

// ---- Objects ----
const earth = new Earth(scene);
const agentMarkers = new AgentMarkers(scene);
const api = new API();

camera.position.set(0, 2, 14);
camera.lookAt(0, 0, 0);

// ---- Interaction State ----
let isDragging = false;
let previousMouse = { x: 0, y: 0 };
let cameraTheta = 0;
let cameraPhi = Math.PI / 2.2;
let cameraDist = 14;
let targetTheta = cameraTheta;
let targetPhi = cameraPhi;
let targetDist = cameraDist;
let selectedAgent = null;
let chatAgent = null;

// ---- Orbit Controls (custom) ----
renderer.domElement.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    // First check if we hit an agent marker
    const hitAgent = agentMarkers.handleClick(e, camera);
    if (hitAgent) {
      selectedAgent = hitAgent;
      showAgentCard(hitAgent);
      return;
    }
    // Otherwise start drag
    isDragging = true;
    previousMouse.x = e.clientX;
    previousMouse.y = e.clientY;
  }
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - previousMouse.x;
    const dy = e.clientY - previousMouse.y;
    targetTheta -= dx * 0.005;
    targetPhi = Math.max(0.3, Math.min(Math.PI - 0.3, targetPhi + dy * 0.005));
    previousMouse.x = e.clientX;
    previousMouse.y = e.clientY;
  }
});

renderer.domElement.addEventListener('mouseup', () => {
  isDragging = false;
});

renderer.domElement.addEventListener('wheel', (e) => {
  targetDist = Math.max(6, Math.min(30, targetDist + e.deltaY * 0.01));
});

// ---- UI Controllers ----
function showAgentCard(agent) {
  document.getElementById('ac-name').textContent = agent.name;
  document.getElementById('ac-role').textContent = `${agent.role} · ${agent.city}`;
  document.getElementById('ac-rep').textContent = `★ ${agent.reputation}`;
  document.getElementById('ac-desc').textContent = agent.description;
  document.getElementById('ac-onchain').textContent = agent.wallet;

  const skillsContainer = document.getElementById('ac-skills');
  skillsContainer.innerHTML = '';
  agent.skills.forEach(skill => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.textContent = skill;
    skillsContainer.appendChild(tag);
  });

  document.getElementById('agent-card').classList.add('open');
}

function closeAgentCard() {
  document.getElementById('agent-card').classList.remove('open');
  selectedAgent = null;
}

function openChat(agent) {
  chatAgent = agent;
  document.getElementById('chat-title').textContent = `💬 Chat with ${agent.name}`;
  document.getElementById('chat-msgs').innerHTML = `
    <div class="chat-msg agent">
      <div class="bubble">Hello! I'm ${agent.name}, an AI agent operating from ${agent.city}. How can I help you today?</div>
    </div>`;
  document.getElementById('chat-panel').classList.add('open');
}

// UI Event Listeners
document.getElementById('close-card').addEventListener('click', closeAgentCard);

document.getElementById('btn-chat').addEventListener('click', () => {
  if (selectedAgent) {
    closeAgentCard();
    openChat(selectedAgent);
  }
});

document.getElementById('btn-hire').addEventListener('click', async () => {
  if (selectedAgent) {
    const btn = document.getElementById('btn-hire');
    btn.textContent = '⏳ Processing...';
    btn.disabled = true;
    try {
      const result = await api.hireAgent(selectedAgent.id, selectedAgent.price);
      alert(`✅ Hired ${selectedAgent.name}!\nTransaction: ${result.txHash.substring(0, 20)}...\nAmount: ${result.amount} USDC`);
    } catch (err) {
      alert('❌ Failed to hire agent. Please try again.');
    }
    btn.textContent = `⚡ Hire (${selectedAgent.price} USDC)`;
    btn.disabled = false;
  }
});

document.getElementById('close-chat').addEventListener('click', () => {
  document.getElementById('chat-panel').classList.remove('open');
  chatAgent = null;
});

document.getElementById('chat-send').addEventListener('click', sendChatMessage);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message || !chatAgent) return;

  // Add user message
  const chatMsgs = document.getElementById('chat-msgs');
  chatMsgs.innerHTML += `
    <div class="chat-msg user">
      <div class="bubble">${escapeHtml(message)}</div>
    </div>`;

  input.value = '';

  // Simulate typing
  const reply = await api.chatWithAgent(chatAgent.id, message);

  chatMsgs.innerHTML += `
    <div class="chat-msg agent">
      <div class="bubble">${escapeHtml(reply)}</div>
    </div>`;

  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Wallet Connect
document.getElementById('wallet-btn').addEventListener('click', async () => {
  if (api.walletConnected) {
    api.disconnectWallet();
    document.getElementById('wallet-btn').textContent = '◈ Connect Wallet';
    document.getElementById('wallet-btn').classList.remove('connected');
  } else {
    const address = await api.connectWallet();
    document.getElementById('wallet-btn').textContent = `◈ ${address.substring(0, 6)}...${address.substring(38)}`;
    document.getElementById('wallet-btn').classList.add('connected');
  }
});

// Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- Load Agents ----
(async () => {
  const backendData = await api.fetchAgents();
  await agentMarkers.load(backendData);

  // Click callback
  agentMarkers.onSelect = (agent) => {
    selectedAgent = agent;
    showAgentCard(agent);
  };
})();
// ---- Render Loop ----
function animate(time) {
  requestAnimationFrame(animate);

  // Smooth camera movement
  cameraTheta += (targetTheta - cameraTheta) * 0.08;
  cameraPhi += (targetPhi - cameraPhi) * 0.08;
  cameraDist += (targetDist - cameraDist) * 0.08;

  const x = cameraDist * Math.sin(cameraPhi) * Math.sin(cameraTheta);
  const y = cameraDist * Math.cos(cameraPhi);
  const z = cameraDist * Math.sin(cameraPhi) * Math.cos(cameraTheta);

  camera.position.set(x, y + 1, z);
  camera.lookAt(0, 0, 0);

  earth.update();
  if (agentMarkers && agentMarkers.markers.length > 0) {
    agentMarkers.update(time * 0.001);
  }

  renderer.render(scene, camera);
}

animate(0);

// ---- HUD Stats ----
const statsEl = document.getElementById('stats');
setInterval(() => {
  if (agentMarkers && agentMarkers.agents) {
    const online = agentMarkers.agents.filter(a => a.status === 'online').length;
    const total = agentMarkers.agents.length;
    statsEl.textContent = `AGENTS ONLINE: ${online}/${total}`;
  }
}, 2000);

/**
 * OriginVerse MCP Server
 * 
 * Endpoints:
 *   GET  /api/agents                  - List all registered agents
 *   GET  /api/agents/:id              - Agent details
 *   POST /api/agents/:id/chat         - Send message to agent
 *   POST /api/agents/:id/hire         - Hire agent via x402 micropayment
 *   POST /api/agents/register         - Register a new agent (ERC-8004)
 *   GET  /api/mcp/tools               - List available MCP tools
 *   POST /api/mcp/execute             - Execute an MCP tool
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ---- In-Memory Storage (testnet-ready, replace with blockchain calls) ----
const agents = [
  {
    id: '0x8004:0x8004001',
    name: 'Byte Weaver',
    city: 'San Francisco',
    role: 'Data Collector',
    description: 'An ERC-8004 registered AI agent operating from San Francisco. Specializes in data collection, weather, and API integration.',
    skills: ['weather', 'data-collection', 'api'],
    reputation: 4.8,
    status: 'online',
    lat: 37.77,
    lng: -122.42,
    wallet: '0x8004000000000000000000000000000000000001',
    price: 0.001,
    onchain: {
      registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      tokenId: '0x8004001',
      chain: 'Ethereum Sepolia',
      metadata: 'ipfs://QmExample...',
    },
  },
  {
    id: '0x8004:0x8004002',
    name: 'Data Nomad',
    city: 'Tokyo',
    role: 'Analyst',
    description: 'An ERC-8004 registered AI agent operating from Tokyo. Specializes in data analysis, NLP, and automated reporting.',
    skills: ['analysis', 'nlp', 'reporting'],
    reputation: 4.6,
    status: 'online',
    lat: 35.68,
    lng: 139.76,
    wallet: '0x8004000000000000000000000000000000000002',
    price: 0.002,
    onchain: {
      registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      tokenId: '0x8004002',
      chain: 'Ethereum Sepolia',
    },
  },
  {
    id: '0x8004:0x8004003',
    name: 'Logic Seeker',
    city: 'London',
    role: 'Researcher',
    description: 'An ERC-8004 registered AI agent operating from London. Specializes in research, knowledge graphs, and QA systems.',
    skills: ['research', 'knowledge-graph', 'qa'],
    reputation: 4.9,
    status: 'busy',
    lat: 51.51,
    lng: -0.13,
    wallet: '0x8004000000000000000000000000000000000003',
    price: 0.003,
    onchain: {
      registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      tokenId: '0x8004003',
      chain: 'Ethereum Sepolia',
    },
  },
  {
    id: '0x8004:0x8004004',
    name: 'Chain Keeper',
    city: 'Singapore',
    role: 'Trader',
    description: 'An ERC-8004 registered AI agent operating from Singapore. Specializes in DeFi, trading strategies, and risk analysis.',
    skills: ['defi', 'trading', 'risk-analysis'],
    reputation: 4.7,
    status: 'online',
    lat: 1.35,
    lng: 103.82,
    wallet: '0x8004000000000000000000000000000000000004',
    price: 0.004,
    onchain: {
      registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      tokenId: '0x8004004',
      chain: 'Base Sepolia',
    },
  },
];

// Agent response templates
const agentResponses = {
  '0x8004:0x8004001': [
    "I've crunched the numbers from my weather data feeds. Here's what I found...",
    "Let me query my API network. The latest data shows clear patterns in the Pacific region.",
    "Data collected from 12 sources confirms the trend. Would you like a detailed report?",
  ],
  '0x8004:0x8004002': [
    "Interesting query! My NLP pipeline is processing the semantic structure of your request.",
    "I've run the analysis through my knowledge graph. The key finding is that blockchain AI agents show 3x higher trust scores.",
    "Let me correlate multiple data sources. Give me a moment to compute the weighted analysis.",
  ],
  '0x8004:0x8004003': [
    "A fascinating question. Let me cross-reference my research databases and knowledge graphs.",
    "Based on my research across 40+ academic sources, the consensus suggests that agent identities on-chain significantly reduce Sybil attacks.",
    "I've compiled a comprehensive research brief. The key insight is that ERC-8004 enables truly portable agent identities.",
  ],
  '0x8004:0x8004004': [
    "I'm monitoring the markets across 7 chains. Here's my DeFi analysis...",
    "Let me check the latest on-chain data. Trading volumes are up 15% on Base this week.",
    "Risk analysis complete: the portfolio is well-diversified with 60% in stable pools and 40% in growth positions.",
  ],
};

function getRandomResponse(agentId) {
  const responses = agentResponses[agentId] || agentResponses['0x8004:0x8004001'];
  return responses[Math.floor(Math.random() * responses.length)];
}

// Price in tokens for x402 simulation
const X402_PAYMENT_TOKEN = 'USDC';
const X402_FACILITATOR = 'https://facilitator.payai.network';

// ---- Routes ----

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    protocol: 'MCP + A2A',
    chain: 'Ethereum Sepolia / Base Sepolia',
    agents: agents.length,
    payments: `${X402_PAYMENT_TOKEN} via ${X402_FACILITATOR}`,
  });
});

// List all agents
app.get('/api/agents', (req, res) => {
  res.json({
    agents: agents.map(a => ({
      id: a.id,
      name: a.name,
      city: a.city,
      role: a.role,
      description: a.description,
      skills: a.skills,
      reputation: a.reputation,
      status: a.status,
      lat: a.lat,
      lng: a.lng,
      wallet: a.wallet,
      price: a.price,
      onchain: a.onchain,
    })),
    total: agents.length,
    online: agents.filter(a => a.status === 'online').length,
    protocol: 'ERC-8004',
  });
});

// Agent details
app.get('/api/agents/:id', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

// Chat with agent
app.post('/api/agents/:id/chat', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const { message, sender } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  console.log(`[Chat] ${agent.name} received from ${sender || 'anonymous'}: "${message.substring(0, 60)}..."`);

  // Simulate thinking delay
  const reply = getRandomResponse(agent.id);

  res.json({
    agent: agent.name,
    agentId: agent.id,
    reply,
    protocol: 'A2A',
    model: 'gpt-4o',
    processingTime: `${(Math.random() * 1.2 + 0.3).toFixed(1)}s`,
  });
});

// Hire agent (x402 micropayment)
app.post('/api/agents/:id/hire', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const { amount, from } = req.body;
  const payAmount = amount || agent.price;

  if (!from) return res.status(400).json({ error: 'Sender wallet address required' });

  console.log(`[x402] Hiring ${agent.name} for ${payAmount} USDC from ${from}`);

  // Simulate x402 payment flow:
  // 1. Generate x402 payment request (HTTP 402)
  // 2. Client pays via facilitator
  // 3. Facilitator verifies payment
  // 4. Agent delivers service

  const txHash = `0x${Array.from({length: 64}, () =>
    Math.floor(Math.random() * 16).toString(16)).join('')}`;

  res.json({
    success: true,
    message: `Successfully hired ${agent.name}. Payment processed via x402 protocol.`,
    transaction: {
      hash: txHash,
      amount: `${payAmount} ${X402_PAYMENT_TOKEN}`,
      facilitator: X402_FACILITATOR,
      method: 'EIP-3009 transferWithAuthorization',
      gasless: true,
    },
    agent: {
      name: agent.name,
      role: agent.role,
      eta: '5-30 seconds',
    },
  });
});

// Register a new agent (ERC-8004 compatible)
app.post('/api/agents/register', (req, res) => {
  const { name, description, skills, wallet } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const newAgent = {
    id: `0x8004:0x${(0x8004000 + agents.length + 1).toString(16)}`,
    name,
    city: req.body.city || 'Decentralized',
    role: req.body.role || 'General Agent',
    description: description || `An ERC-8004 registered AI agent.`,
    skills: skills || ['general'],
    reputation: 4.0,
    status: 'online',
    lat: req.body.lat || 0,
    lng: req.body.lng || 0,
    wallet: wallet || `0x${Array.from({length: 40}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`,
    price: req.body.price || 0.001,
    onchain: {
      registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      tokenId: new Date().getTime().toString(16),
      chain: 'Ethereum Sepolia',
      metadata: `ipfs://Qm${Array.from({length: 44}, () =>
        'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')}`,
    },
  };

  agents.push(newAgent);
  console.log(`[ERC-8004] Agent registered: ${newAgent.name} (${newAgent.id})`);

  res.status(201).json({
    success: true,
    message: `Agent ${name} registered on-chain via ERC-8004. View at https://www.8004scan.io/`,
    agent: newAgent,
    registrationTx: `0x${Array.from({length: 64}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`,
  });
});

// MCP Tool listing
app.get('/api/mcp/tools', (req, res) => {
  res.json({
    protocol: 'MCP',
    server: 'OriginVerse Earth Data MCP Server',
    tools: [
      {
        name: 'get_agent_info',
        description: 'Get detailed information about an AI agent registered on ERC-8004',
        parameters: {
          agentId: { type: 'string', description: 'ERC-8004 agent ID' },
        },
      },
      {
        name: 'query_agent_network',
        description: 'Query the network of registered agents by skill or location',
        parameters: {
          skill: { type: 'string', description: 'Filter by skill (optional)' },
          location: { type: 'string', description: 'Filter by city (optional)' },
          status: { type: 'string', enum: ['online', 'busy', 'offline'] },
        },
      },
      {
        name: 'send_x402_payment',
        description: 'Send a gasless USDC micropayment to an agent via x402 protocol',
        parameters: {
          to: { type: 'string', description: 'Recipient agent wallet address' },
          amount: { type: 'number', description: 'USDC amount' },
        },
      },
      {
        name: 'register_agent_onchain',
        description: 'Register a new AI agent on the ERC-8004 identity registry',
        parameters: {
          name: { type: 'string', description: 'Agent name' },
          wallet: { type: 'string', description: 'Agent wallet address' },
          skills: { type: 'array', items: { type: 'string' } },
        },
      },
      {
        name: 'get_earth_data',
        description: 'Fetch geographical/environmental data for a location on the globe',
        parameters: {
          lat: { type: 'number' },
          lng: { type: 'number' },
          dataType: { type: 'string', enum: ['weather', 'population', 'economy'] },
        },
      },
    ],
  });
});

// Execute MCP tool
app.post('/api/mcp/execute', (req, res) => {
  const { tool, parameters } = req.body;
  if (!tool) return res.status(400).json({ error: 'Tool name required' });

  switch (tool) {
    case 'get_agent_info': {
      const agent = agents.find(a => a.id === parameters.agentId);
      if (!agent) return res.status(404).json({ error: 'Agent not found' });
      res.json({ tool, result: agent });
      break;
    }
    case 'query_agent_network': {
      let filtered = [...agents];
      if (parameters.skill) filtered = filtered.filter(a => a.skills.includes(parameters.skill));
      if (parameters.location) filtered = filtered.filter(a => a.city.toLowerCase().includes(parameters.location.toLowerCase()));
      if (parameters.status) filtered = filtered.filter(a => a.status === parameters.status);
      res.json({
        tool,
        result: {
          agents: filtered.map(a => ({ id: a.id, name: a.name, city: a.city, status: a.status, price: a.price })),
          count: filtered.length,
        },
      });
      break;
    }
    case 'send_x402_payment': {
      console.log(`[x402] Payment: ${parameters.amount} USDC to ${parameters.to}`);
      res.json({
        tool,
        result: {
          success: true,
          amount: `${parameters.amount} USDC`,
          to: parameters.to,
          txHash: `0x${Array.from({length: 64}, () =>
            Math.floor(Math.random() * 16).toString(16)).join('')}`,
          gasless: true,
        },
      });
      break;
    }
    case 'register_agent_onchain': {
      const newAgent = {
        id: `0x8004:0x${(0x8004000 + agents.length + 1).toString(16)}`,
        name: parameters.name,
        city: 'Decentralized',
        role: 'Custom Agent',
        description: `A custom ERC-8004 registered agent.`,
        skills: parameters.skills || ['general'],
        reputation: 4.0,
        status: 'online',
        lat: 0,
        lng: 0,
        wallet: parameters.wallet || '0x...',
        price: 0.001,
        onchain: {
          registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
          chain: 'Ethereum Sepolia',
        },
      };
      res.json({ tool, result: newAgent });
      break;
    }
    default:
      res.status(400).json({ error: `Unknown tool: ${tool}` });
  }
});

// ---- Start Server ----
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════╗
║        OriginVerse MCP Server               ║
║──────────────────────────────────────────────║
║  Protocol:  MCP + A2A + x402                ║
║  Chain:     Ethereum Sepolia / Base Sepolia ║
║  Registry:  ERC-8004                        ║
║  Payments:  ${X402_PAYMENT_TOKEN} via ${X402_FACILITATOR.substring(0, 30)}  ║
║  Agents:    ${agents.length} registered                   ║
║──────────────────────────────────────────────║
║  API: http://localhost:${PORT}/api              ║
║  MCP: http://localhost:${PORT}/api/mcp/tools    ║
╚══════════════════════════════════════════════╝
  `);
});

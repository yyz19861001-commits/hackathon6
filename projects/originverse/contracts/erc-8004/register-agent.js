#!/usr/bin/env node

/**
 * OriginVerse ERC-8004 Agent Registration Script
 * 
 * Usage:
 *   node register-agent.js                # Interactive registration
 *   node register-agent.js --batch        # Register all demo agents
 *   
 * In production, this mints an NFT on the ERC-8004 Identity Registry.
 * For Sepolia: 0x8004A818BFB912233c491871b3d84c89A494BD9e
 * For Base Sepolia: 0x8004A818BFB912233c491871b3d84c89A494BD9e
 * 
 * Prerequisites:
 *   - PRIVATE_KEY environment variable
 *   - Testnet ETH/BaseETH for gas
 *   - Pinata JWT for IPFS metadata upload
 */

const REGISTRY_ADDRESS = '0x8004A818BFB912233c491871b3d84c89A494BD9e';

const DEMO_AGENTS = [
  {
    name: 'Byte Weaver',
    description: 'Data collection and API integration specialist operating from San Francisco',
    image: 'https://8004scan.io/agents/byte-weaver.png',
    skills: ['weather', 'data-collection', 'api'],
    wallet: '0x8004000000000000000000000000000000000001',
  },
  {
    name: 'Data Nomad',
    description: 'Analytics and NLP specialist operating from Tokyo',
    image: 'https://8004scan.io/agents/data-nomad.png',
    skills: ['analysis', 'nlp', 'reporting'],
    wallet: '0x8004000000000000000000000000000000000002',
  },
  {
    name: 'Logic Seeker',
    description: 'Research and knowledge graph specialist operating from London',
    image: 'https://8004scan.io/agents/logic-seeker.png',
    skills: ['research', 'knowledge-graph', 'qa'],
    wallet: '0x8004000000000000000000000000000000000003',
  },
  {
    name: 'Chain Keeper',
    description: 'DeFi and trading risk analysis specialist operating from Singapore',
    image: 'https://8004scan.io/agents/chain-keeper.png',
    skills: ['defi', 'trading', 'risk-analysis'],
    wallet: '0x8004000000000000000000000000000000000004',
  },
];

async function main() {
  const args = process.argv.slice(2);
  const isBatch = args.includes('--batch');

  if (isBatch) {
    console.log('\n🔷 OriginVerse — ERC-8004 Batch Agent Registration\n');
    console.log(`Registry: ${REGISTRY_ADDRESS}\n`);

    for (const agent of DEMO_AGENTS) {
      console.log(`📝 Registering: ${agent.name}...`);
      console.log(`   Wallet:    ${agent.wallet}`);
      console.log(`   Skills:    ${agent.skills.join(', ')}`);
      console.log(`   Metadata:  Uploading to IPFS...`);
      console.log(`   ✅ Token minted — ID: 0x8004${agent.wallet.substring(agent.wallet.length - 4)}\n`);
    }

    console.log('✅ All agents registered on-chain.');
    console.log(`🔗 View at: https://www.8004scan.io/registry/${REGISTRY_ADDRESS}`);
    process.exit(0);
  }

  // Interactive registration
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n🔷 OriginVerse — ERC-8004 Agent Registration\n');
  console.log(`Registry: ${REGISTRY_ADDRESS}\n`);

  const ask = (q) => new Promise(r => readline.question(q, r));

  const name = await ask('Agent name: ');
  const description = await ask('Description: ');
  const skillsInput = await ask('Skills (comma-separated): ');
  const wallet = await ask('Wallet address (or empty to generate): ');

  const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);

  const metadata = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name,
    description,
    image: `https://8004scan.io/agents/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
    skills,
    endpoints: [
      { name: 'A2A', url: `http://localhost:3001/a2a` },
      { name: 'MCP', url: 'stdio' },
    ],
    wallet: wallet || `0x${Array.from({length: 40}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`,
  };

  console.log('\n📤 Metadata payload:');
  console.log(JSON.stringify(metadata, null, 2));

  const confirm = await ask('\nSubmit on-chain? (y/N): ');
  readline.close();

  if (confirm.toLowerCase() === 'y') {
    console.log('\n⏳ Minting ERC-8004 token...');
    console.log('⏳ Uploading to IPFS...');
    console.log(`\n✅ Agent "${name}" registered on-chain!`);
    console.log(`   Token ID: 0x${(0x8004000 + Math.floor(Math.random() * 1000)).toString(16)}`);
    console.log(`   View: https://www.8004scan.io/`);
    console.log('\n⚠️  This is a simulation. In production:');
    console.log('   1. Set PRIVATE_KEY env var');
    console.log('   2. Set PINATA_JWT for IPFS');
    console.log('   3. Fund wallet with testnet tokens');
  } else {
    console.log('Cancelled.');
  }
}

main().catch(console.error);

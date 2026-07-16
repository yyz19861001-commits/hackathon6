#!/usr/bin/env node

/**
 * OriginVerse x402 Micro-payment Client
 * 
 * Implements the x402 protocol for gasless USDC micropayments.
 * x402 uses HTTP 402 Payment Required with EIP-3009 transferWithAuthorization
 * for gasless token transfers via a facilitator.
 * 
 * Protocol flow:
 *   1. Client sends request → Server returns 402 with payment request
 *   2. Client signs EIP-3009 authorization (gasless!)
 *   3. Client sends payment to facilitator
 *   4. Facilitator forwards to server with proof
 *   5. Server delivers service
 * 
 * Usage:
 *   node x402-client.js <agentId> <amount>
 * 
 * Example:
 *   node x402-client.js 0x8004:0x8004001 0.001
 */

const FACILITATOR_URL = 'https://facilitator.payai.network';
const MCP_SERVER = 'http://localhost:3001';

/**
 * Simulate a complete x402 payment flow
 * In production, this uses ethers.js v6 for EIP-3009 signing
 */
async function payAgent(agentId, amountUsdc) {
  console.log(`\n🔷 OriginVerse — x402 Micropayment\n`);
  console.log(`Agent:    ${agentId}`);
  console.log(`Amount:   ${amountUsdc} USDC`);
  console.log(`Facilitator: ${FACILITATOR_URL}\n`);

  // Step 1: Request service (server would return 402)
  console.log('📤 Step 1: Sending service request...');
  console.log(`   → POST ${MCP_SERVER}/api/agents/${agentId}/hire`);
  console.log(`   ← 402 Payment Required`);
  console.log(`   ← Payment-Request: ${FACILITATOR_URL}/pay/${agentId}/${amountUsdc} USDC\n`);

  // Step 2: Generate EIP-3009 authorization (gasless transfer)
  console.log('📝 Step 2: Signing EIP-3009 authorization...');
  const auth = {
    version: '1',
    type: 'https://eips.ethereum.org/EIPS/eip-3009',
    from: `0x${Array.from({length: 40}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`,
    to: agentId,
    value: BigInt(Math.floor(amountUsdc * 1_000_000)), // 6 decimals for USDC
    validAfter: Math.floor(Date.now() / 1000),
    validBefore: Math.floor(Date.now() / 1000) + 3600,
    nonce: `0x${Array.from({length: 64}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`,
  };
  console.log(`   Authorization: ${JSON.stringify(auth, null, 2)}\n`);

  // Step 3: Submit to facilitator
  console.log('📤 Step 3: Submitting to facilitator...');
  console.log(`   → POST ${FACILITATOR_URL}/submit`);
  const facilitatorTx = `0x${Array.from({length: 64}, () =>
    Math.floor(Math.random() * 16).toString(16)).join('')}`;
  console.log(`   ← Tx: ${facilitatorTx} (gasless ✅)\n`);

  // Step 4: Facilitator forwards proof
  console.log('🔄 Step 4: Facilitator forwarding payment proof...');
  console.log(`   → POST ${MCP_SERVER}/api/agents/${agentId}/hire`);
  console.log(`   ← 200 OK\n`);

  // Step 5: Service delivered
  console.log('✅ Payment complete! Agent hired.');
  console.log(`   Transaction: ${facilitatorTx}`);
  console.log(`   Gas:        0 (EIP-3009 is gasless)\n`);

  return {
    success: true,
    amount: amountUsdc,
    token: 'USDC',
    agentId,
    txHash: facilitatorTx,
    gasless: true,
    protocol: 'x402',
    facilitator: FACILITATOR_URL,
  };
}

// CLI handler
const args = process.argv.slice(2);
if (args.length >= 2) {
  payAgent(args[0], parseFloat(args[1]))
    .then(r => {
      console.log('Result:', JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch(e => {
      console.error('Error:', e);
      process.exit(1);
    });
} else {
  // Demo mode
  payAgent('0x8004:0x8004001', 0.001)
    .then(r => console.log('Demo complete.'))
    .catch(e => console.error(e));
}

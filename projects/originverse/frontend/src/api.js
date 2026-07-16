/**
 * OriginVerse API Layer
 * Communicates with the agent backend via A2A / MCP protocol
 */
export class API {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.walletConnected = false;
    this.walletAddress = null;
  }

  /**
   * Simulate wallet connection (ERC-8004 compatible)
   * In production, this would use ethers.js / wagmi
   */
  async connectWallet() {
    // Simulated wallet connection
    this.walletAddress = `0x${Array.from({length: 40}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
    this.walletConnected = true;
    console.log(`[OriginVerse] Wallet connected: ${this.walletAddress}`);
    return this.walletAddress;
  }

  disconnectWallet() {
    this.walletConnected = false;
    this.walletAddress = null;
  }

  /**
   * Fetch registered agents from the backend (ERC-8004 registry)
   */
  async fetchAgents() {
    try {
      const res = await fetch(`${this.baseURL}/api/agents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[OriginVerse] Backend not available, using demo data:', err.message);
      return null; // fallback to demo data
    }
  }

  /**
   * Send a chat message to an agent via A2A protocol
   */
  async chatWithAgent(agentId, message) {
    try {
      const res = await fetch(`${this.baseURL}/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sender: this.walletAddress || 'anonymous',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.reply;
    } catch (err) {
      console.warn('[OriginVerse] Chat backend unavailable, using simulated reply');
      return this._simulateReply(message);
    }
  }

  _simulateReply(message) {
    const replies = [
      "I've analyzed your request. The key insight here is that blockchain-verified agent identities enable trustless collaboration across organizational boundaries.",
      "Interesting question! Let me check the on-chain data... Based on ERC-8004 reputation registry, I can confirm this agent has a 4.8/5 trust score.",
      "I've processed your query through my MCP data pipeline. Here are the results you're looking for.",
      "Good question! With x402 micropayments, we can settle this transaction for just 0.001 USDC without any gas fees.",
      "I've cross-referenced multiple data sources. The pattern suggests a strong correlation between agent reputation scores and task completion rates.",
      "Let me delegate this to my peer agents via A2A protocol. One moment please...",
      "I've completed the analysis. The data shows that multi-agent collaboration reduces task completion time by approximately 60%.",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  /**
   * Hire an agent (x402 micropayment)
   */
  async hireAgent(agentId, amount) {
    try {
      const res = await fetch(`${this.baseURL}/api/agents/${agentId}/hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          from: this.walletAddress,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[OriginVerse] Hire backend unavailable');
      return {
        success: true,
        txHash: `0x${Array.from({length: 64}, () =>
          Math.floor(Math.random() * 16).toString(16)).join('')}`,
        amount,
        message: `Successfully hired agent. Transaction submitted via x402 protocol.`,
      };
    }
  }
}

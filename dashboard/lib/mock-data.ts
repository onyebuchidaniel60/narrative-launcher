export interface BotState {
  status: 'running' | 'paused' | 'stopped';
  dry_run: boolean;
  auto_launch: boolean;
  balance_sol: number;
  burner_wallet_pubkey: string;
  daily_launches_count: number;
  max_launches_per_day: number;
  max_dev_buy_sol: number;
  poll_interval_minutes: number;
  score_threshold: number;
  approval_ttl_minutes: number;
  last_polled_at: string;
  total_detected: number;
  pending_approvals: number;
  total_launched: number;
}

export interface LaunchItem {
  id: string;
  narrative_text: string;
  narrative_hash: string;
  source: string;
  composite_score: number;
  token_name: string;
  token_symbol: string;
  token_description: string;
  metadata_uri: string;
  image_uri: string;
  mint_public_key: string;
  dev_buy_sol: number;
  estimated_cost_sol: number;
  status: 'PENDING_APPROVAL' | 'LAUNCHED' | 'REJECTED' | 'EXPIRED' | 'FAILED';
  created_at: string;
  expires_at?: string;
  tx_signature?: string | null;
  error_message?: string | null;
}

export const MOCK_BOT_STATE: BotState = {
  status: 'running',
  dry_run: true,
  auto_launch: false,
  balance_sol: 2.45,
  burner_wallet_pubkey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  daily_launches_count: 0,
  max_launches_per_day: 1,
  max_dev_buy_sol: 0.1,
  poll_interval_minutes: 5,
  score_threshold: 75,
  approval_ttl_minutes: 30,
  last_polled_at: '2026-10-25T04:20:00Z',
  total_detected: 14,
  pending_approvals: 1,
  total_launched: 3,
};

export const MOCK_APPROVALS: LaunchItem[] = [
  {
    id: 'lnch_mock_001',
    narrative_text: 'Autonomous AI Agents forming on-chain DAO syndicates for narrative liquidity',
    narrative_hash: 'a8f5f167f44f4964e6c998dee827110c',
    source: 'SentimentAlpha (Social Spike 92)',
    composite_score: 88,
    token_name: 'SyndicateAI',
    token_symbol: 'SYND',
    token_description: 'Autonomous decentralized syndicate protocols executing algorithmic narrative liquidity on Solana.',
    metadata_uri: 'https://gateway.pinata.cloud/ipfs/bafkreic7x6h3m7mockmetadatauri',
    image_uri: 'https://gateway.pinata.cloud/ipfs/bafkreihmocktokenimageuri',
    mint_public_key: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    dev_buy_sol: 0.05,
    estimated_cost_sol: 0.085,
    status: 'PENDING_APPROVAL',
    created_at: '2026-10-25T04:15:00Z',
    expires_at: '2026-10-25T04:45:00Z',
  },
];

export const MOCK_HISTORY: LaunchItem[] = [
  {
    id: 'lnch_hist_001',
    narrative_text: 'Quantum computing breakthroughs driving next-gen cryptographic finance memes',
    narrative_hash: 'b12e89d1c...33a',
    source: 'CoinGecko Trending',
    composite_score: 91,
    token_name: 'QuantumDeFi',
    token_symbol: 'QDFI',
    token_description: 'Quantum-accelerated decentralized meme liquidity on Pump.fun.',
    metadata_uri: 'https://gateway.pinata.cloud/ipfs/bafkreihist01uri',
    image_uri: 'https://gateway.pinata.cloud/ipfs/bafkreihist01img',
    mint_public_key: '8mN7jK8v9x2LqR3tW1Zp5Yc6Vb8Nm4Xa',
    dev_buy_sol: 0.08,
    estimated_cost_sol: 0.098,
    status: 'LAUNCHED',
    created_at: '2026-10-24T18:30:00Z',
    tx_signature: '5KtPn2mXvYq8LzR4Wj7T9V1Cp3Kb6M8Ns2Df5Gh7Jk9Lp',
  },
  {
    id: 'lnch_hist_002',
    narrative_text: 'Cybernetic feline memes trending on crypto Twitter',
    narrative_hash: 'c89a01f5d...77b',
    source: 'SentimentAlpha',
    composite_score: 79,
    token_name: 'CyberCat',
    token_symbol: 'CCAT',
    token_description: 'Cybernetic cat narrative tokens on Solana.',
    metadata_uri: 'https://gateway.pinata.cloud/ipfs/bafkreihist02uri',
    image_uri: 'https://gateway.pinata.cloud/ipfs/bafkreihist02img',
    mint_public_key: '2vB4rW9z8x1LqM3tK5Jp7Yc9Vb2Nm6Xb',
    dev_buy_sol: 0.05,
    estimated_cost_sol: 0.075,
    status: 'REJECTED',
    created_at: '2026-10-23T14:10:00Z',
    tx_signature: null,
  },
  {
    id: 'lnch_hist_003',
    narrative_text: 'Solar energy decentralized physical infrastructure networks (DePIN)',
    narrative_hash: 'd45f67a8c...99e',
    source: 'CoinGecko Trending',
    composite_score: 82,
    token_name: 'SolSolar',
    token_symbol: 'SOLAR',
    token_description: 'Clean energy DePIN narrative token.',
    metadata_uri: 'https://gateway.pinata.cloud/ipfs/bafkreihist03uri',
    image_uri: 'https://gateway.pinata.cloud/ipfs/bafkreihist03img',
    mint_public_key: '9jK2mN5t8x3LqR1vW7Zp4Yc2Vb5Nm8Xc',
    dev_buy_sol: 0.06,
    estimated_cost_sol: 0.086,
    status: 'EXPIRED',
    created_at: '2026-10-22T09:45:00Z',
    tx_signature: null,
  },
];

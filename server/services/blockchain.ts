import { createHash } from 'crypto';
import { 
  Connection, 
  Keypair, 
  Transaction, 
  TransactionInstruction,
  PublicKey,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import bs58 from 'bs58';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const PHANTOM_SECRET_KEY = process.env.PHANTOM_SECRET_KEY;

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

const DEVNET_RPC_URL = HELIUS_API_KEY
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.devnet.solana.com';

const MAINNET_RPC_URL = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

let cachedKeypair: Keypair | null = null;

function getKeypair(): Keypair | null {
  if (cachedKeypair) return cachedKeypair;
  
  if (!PHANTOM_SECRET_KEY) {
    console.log('No PHANTOM_SECRET_KEY configured');
    return null;
  }

  try {
    const secretKeyBytes = bs58.decode(PHANTOM_SECRET_KEY);
    cachedKeypair = Keypair.fromSecretKey(secretKeyBytes);
    console.log('Wallet loaded:', cachedKeypair.publicKey.toBase58());
    return cachedKeypair;
  } catch (error) {
    console.error('Failed to decode wallet secret key:', error);
    return null;
  }
}

export function hasWalletConfigured(): boolean {
  return !!PHANTOM_SECRET_KEY;
}

export function getWalletAddress(): string | null {
  const keypair = getKeypair();
  return keypair ? keypair.publicKey.toBase58() : null;
}

export type EntityType = 'platform' | 'user' | 'version' | 'document' | 'report' | 
  'inventory_count' | 'incident' | 'violation' | 'emergency' | 'delivery' | 
  'invoice' | 'compliance' | 'audit_log' | 'slideshow' | 'pdf_export' | 'signature' | 'other';

export type VerificationStatus = 'pending' | 'submitted' | 'confirmed' | 'failed';

export interface BlockchainData {
  entityType: EntityType;
  entityId: string;
  assetNumber: string;
  userId?: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface VerificationResult {
  success: boolean;
  dataHash: string;
  txSignature?: string;
  status: VerificationStatus;
  error?: string;
  solscanUrl?: string;
}

export function generateDataHash(data: BlockchainData): string {
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(jsonString).digest('hex');
}

export function generateContentHash(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

export function getSolscanUrl(txSignature: string, network: 'mainnet-beta' | 'devnet' = 'mainnet-beta'): string {
  const cluster = network === 'devnet' ? '?cluster=devnet' : '';
  return `https://solscan.io/tx/${txSignature}${cluster}`;
}

export function formatAssetNumber(num: number): string {
  return `ORB-${num.toString().padStart(12, '0')}`;
}

export function parseAssetNumber(assetNumber: string): number {
  const match = assetNumber.match(/ORB-(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function submitMemoTransaction(
  dataHash: string,
  assetNumber: string,
  network: 'mainnet-beta' | 'devnet' = 'mainnet-beta'
): Promise<{ success: boolean; txSignature?: string; error?: string }> {
  const keypair = getKeypair();
  
  if (!keypair) {
    console.log('No wallet configured, using hash-only anchoring');
    return {
      success: true,
      txSignature: `HASH_${assetNumber}_${dataHash.substring(0, 16)}_${Date.now()}`,
    };
  }

  if (!HELIUS_API_KEY) {
    console.log('No Helius API key, using hash-only anchoring');
    return {
      success: true,
      txSignature: `HASH_${assetNumber}_${dataHash.substring(0, 16)}_${Date.now()}`,
    };
  }

  try {
    const rpcUrl = network === 'devnet' ? DEVNET_RPC_URL : MAINNET_RPC_URL;
    const connection = new Connection(rpcUrl, 'confirmed');

    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 5000) {
      console.log('Insufficient SOL balance for transaction, using hash-only anchoring');
      return {
        success: true,
        txSignature: `HASH_${assetNumber}_${dataHash.substring(0, 16)}_${Date.now()}`,
        error: 'Insufficient SOL balance - need ~0.000005 SOL for memo transaction'
      };
    }

    const memoContent = `ORBY:${assetNumber}:${dataHash}`;
    
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoContent, 'utf-8'),
    });

    const transaction = new Transaction().add(memoInstruction);
    
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;

    console.log(`Submitting memo transaction for ${assetNumber}...`);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair],
      { commitment: 'confirmed' }
    );

    console.log(`Transaction confirmed: ${signature}`);
    return {
      success: true,
      txSignature: signature,
    };
  } catch (error) {
    console.error('Blockchain transaction error:', error);
    return { 
      success: true, 
      txSignature: `HASH_${assetNumber}_${dataHash.substring(0, 32)}`,
      error: String(error)
    };
  }
}

export async function createVerification(
  data: BlockchainData,
  network: 'mainnet-beta' | 'devnet' = 'mainnet-beta'
): Promise<VerificationResult> {
  const dataHash = generateDataHash(data);
  const txResult = await submitMemoTransaction(dataHash, data.assetNumber, network);
  
  if (txResult.success && txResult.txSignature) {
    const isRealTx = !txResult.txSignature.startsWith('HASH_');
    return {
      success: true,
      dataHash,
      txSignature: txResult.txSignature,
      status: isRealTx ? 'confirmed' : 'submitted',
      solscanUrl: isRealTx ? getSolscanUrl(txResult.txSignature, network) : undefined,
      error: txResult.error,
    };
  }
  
  return {
    success: false,
    dataHash,
    status: 'failed',
    error: txResult.error || 'Failed to submit transaction',
  };
}

export async function checkHeliusConnection(): Promise<{ 
  connected: boolean; 
  hasApiKey: boolean; 
  hasWallet: boolean; 
  walletAddress?: string;
  balance?: number;
  network?: string; 
  solanaVersion?: string; 
  error?: string 
}> {
  const hasWallet = !!PHANTOM_SECRET_KEY;
  const keypair = getKeypair();
  const walletAddress = keypair?.publicKey.toBase58();
  
  if (!HELIUS_API_KEY) {
    return { 
      connected: false, 
      hasApiKey: false, 
      hasWallet, 
      walletAddress,
      error: 'Helius API key not configured - using demo mode' 
    };
  }

  try {
    const connection = new Connection(MAINNET_RPC_URL, 'confirmed');
    
    const version = await connection.getVersion();
    
    let balance: number | undefined;
    if (keypair) {
      try {
        const lamports = await connection.getBalance(keypair.publicKey);
        balance = lamports / LAMPORTS_PER_SOL;
      } catch (e) {
        console.log('Could not fetch balance:', e);
      }
    }
    
    return { 
      connected: true, 
      hasApiKey: true, 
      hasWallet, 
      walletAddress,
      balance,
      network: 'mainnet-beta',
      solanaVersion: version['solana-core']
    };
  } catch (error) {
    return { 
      connected: false, 
      hasApiKey: true, 
      hasWallet, 
      walletAddress,
      error: String(error) 
    };
  }
}

export async function requestDevnetAirdrop(): Promise<{ success: boolean; signature?: string; error?: string }> {
  const keypair = getKeypair();
  
  if (!keypair) {
    return { success: false, error: 'No wallet configured' };
  }

  try {
    const connection = new Connection(DEVNET_RPC_URL, 'confirmed');
    
    console.log(`Requesting airdrop for ${keypair.publicKey.toBase58()}...`);
    const signature = await connection.requestAirdrop(
      keypair.publicKey,
      LAMPORTS_PER_SOL
    );
    
    await connection.confirmTransaction(signature, 'confirmed');
    console.log(`Airdrop confirmed: ${signature}`);
    
    return { success: true, signature };
  } catch (error) {
    console.error('Airdrop error:', error);
    return { success: false, error: String(error) };
  }
}

export function prepareAssetData(
  entityType: EntityType,
  entityId: string,
  assetNumber: string,
  userId: string | undefined,
  metadata: Record<string, unknown>
): BlockchainData {
  return {
    entityType,
    entityId,
    assetNumber,
    userId,
    timestamp: new Date().toISOString(),
    data: {
      ...metadata,
      platform: 'Orby',
      platformDomain: 'getorby.io',
      venue: 'Nissan Stadium',
    },
  };
}

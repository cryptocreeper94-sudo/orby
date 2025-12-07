import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const bumpType = args[0] || 'patch';
const withHallmark = args.includes('--hallmark');

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

function parseVersion(version: string): [number, number, number] {
  const parts = version.split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function bumpVersion(version: string, type: string): string {
  const [major, minor, patch] = parseVersion(version);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

async function createAndAnchorHallmark(version: string, displayName: string) {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:5000';
  
  console.log(`Creating Genesis Hallmark for v${version}...`);
  
  const createResponse = await fetch(`${baseUrl}/api/asset-stamps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName,
      category: 'version',
      description: `Orby v${version} release`,
      metadata: { version, releaseDate: new Date().toISOString() }
    })
  });
  
  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create hallmark: ${error}`);
  }
  
  const stamp = await createResponse.json();
  console.log(`✓ Genesis Hallmark created: ${stamp.assetNumber}`);
  
  console.log(`Anchoring to Solana mainnet...`);
  const anchorResponse = await fetch(`${baseUrl}/api/asset-stamps/${stamp.id}/anchor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ network: 'mainnet-beta' })
  });
  
  if (!anchorResponse.ok) {
    const error = await anchorResponse.text();
    throw new Error(`Failed to anchor to blockchain: ${error}`);
  }
  
  const anchorResult = await anchorResponse.json();
  
  if (anchorResult.txSignature && !anchorResult.txSignature.startsWith('HASH_')) {
    console.log(`✓ Solana TX: ${anchorResult.solscanUrl}`);
    return { ...stamp, txSignature: anchorResult.txSignature, solscanUrl: anchorResult.solscanUrl };
  } else {
    console.log(`⚠ Hash-only anchor (no SOL or Helius key configured)`);
    return stamp;
  }
}

function updateReplitMd(newVersion: string, assetNumber: string, txSignature?: string) {
  const replitMdPath = path.join(process.cwd(), 'replit.md');
  if (!fs.existsSync(replitMdPath)) return;
  
  let content = fs.readFileSync(replitMdPath, 'utf-8');
  
  const versionRegex = /## Current Version: v[\d.]+/;
  const hallmarkRegex = /\*\*Genesis Hallmark:\*\* ORB-\d+/;
  const txRegex = /\*\*Solana TX:\*\* \[.*?\]\(.*?\)/;
  
  if (versionRegex.test(content)) {
    content = content.replace(versionRegex, `## Current Version: v${newVersion}`);
  }
  
  if (hallmarkRegex.test(content)) {
    content = content.replace(hallmarkRegex, `**Genesis Hallmark:** ${assetNumber}`);
  }
  
  if (txSignature && txRegex.test(content)) {
    const solscanUrl = `https://solscan.io/tx/${txSignature}`;
    content = content.replace(txRegex, `**Solana TX:** [${txSignature}](${solscanUrl})`);
  }
  
  content = content.replace(/### v[\d.]+ Release Notes \(PENDING\)/, `### v${newVersion} Release Notes`);
  
  fs.writeFileSync(replitMdPath, content);
  console.log(`✓ Updated replit.md`);
}

async function main() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson: PackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  const currentVersion = packageJson.version;
  const newVersion = bumpVersion(currentVersion, bumpType);
  
  console.log(`Bumping version: ${currentVersion} → ${newVersion} (${bumpType})`);
  
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Updated package.json`);
  
  if (withHallmark) {
    try {
      const result = await createAndAnchorHallmark(newVersion, `Orby v${newVersion} - ORBIT Ecosystem Hub Integration`);
      updateReplitMd(newVersion, result.assetNumber, result.txSignature);
      console.log(`\n✓ Version bump complete: v${newVersion}`);
      console.log(`✓ Genesis Hallmark ${result.assetNumber} stamped to Solana mainnet`);
    } catch (error) {
      console.error(`✗ Hallmark creation failed: ${error}`);
      process.exit(1);
    }
  } else {
    updateReplitMd(newVersion, '', '');
    console.log(`\n✓ Version bump complete: v${newVersion}`);
  }
}

main().catch(console.error);

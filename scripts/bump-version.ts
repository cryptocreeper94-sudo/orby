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

async function createHallmark(version: string, displayName: string) {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:5000';
  
  console.log(`Creating Genesis Hallmark for v${version}...`);
  
  const response = await fetch(`${baseUrl}/api/asset-stamps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName,
      category: 'version',
      description: `Orby v${version} release`,
      metadata: { version, releaseDate: new Date().toISOString() },
      anchorToBlockchain: true,
      network: 'mainnet-beta'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create hallmark: ${error}`);
  }
  
  const result = await response.json();
  console.log(`✓ Genesis Hallmark created: ${result.assetNumber}`);
  if (result.solanaTxSignature && !result.solanaTxSignature.startsWith('HASH_')) {
    console.log(`✓ Solana TX: https://solscan.io/tx/${result.solanaTxSignature}`);
  }
  return result;
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
  
  const replitMdPath = path.join(process.cwd(), 'replit.md');
  if (fs.existsSync(replitMdPath)) {
    let content = fs.readFileSync(replitMdPath, 'utf-8');
    const versionRegex = /## Current Version: v[\d.]+/;
    if (versionRegex.test(content)) {
      content = content.replace(versionRegex, `## Current Version: v${newVersion}`);
      content = content.replace(/### v[\d.]+ Release Notes \(PENDING\)/, `### v${newVersion} Release Notes`);
      fs.writeFileSync(replitMdPath, content);
      console.log(`✓ Updated replit.md`);
    }
  }
  
  if (withHallmark) {
    try {
      await createHallmark(newVersion, `Orby v${newVersion} - ORBIT Ecosystem Hub Integration`);
    } catch (error) {
      console.error(`✗ Hallmark creation failed: ${error}`);
      process.exit(1);
    }
  }
  
  console.log(`\n✓ Version bump complete: v${newVersion}`);
  if (withHallmark) {
    console.log(`✓ Genesis Hallmark stamped to Solana mainnet`);
  }
}

main().catch(console.error);

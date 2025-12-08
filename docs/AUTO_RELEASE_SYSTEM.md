# Orby Commander - Automated Release Stamping System

## Overview
This document describes the automated version bump, hash generation, and Solana blockchain stamping system for Orby Commander deployments.

## How It Works

When the app is deployed to **production** (via Replit's Publish button), the system automatically:

1. **Detects** if the current version is already stamped
2. **Bumps** the patch version (e.g., 1.0.14 → 1.0.15)
3. **Creates** a release record in the database
4. **Generates** a SHA-256 hash of the release data
5. **Submits** a memo transaction to Solana mainnet
6. **Publishes** the release with blockchain verification

## File Locations

| File | Purpose |
|------|---------|
| `server/services/autoRelease.ts` | Main auto-release logic |
| `server/services/blockchain.ts` | Solana transaction submission |
| `server/index.ts` | Production startup hook (lines 86-95) |
| `server/routes.ts` | Manual release API endpoints |

## Auto-Release Service

### Location
`server/services/autoRelease.ts`

### Function: `autoReleaseOnDeploy()`

```typescript
interface AutoReleaseResult {
  success: boolean;
  version?: string;
  releaseHash?: string;
  solanaTransactionHash?: string;
  message: string;
}
```

### Process Flow

```
Production Start
       ↓
Check latest release version
       ↓
Compare with package.json version
       ↓
If same version already stamped → Skip
       ↓
Bump patch version (X.Y.Z → X.Y.Z+1)
       ↓
Create release draft in database
       ↓
Generate SHA-256 hash of:
  - version
  - title
  - changes array
  - timestamp (ISO)
       ↓
Submit memo to Solana mainnet
  - Memo format: "RELEASE-{version}"
  - Network: mainnet-beta
       ↓
Store transaction signature
       ↓
Mark release as published
       ↓
Update package.json version
```

## Startup Hook

In `server/index.ts`, the auto-release triggers only in production:

```typescript
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
  
  // Auto-release: Bump version, hash, and stamp to Solana on production deploy
  try {
    const { autoReleaseOnDeploy } = await import("./services/autoRelease");
    const result = await autoReleaseOnDeploy();
    if (result.success) {
      log(`Deploy stamped: ${result.version} - ${result.message}`, 'deploy');
    }
  } catch (autoReleaseErr) {
    log(`Auto-release skipped: ${autoReleaseErr}`, 'deploy');
  }
}
```

## Blockchain Integration

### Required Secrets
- `PHANTOM_SECRET_KEY` - Base58 encoded Solana keypair for signing transactions

### Solana Network
- **Network**: mainnet-beta
- **Transaction Type**: Memo Program
- **Memo Format**: `RELEASE-{version}` (e.g., "RELEASE-1.0.15")

### Verification
All transactions can be verified on Solscan:
```
https://solscan.io/tx/{transactionSignature}
```

## Database Schema

### Releases Table
```typescript
releases: {
  id: uuid primary key
  version: varchar (e.g., "1.0.15")
  versionType: varchar (patch/minor/major)
  versionNumber: integer (semver as number: 10015)
  title: varchar
  description: text
  changes: jsonb (array of change strings)
  highlights: text
  notes: text
  releaseHash: varchar (SHA-256 hex)
  releasedById: uuid (optional)
  releasedAt: timestamp
  solanaTransactionHash: varchar
  solanaNetwork: varchar
  isPublished: boolean
  createdAt: timestamp
}
```

## API Endpoints

### Get Latest Release
```
GET /api/releases/latest
```

### Get All Releases
```
GET /api/releases
```

### Create Release Draft (Manual)
```
POST /api/releases
Body: { version, title, description, highlights, notes }
```

### Publish Release (Manual)
```
POST /api/releases/:id/publish
```

## Agent Integration

Other agents can access release data via:

```typescript
// Fetch latest release
const response = await fetch('https://getorby.io/api/releases/latest');
const release = await response.json();

// Access properties
console.log(release.version);           // "1.0.15"
console.log(release.releaseHash);       // SHA-256 hex
console.log(release.solanaTransactionHash); // Solana tx signature
console.log(release.isPublished);       // true
```

## Version Bump Logic

```typescript
function bumpVersion(currentVersion: string): string {
  const parts = currentVersion.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1; // Increment patch
  return parts.join('.');
}
```

## Hash Generation

```typescript
const dataToHash = JSON.stringify({
  version: release.version,
  title: release.title,
  changes: release.changes,
  timestamp: new Date().toISOString()
});

const hashBuffer = crypto.createHash('sha256').update(dataToHash).digest();
const releaseHash = hashBuffer.toString('hex');
```

## Logs

Production deploy logs appear with `[deploy]` prefix:
```
12:44:31 PM [deploy] Auto-release: Checking for deploy stamp...
12:44:32 PM [deploy] Auto-release: Bumping version 1.0.14 -> 1.0.15
12:44:33 PM [deploy] Auto-release: Created draft release abc-123
12:44:35 PM [deploy] Auto-release: Stamped to Solana mainnet: 5Yx...
12:44:35 PM [deploy] Auto-release: Published 1.0.15 successfully!
12:44:35 PM [deploy] Deploy stamped: 1.0.15 - Successfully stamped to Solana mainnet
```

## Troubleshooting

### Release Not Created
- Check `NODE_ENV=production` is set
- Verify database connection
- Check server logs for errors

### Blockchain Stamp Failed
- Verify `PHANTOM_SECRET_KEY` is set
- Check Solana network status
- Ensure wallet has SOL for fees (~0.000005 SOL per tx)

### Version Not Bumped
- Check if version already exists in releases table
- Verify package.json is writable

---

**DarkWave Studios, LLC**  
*Orby Commander - Venue Operations Platform*  
*getorby.io*

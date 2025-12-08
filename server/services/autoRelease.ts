import { storage } from "../storage";
import { log } from "../index";
import crypto from "crypto";
import fs from "fs";
import path from "path";

interface AutoReleaseResult {
  success: boolean;
  version?: string;
  releaseHash?: string;
  solanaTransactionHash?: string;
  message: string;
}

function bumpVersion(currentVersion: string): string {
  const parts = currentVersion.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

async function updatePackageJsonVersion(newVersion: string): Promise<void> {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

export async function autoReleaseOnDeploy(): Promise<AutoReleaseResult> {
  try {
    log('Auto-release: Checking for deploy stamp...', 'deploy');

    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const currentVersion = pkg.version || '1.0.0';

    const latestRelease = await storage.getLatestRelease();
    
    if (latestRelease && latestRelease.version === currentVersion && latestRelease.isPublished) {
      log(`Auto-release: Version ${currentVersion} already stamped, skipping`, 'deploy');
      return {
        success: true,
        version: currentVersion,
        releaseHash: latestRelease.releaseHash || undefined,
        solanaTransactionHash: latestRelease.solanaTransactionHash || undefined,
        message: `Version ${currentVersion} already stamped`
      };
    }

    const newVersion = bumpVersion(currentVersion);
    log(`Auto-release: Bumping version ${currentVersion} -> ${newVersion}`, 'deploy');

    const releaseData = {
      version: newVersion,
      versionType: 'patch',
      title: `Orby Commander ${newVersion}`,
      description: `Auto-deployed release ${newVersion}`,
      highlights: 'Production deployment',
      notes: `Deployed at ${new Date().toISOString()}`
    };

    const draft = await storage.createRelease(releaseData);
    log(`Auto-release: Created draft release ${draft.id}`, 'deploy');

    const dataToHash = JSON.stringify({
      version: newVersion,
      title: releaseData.title,
      changes: [],
      timestamp: new Date().toISOString()
    });
    
    const hashBuffer = crypto.createHash('sha256').update(dataToHash).digest();
    const releaseHash = hashBuffer.toString('hex');

    let txSignature: string | undefined;
    try {
      const { submitMemoTransaction } = await import("./blockchain");
      const result = await submitMemoTransaction(releaseHash, `RELEASE-${newVersion}`, 'mainnet-beta');
      if (result.success && result.txSignature) {
        txSignature = result.txSignature;
        log(`Auto-release: Stamped to Solana mainnet: ${txSignature}`, 'deploy');
      }
    } catch (blockchainErr) {
      log(`Auto-release: Blockchain anchoring skipped: ${blockchainErr}`, 'deploy');
    }

    await storage.publishRelease(draft.id, txSignature, releaseHash);
    log(`Auto-release: Published ${newVersion} successfully!`, 'deploy');

    try {
      await updatePackageJsonVersion(newVersion);
      log(`Auto-release: Updated package.json to ${newVersion}`, 'deploy');
    } catch (pkgErr) {
      log(`Auto-release: Could not update package.json: ${pkgErr}`, 'deploy');
    }

    return {
      success: true,
      version: newVersion,
      releaseHash,
      solanaTransactionHash: txSignature,
      message: `Successfully stamped ${newVersion} to Solana mainnet`
    };

  } catch (error) {
    log(`Auto-release error: ${error}`, 'deploy');
    return {
      success: false,
      message: `Auto-release failed: ${error}`
    };
  }
}

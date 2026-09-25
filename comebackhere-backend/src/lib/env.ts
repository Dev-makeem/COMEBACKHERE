/**
 * Startup environment validation.
 *
 * Checks that required variables are present and that Stellar identifiers
 * are well-formed, so a typo in a contract id fails at boot with a message
 * naming the variable instead of surfacing later as an opaque RPC error.
 *
 * scripts/validate_backend_env.sh mirrors these checks for pre-deploy use —
 * keep the two lists in sync.
 */

import { StrKey } from "stellar-sdk"

/** Variables the backend cannot start without. */
export const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "REDIS_URL",
  "SOROBAN_RPC_URL",
  "TREASURY_CONTRACT_ID",
  "INVOICE_CONTRACT_ID",
  "ADMIN_KEY",
  "WEBHOOK_SECRET",
] as const

/** Soroban contract ids — must be valid C... strkeys when set. */
export const CONTRACT_ID_VARS = [
  "TREASURY_CONTRACT_ID",
  "INVOICE_CONTRACT_ID",
  "USDC_CONTRACT_ID",
  "COMPLIANCE_CONTRACT_ID",
  "SETTLEMENT_CONTRACT_ID",
] as const

/** Stellar account public keys — must be valid G... strkeys when set. */
export const ACCOUNT_KEY_VARS = ["ADMIN_PUBLIC_KEY"] as const

/** Stellar secret seeds — must be valid S... strkeys when set. Values are never echoed. */
export const SECRET_SEED_VARS = ["SIGNER_SECRET_KEY"] as const

type Env = Record<string, string | undefined>

/** Returns one human-readable problem per invalid Stellar identifier in `env`. */
export function findInvalidStellarVars(env: Env): string[] {
  const problems: string[] = []

  for (const name of CONTRACT_ID_VARS) {
    const value = env[name]
    if (value && !StrKey.isValidContract(value)) {
      problems.push(`${name} is not a valid Stellar contract id (expected C... address, got "${value}")`)
    }
  }

  for (const name of ACCOUNT_KEY_VARS) {
    const value = env[name]
    if (value && !StrKey.isValidEd25519PublicKey(value)) {
      problems.push(`${name} is not a valid Stellar account key (expected G... address, got "${value}")`)
    }
  }

  for (const name of SECRET_SEED_VARS) {
    const value = env[name]
    if (value && !StrKey.isValidEd25519SecretSeed(value)) {
      problems.push(`${name} is not a valid Stellar secret seed (expected S... key)`)
    }
  }

  return problems
}

/**
 * Throws a single error listing every missing required variable and every
 * malformed Stellar identifier, so operators can fix them all in one pass.
 */
export function validateEnv(env: Env = process.env): void {
  const missing = REQUIRED_ENV_VARS.filter((name) => !env[name]?.trim())
  const invalid = findInvalidStellarVars(env)

  if (missing.length === 0 && invalid.length === 0) return

  const lines = [
    ...missing.map((name) => `  - ${name} is missing`),
    ...invalid.map((problem) => `  - ${problem}`),
  ]
  throw new Error(
    `Invalid backend environment:\n${lines.join("\n")}\n` +
      "Set the above variables to valid values before starting the backend.",
  )
}

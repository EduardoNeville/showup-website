import { query } from './index';

export interface ChallengeData {
  challengeId: string;
  title: string;
  durationDays: number;
  amountUsd: number;
  userEmail: string;
  guarantors?: string[];
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  metadataUri?: string;
  description?: string;
}

export interface ChallengeUpdateData {
  status?: string;
  onChainChallengeId?: string;
  transactionHash?: string;
  blockNumber?: bigint;
  startedAt?: Date;
  endsAt?: Date;
  errorMessage?: string;
}

/**
 * Insert a new challenge into the database
 */
export async function insertChallenge(data: ChallengeData): Promise<{ id: string }> {
  const sql = `
    INSERT INTO challenges (
      challenge_id, title, description, duration_days, amount_usd, user_email,
      guarantors, stripe_session_id, stripe_payment_intent_id, metadata_uri, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
    RETURNING id
  `;

  const params = [
    data.challengeId,
    data.title,
    data.description || '',
    data.durationDays,
    data.amountUsd,
    data.userEmail,
    JSON.stringify(data.guarantors || []),
    data.stripeSessionId,
    data.stripePaymentIntentId,
    data.metadataUri,
  ];

  const result = await query(sql, params);
  return { id: result.rows[0].id };
}

/**
 * Update a challenge with on-chain creation data
 */
export async function updateChallengeOnChain(
  challengeId: string,
  updateData: ChallengeUpdateData
): Promise<void> {
  const fields: string[] = [];
  const params: (string | number | bigint | Date | null)[] = [];
  let paramIndex = 1;

  if (updateData.status) {
    fields.push(`status = $${paramIndex++}`);
    params.push(updateData.status);
  }

  if (updateData.onChainChallengeId) {
    fields.push(`on_chain_challenge_id = $${paramIndex++}`);
    params.push(updateData.onChainChallengeId);
  }

  if (updateData.transactionHash) {
    fields.push(`transaction_hash = $${paramIndex++}`);
    params.push(updateData.transactionHash);
  }

  if (updateData.blockNumber) {
    fields.push(`block_number = $${paramIndex++}`);
    params.push(updateData.blockNumber);
  }

  if (updateData.startedAt) {
    fields.push(`started_at = $${paramIndex++}`);
    params.push(updateData.startedAt);
  }

  if (updateData.endsAt) {
    fields.push(`ends_at = $${paramIndex++}`);
    params.push(updateData.endsAt);
  }

  if (updateData.errorMessage) {
    fields.push(`error_message = $${paramIndex++}`);
    params.push(updateData.errorMessage);
  }

  if (fields.length === 0) {
    return; // Nothing to update
  }

  const sql = `
    UPDATE challenges
    SET ${fields.join(', ')}
    WHERE challenge_id = $${paramIndex}
  `;

  params.push(challengeId);

  await query(sql, params);
}

/**
 * Get a challenge by challenge_id
 */
export async function getChallengeById(challengeId: string) {
  const sql = 'SELECT * FROM challenges WHERE challenge_id = $1';
  const result = await query(sql, [challengeId]);
  return result.rows[0] || null;
}

/**
 * Get challenges by user email
 */
export async function getChallengesByUserEmail(userEmail: string) {
  const sql = 'SELECT * FROM challenges WHERE user_email = $1 ORDER BY created_at DESC';
  const result = await query(sql, [userEmail]);
  return result.rows;
}

/**
 * Get pending challenges (for retry logic)
 */
export async function getPendingChallenges() {
  const sql = "SELECT * FROM challenges WHERE status = 'pending' ORDER BY created_at ASC";
  const result = await query(sql);
  return result.rows;
}

/**
 * Mark challenge as failed with error message
 */
export async function markChallengeFailed(challengeId: string, errorMessage: string): Promise<void> {
  await updateChallengeOnChain(challengeId, { status: 'failed', errorMessage });
}

/**
 * Retry failed challenges (basic implementation)
 * This should be called periodically or via a cron job
 */
export async function retryFailedChallenges(): Promise<void> {
  const failedChallenges = await query(
    "SELECT * FROM challenges WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at ASC"
  );

  console.log(`Found ${failedChallenges.rows.length} failed challenges to retry`);

  // TODO: Implement actual retry logic by calling createChallengeOnChain again
  // This would require access to the escrow service and proper parameters reconstruction
}
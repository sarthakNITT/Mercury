export function calculateRiskScore(params: {
  amount: number;
  recentTxns: number;
  userCreatedAt?: Date | null;
}) {
  const { amount, recentTxns, userCreatedAt } = params;
  let riskScore = 0;
  const reasons: string[] = [];

  // 1. Amount Rules
  if (amount >= 200000) {
    // 2000.00
    riskScore += 25;
    reasons.push("High Transaction Value");
  }

  // 2. Velocity Rules
  if (recentTxns > 3) {
    riskScore += 30;
    reasons.push("High Purchase Velocity");
  }

  // 3. User History
  // New account check (simplified)
  if (
    userCreatedAt &&
    Date.now() - userCreatedAt.getTime() < 24 * 60 * 60 * 1000
  ) {
    riskScore += 15;
    reasons.push("New Account");
  }

  // Decision
  let decision: "ALLOW" | "CHALLENGE" | "BLOCK" = "ALLOW";
  if (riskScore > 80) decision = "BLOCK";
  else if (riskScore > 40) decision = "CHALLENGE";

  return { decision, riskScore, reasons };
}

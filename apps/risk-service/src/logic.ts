export type RiskRule = {
  name: string;
  weight: number;
  conditionJson: Record<string, any>;
};

export function calculateRiskScore(
  params: {
    amount: number;
    recentTxns: number;
    userCreatedAt?: Date | null;
  },
  rules: RiskRule[],
) {
  const { amount, recentTxns, userCreatedAt } = params;
  let riskScore = 0;
  const reasons: string[] = [];

  // Fallback Rules (if no dynamic rules provided)
  if (!rules || rules.length === 0) {
    if (amount >= 200000) {
      riskScore += 25;
      reasons.push("High Transaction Value");
    }
    if (recentTxns > 3) {
      riskScore += 30;
      reasons.push("High Purchase Velocity");
    }
    if (
      userCreatedAt &&
      Date.now() - userCreatedAt.getTime() < 24 * 60 * 60 * 1000
    ) {
      riskScore += 15;
      reasons.push("New Account");
    }
  } else {
    // Dynamic Execution
    for (const rule of rules) {
      let matches = false;
      // Simple condition evaluator
      // Supports: minAmount, maxRecentTxns, isNewAccount
      const cond = rule.conditionJson;

      if (cond.minAmount !== undefined) {
        if (amount >= cond.minAmount) matches = true;
        else matches = false;
      }
      // For separate independent rules, we should check matches per rule condition type,
      // but for MVP let's assume one condition type per rule or AND logic.
      // Let's effectively map hardcoded logic to these keys.

      // Refined Logic (OR implicitly between rules, AND within a rule)
      let ruleMatch = true;

      if (cond.minAmount !== undefined && amount < cond.minAmount)
        ruleMatch = false;
      if (cond.minVelocity !== undefined && recentTxns < cond.minVelocity)
        ruleMatch = false;
      if (cond.isNewAccount === true) {
        const isNew =
          userCreatedAt &&
          Date.now() - userCreatedAt.getTime() < 24 * 60 * 60 * 1000;
        if (!isNew) ruleMatch = false;
      }

      // If condition object was empty, ignore rule? Or always true?
      // Assuming rules have at least one condition.
      if (Object.keys(cond).length === 0) ruleMatch = false;

      if (ruleMatch) {
        riskScore += rule.weight;
        reasons.push(rule.name);
      }
    }
  }

  // Decision
  let decision: "ALLOW" | "CHALLENGE" | "BLOCK" = "ALLOW";
  // Could also make thresholds dynamic, but keep hardcoded for this phase's scope (weights/rules dynamic)
  if (riskScore > 80) decision = "BLOCK";
  else if (riskScore > 40) decision = "CHALLENGE";

  return { decision, riskScore, reasons };
}

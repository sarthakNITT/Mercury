import * as tf from "@tensorflow/tfjs-node";

// Simple TF Model (Functional way to ensure deterministic weights)
// We will simulate a trained model by using fixed weights.
// Features: [categoryMatch (0/1), trendingScore (0-1), userAffinity (0/1), priceBucket (0-1)]
const MODEL_WEIGHTS = tf.tensor1d([0.3, 0.5, 0.2, -0.1]); // weights
const MODEL_BIAS = tf.scalar(0.05);

export function predictScore(features: number[]) {
  return tf.tidy(() => {
    const input = tf.tensor1d(features);
    // Dot product + bias
    const score = input.dot(MODEL_WEIGHTS).add(MODEL_BIAS);
    // Sigmoid to keep between 0-1, then scale up
    return score.sigmoid().mul(100).dataSync()[0] || 0;
  });
}

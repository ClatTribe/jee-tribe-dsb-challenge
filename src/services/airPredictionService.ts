/**
 * PrepTribe AIR (All India Rank) Prediction Service
 * Calculates predicted rank based on score, historical data, and statistical modeling
 */

// Constants for JEE Mains distribution modeling
const TOTAL_CANDIDATES = 1_200_000; // 12 lakh candidates
const JEE_MEAN_SCORE = 90; // Mean score out of 300
const JEE_STDDEV = 45; // Standard deviation out of 300
const MAX_JEE_SCORE = 300; // Maximum possible score

/**
 * Interface representing the predicted AIR and related metrics
 */
export interface PredictedAIR {
  predictedRank: number;
  rankRange: {
    low: number;
    high: number;
  };
  percentile: number;
  normalizedScore: number;
  trend: 'improving' | 'declining' | 'stable';
  category: string;
  previousRank: number | null;
}

/**
 * Approximation of error function (erf) for normal CDF calculation
 * Uses Abramowitz and Stegun approximation for accuracy
 */
function erf(x: number): number {
  // Save the sign of x
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  // Coefficients for approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Abramowitz and Stegun approximation
  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Calculate the cumulative distribution function (CDF) of a normal distribution
 * Uses error function approximation
 */
function normalCDF(x: number, mean: number, stddev: number): number {
  const z = (x - mean) / (stddev * Math.sqrt(2));
  return (1 + erf(z)) / 2;
}

/**
 * Normalize a score to JEE equivalent (out of 300)
 * @param score - Student's actual score
 * @param maxScore - Maximum possible score in the student's test
 * @returns Normalized score out of 300
 */
function normalizeScore(score: number, maxScore: number): number {
  if (maxScore <= 0) {
    throw new Error('maxScore must be greater than 0');
  }
  return (score / maxScore) * MAX_JEE_SCORE;
}

/**
 * Calculate percentile based on normalized score using normal distribution
 * @param normalizedScore - Score normalized to JEE scale (0-300)
 * @returns Percentile (0-100)
 */
function calculatePercentile(normalizedScore: number): number {
  const cdf = normalCDF(normalizedScore, JEE_MEAN_SCORE, JEE_STDDEV);
  return cdf * 100;
}

/**
 * Calculate predicted AIR (All India Rank) from percentile
 * @param percentile - Percentile score (0-100)
 * @returns Predicted rank
 */
function calculateRankFromPercentile(percentile: number): number {
  // Percentile to rank conversion: rank = (100 - percentile) / 100 * total_candidates
  const rank = Math.round(((100 - percentile) / 100) * TOTAL_CANDIDATES);
  return Math.max(1, rank); // Minimum rank is 1
}

/**
 * Determine category based on percentile
 * @param percentile - Percentile score
 * @returns Category string with emoji
 */
function getCategory(percentile: number): string {
  if (percentile >= 99.5) {
    return 'IIT Possible 🎯';
  } else if (percentile >= 98) {
    return 'NIT Likely 🔥';
  } else if (percentile >= 95) {
    return 'Top Private 💪';
  } else if (percentile >= 90) {
    return 'Good Score 📈';
  } else {
    return 'Keep Pushing 🚀';
  }
}

/**
 * Determine trend by comparing current and previous scores
 * @param currentScore - Current normalized score
 * @param previousScore - Previous normalized score (average)
 * @returns Trend indicator
 */
function calculateTrend(
  currentScore: number,
  previousScore: number
): 'improving' | 'declining' | 'stable' {
  const difference = currentScore - previousScore;
  const threshold = 5; // Consider 5 points difference as significant

  if (difference > threshold) {
    return 'improving';
  } else if (difference < -threshold) {
    return 'declining';
  } else {
    return 'stable';
  }
}

/**
 * Generate rank range with confidence interval (±15% of rank)
 * @param predictedRank - The predicted rank
 * @returns Rank range object
 */
function getRankRange(predictedRank: number): {
  low: number;
  high: number;
} {
  const margin = Math.round(predictedRank * 0.15); // 15% confidence interval
  return {
    low: Math.max(1, predictedRank - margin),
    high: predictedRank + margin,
  };
}

/**
 * Pure calculation function: Calculate predicted AIR from score and max score
 * @param score - Student's actual score
 * @param maxScore - Maximum possible score
 * @returns Predicted AIR with all metrics
 */
export function calculatePredictedAIR(
  score: number,
  maxScore: number
): PredictedAIR {
  try {
    // Validate inputs
    if (score < 0 || maxScore <= 0) {
      throw new Error('Invalid score or maxScore values');
    }

    if (score > maxScore) {
      throw new Error('Score cannot be greater than maxScore');
    }

    // Normalize score to JEE scale (0-300)
    const normalizedScore = normalizeScore(score, maxScore);

    // Calculate percentile
    const percentile = calculatePercentile(normalizedScore);

    // Calculate predicted rank
    const predictedRank = calculateRankFromPercentile(percentile);

    // Generate rank range
    const rankRange = getRankRange(predictedRank);

    // Determine category
    const category = getCategory(percentile);

    return {
      predictedRank,
      rankRange,
      percentile: Math.round(percentile * 100) / 100, // Round to 2 decimal places
      normalizedScore: Math.round(normalizedScore * 100) / 100,
      trend: 'stable', // No historical data in this function
      category,
      previousRank: null,
    };
  } catch (error) {
    console.error('Error calculating predicted AIR:', error);
    throw error;
  }
}

/**
 * Calculate predicted AIR from historical data (last 5 attempts)
 * @param historyData - Array of historical attempt data from Firestore
 * @returns Predicted AIR with trend analysis
 */
export function getAIRFromHistory(historyData: any[]): PredictedAIR {
  try {
    if (!historyData || historyData.length === 0) {
      throw new Error('No history data provided');
    }

    // Sort by date (assuming historyData has a date field) and take last 5 attempts
    const sortedData = historyData
      .sort(
        (a, b) =>
          new Date(b.timestamp || b.date || 0).getTime() -
          new Date(a.timestamp || a.date || 0).getTime()
      )
      .slice(0, 5);

    if (sortedData.length === 0) {
      throw new Error('No valid history entries found');
    }

    // Calculate normalized scores for all attempts
    const normalizedScores = sortedData.map((attempt) => {
      const score = attempt.totalScore || attempt.score || 0;
      const maxScore = attempt.maxScore || 300;
      return normalizeScore(score, maxScore);
    });

    // Calculate average score
    const currentNormalizedScore =
      normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;

    // Calculate percentile and rank for current average
    const percentile = calculatePercentile(currentNormalizedScore);
    const predictedRank = calculateRankFromPercentile(percentile);
    const rankRange = getRankRange(predictedRank);
    const category = getCategory(percentile);

    // Calculate trend (comparing last attempt vs average of all)
    const lastAttemptScore = normalizedScores[0];
    const previousAverage =
      normalizedScores.length > 1
        ? normalizedScores.slice(1).reduce((a, b) => a + b, 0) /
          (normalizedScores.length - 1)
        : lastAttemptScore;

    const trend = calculateTrend(lastAttemptScore, previousAverage);

    // Calculate previous rank (from attempt before last)
    let previousRank: number | null = null;
    if (normalizedScores.length > 1) {
      const previousPercentile = calculatePercentile(normalizedScores[1]);
      previousRank = calculateRankFromPercentile(previousPercentile);
    }

    return {
      predictedRank,
      rankRange,
      percentile: Math.round(percentile * 100) / 100,
      normalizedScore: Math.round(currentNormalizedScore * 100) / 100,
      trend,
      category,
      previousRank,
    };
  } catch (error) {
    console.error('Error calculating AIR from history:', error);
    throw error;
  }
}

/**
 * Batch calculate AIR predictions for multiple students
 * Useful for dashboard/analytics
 */
export function batchCalculateAIR(
  students: Array<{ score: number; maxScore: number; id?: string }>
): Array<PredictedAIR & { studentId?: string }> {
  return students.map((student) => ({
    ...calculatePredictedAIR(student.score, student.maxScore),
    studentId: student.id,
  }));
}

/**
 * Get statistics about a group of predictions
 * Useful for cohort analysis
 */
export interface CohortStats {
  averagePercentile: number;
  medianRank: number;
  topPerformerRank: number;
  improvementRate: number; // percentage of students improving
}

export function getCohortStatistics(predictions: PredictedAIR[]): CohortStats {
  if (predictions.length === 0) {
    throw new Error('No predictions provided for cohort analysis');
  }

  const ranks = predictions.map((p) => p.predictedRank);
  const percentiles = predictions.map((p) => p.percentile);

  // Calculate average percentile
  const averagePercentile =
    percentiles.reduce((a, b) => a + b, 0) / percentiles.length;

  // Calculate median rank
  const sortedRanks = [...ranks].sort((a, b) => a - b);
  const medianRank =
    sortedRanks.length % 2 === 0
      ? (sortedRanks[sortedRanks.length / 2 - 1] +
          sortedRanks[sortedRanks.length / 2]) /
        2
      : sortedRanks[Math.floor(sortedRanks.length / 2)];

  // Get best rank
  const topPerformerRank = Math.min(...ranks);

  // Calculate improvement rate
  const improvingCount = predictions.filter(
    (p) => p.trend === 'improving'
  ).length;
  const improvementRate = (improvingCount / predictions.length) * 100;

  return {
    averagePercentile: Math.round(averagePercentile * 100) / 100,
    medianRank: Math.round(medianRank),
    topPerformerRank,
    improvementRate: Math.round(improvementRate * 100) / 100,
  };
}

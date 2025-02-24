/**
 * Calculate the correlation coefficient between two arrays of numbers
 */
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  // Calculate means
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  // Calculate covariance and standard deviations
  let covariance = 0;
  let xStdDev = 0;
  let yStdDev = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    covariance += xDiff * yDiff;
    xStdDev += xDiff * xDiff;
    yStdDev += yDiff * yDiff;
  }

  xStdDev = Math.sqrt(xStdDev / n);
  yStdDev = Math.sqrt(yStdDev / n);

  // Calculate correlation coefficient
  if (xStdDev === 0 || yStdDev === 0) return 0;
  return covariance / (n * xStdDev * yStdDev);
}

/**
 * Calculate correlations between all rating types
 */
export function calculateCorrelations(feedback: Array<{ rating_field: Record<string, number> }>) {
  if (!feedback || feedback.length === 0) {
    console.warn('No feedback data provided for correlation calculation');
    return {};
  }

  // Log first feedback item for debugging
  console.log('First feedback item:', feedback[0]);

  // Get all rating types
  const ratingTypes = Object.keys(feedback[0].rating_field || {}).sort();
  console.log('Rating types:', ratingTypes);

  if (ratingTypes.length === 0) {
    console.warn('No rating types found in feedback data');
    return {};
  }

  // Initialize correlation matrix
  const correlations: Record<string, Record<string, number>> = {};
  
  // Calculate correlations for each pair of rating types
  ratingTypes.forEach(type1 => {
    correlations[type1] = {};
    
    ratingTypes.forEach(type2 => {
      // Get arrays of ratings for both types
      const ratings1: number[] = [];
      const ratings2: number[] = [];
      
      feedback.forEach(item => {
        const r1 = Number(item.rating_field[type1]);
        const r2 = Number(item.rating_field[type2]);
        
        if (!isNaN(r1) && !isNaN(r2)) {
          ratings1.push(r1);
          ratings2.push(r2);
        }
      });

      // Log ratings arrays for debugging
      if (ratings1.length === 0 || ratings2.length === 0) {
        console.warn(`No valid ratings found for ${type1} and/or ${type2}`);
      }
      
      // Calculate correlation
      const correlation = type1 === type2 ? 1 : calculateCorrelation(ratings1, ratings2);
      correlations[type1][type2] = Number(correlation.toFixed(2));
    });
  });
  
  return correlations;
}

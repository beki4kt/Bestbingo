/**
 * Generates a random Bingo card with 5 columns (B,I,N,G,O)
 * Each column has numbers in a specific range:
 * B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
 * The center spot (N column, 3rd row) is a FREE space
 */
export function generateBingoCard(): number[][] {
  const card: number[][] = [];
  
  // Generate the B column (1-15)
  const bColumn = generateUniqueNumbers(1, 15, 5);
  card.push(bColumn);
  
  // Generate the I column (16-30)
  const iColumn = generateUniqueNumbers(16, 30, 5);
  card.push(iColumn);
  
  // Generate the N column (31-45) with middle spot as 0 (FREE)
  const nColumn = generateUniqueNumbers(31, 45, 5);
  nColumn[2] = 0; // Set the middle spot as FREE
  card.push(nColumn);
  
  // Generate the G column (46-60)
  const gColumn = generateUniqueNumbers(46, 60, 5);
  card.push(gColumn);
  
  // Generate the O column (61-75)
  const oColumn = generateUniqueNumbers(61, 75, 5);
  card.push(oColumn);
  
  return card;
}

/**
 * Generate unique random numbers within a range
 */
function generateUniqueNumbers(min: number, max: number, count: number): number[] {
  const numbers: number[] = [];
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers;
}

/**
 * Generate a random game ID
 */
export function generateGameId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let id = '';
  
  // Add 2 random letters
  for (let i = 0; i < 2; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Add 4 random numbers
  for (let i = 0; i < 4; i++) {
    id += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return id;
}

/**
 * Check if a player has a BINGO
 * Valid patterns are:
 * - Any complete row
 * - Any complete column
 * - Either diagonal
 */
export function checkBingo(cardNumbers: number[][], markedNumbers: number[]): boolean {
  // Convert the card to a 5x5 grid format
  const grid: number[][] = [
    [cardNumbers[0][0], cardNumbers[1][0], cardNumbers[2][0], cardNumbers[3][0], cardNumbers[4][0]],
    [cardNumbers[0][1], cardNumbers[1][1], cardNumbers[2][1], cardNumbers[3][1], cardNumbers[4][1]],
    [cardNumbers[0][2], cardNumbers[1][2], cardNumbers[2][2], cardNumbers[3][2], cardNumbers[4][2]],
    [cardNumbers[0][3], cardNumbers[1][3], cardNumbers[2][3], cardNumbers[3][3], cardNumbers[4][3]],
    [cardNumbers[0][4], cardNumbers[1][4], cardNumbers[2][4], cardNumbers[3][4], cardNumbers[4][4]],
  ];
  
  // Check rows
  for (let i = 0; i < 5; i++) {
    if (grid[i].every(num => num === 0 || markedNumbers.includes(num))) {
      return true;
    }
  }
  
  // Check columns
  for (let i = 0; i < 5; i++) {
    if (grid.every(row => row[i] === 0 || markedNumbers.includes(row[i]))) {
      return true;
    }
  }
  
  // Check diagonal 1 (top-left to bottom-right)
  if ([0, 1, 2, 3, 4].every(i => grid[i][i] === 0 || markedNumbers.includes(grid[i][i]))) {
    return true;
  }
  
  // Check diagonal 2 (top-right to bottom-left)
  if ([0, 1, 2, 3, 4].every(i => grid[i][4-i] === 0 || markedNumbers.includes(grid[i][4-i]))) {
    return true;
  }
  
  return false;
}

/**
 * Get letter for a bingo number
 */
export function getBingoLetter(number: number): string {
  if (number <= 15) return 'B';
  if (number <= 30) return 'I';
  if (number <= 45) return 'N';
  if (number <= 60) return 'G';
  return 'O';
}

/**
 * Format a number to include the BINGO letter
 */
export function formatBingoNumber(number: number | null): string {
  if (number === null) return '-';
  return `${getBingoLetter(number)}-${number}`;
}
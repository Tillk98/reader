import type { Word } from '../data/lesson';

export interface Page {
  words: Word[];
}

/**
 * Calculate how many pages are needed to display all words
 * This is a simplified version - actual pagination will be done
 * by measuring rendered content in the Reader component
 */
export function calculatePages(
  words: Word[],
  containerWidth: number,
  containerHeight: number
): Page[] {
  // This is a placeholder - actual pagination will be done
  // by measuring the rendered content in the browser
  // For now, we'll return a single page with all words
  // The Reader component will handle actual pagination by measuring
  
  if (words.length === 0) {
    return [];
  }

  // Simple heuristic: estimate words per page
  // This will be refined by actual measurement in the component
  const estimatedWordsPerLine = Math.floor(containerWidth / 100); // rough estimate
  const estimatedLinesPerPage = Math.floor(containerHeight / 25); // rough estimate
  const estimatedWordsPerPage = estimatedWordsPerLine * estimatedLinesPerPage;

  const pages: Page[] = [];
  let currentPage: Word[] = [];

  for (const word of words) {
    currentPage.push(word);
    
    if (currentPage.length >= estimatedWordsPerPage) {
      pages.push({ words: [...currentPage] });
      currentPage = [];
    }
  }

  if (currentPage.length > 0) {
    pages.push({ words: currentPage });
  }

  return pages.length > 0 ? pages : [{ words }];
}

/**
 * Get all words from the lesson in order
 */
export function getAllWords(words: Word[]): Word[] {
  return words;
}

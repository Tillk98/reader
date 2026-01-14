import React, { useState, useEffect, useRef, useCallback } from 'react';
import { lesson } from '../data/lesson';
import type { Word } from '../data/lesson';
import { Page as PageComponent } from './Page';
import { NavigationChevrons } from './NavigationChevrons';
import { WordToolbar } from './WordToolbar';
import { WordDetailPanel } from './WordDetailPanel';
import './Reader.css';

interface Page {
  words: Word[];
}

export const Reader: React.FC = () => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState<Page[]>([]);
  const [clickedWords, setClickedWords] = useState<Set<string>>(new Set());
  const [knownWords, setKnownWords] = useState<Set<string>>(new Set());
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set());
  const [wordLevels, setWordLevels] = useState<Map<string, number>>(new Map());
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [detailPanelView, setDetailPanelView] = useState('meanings');
  const [detailWordId, setDetailWordId] = useState<string | null>(null);
  const [chevronVisible, setChevronVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseActivityTimeoutRef = useRef<number | null>(null);

  // Get all words from the lesson
  const allWords = React.useMemo(() => {
    const words: Word[] = [];
    lesson.sentences.forEach(sentence => {
      sentence.words.forEach(word => {
        words.push(word);
      });
    });
    return words;
  }, []);

  // Calculate pages based on container dimensions
  const calculatePages = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) {
      // Fallback: create a single page with all words
      if (allWords.length > 0) {
        setPages([{ words: allWords }]);
      }
      return;
    }

    // Create a temporary hidden container to measure text accurately
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    // Use max-width of 600px for text content (matching page-content max-width)
    const contentWidth = Math.min(containerWidth, 600);
    tempContainer.style.width = `${contentWidth}px`;
    tempContainer.style.paddingTop = '8px';
    tempContainer.style.paddingBottom = '8px';
    tempContainer.style.paddingLeft = '1px';
    tempContainer.style.paddingRight = '1px';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.fontFamily = 'Lora, serif';
    tempContainer.style.fontSize = '18px';
    tempContainer.style.lineHeight = '37.8px';
    tempContainer.style.whiteSpace = 'normal';
    tempContainer.style.wordWrap = 'break-word';
    tempContainer.style.overflow = 'visible';
    document.body.appendChild(tempContainer);

    const newPages: Page[] = [];
    let currentPage: Word[] = [];
    const pagePadding = 16; // 8px top + 8px bottom
    const titleHeight = 80; // Approximate title height
    const availableHeight = containerHeight - pagePadding - titleHeight;

    // Build pages by measuring accumulated height with actual word spans
    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];
      
      // Create a span for the word (matching the actual Word component styling)
      const wordSpan = document.createElement('span');
      wordSpan.textContent = word.text;
      wordSpan.style.display = 'inline-block';
      wordSpan.style.padding = '2px 1px';
      wordSpan.style.fontFamily = 'Lora, serif';
      wordSpan.style.fontSize = '18px';
      wordSpan.style.lineHeight = '37.8px';
      tempContainer.appendChild(wordSpan);
      
      // Add space after word (except for last word)
      if (i < allWords.length - 1) {
        tempContainer.appendChild(document.createTextNode(' '));
      }

      // Measure the current height
      const measuredHeight = tempContainer.offsetHeight;

      // If we've exceeded the available height, start a new page
      if (measuredHeight > availableHeight && currentPage.length > 0) {
        // Remove the last word and space from temp container
        if (tempContainer.lastChild) {
          tempContainer.removeChild(tempContainer.lastChild);
        }
        if (tempContainer.lastChild) {
          tempContainer.removeChild(tempContainer.lastChild);
        }
        
        // Save current page (without the last word that caused overflow)
        newPages.push({ words: [...currentPage] });
        
        // Start new page with current word
        currentPage = [word];
        tempContainer.innerHTML = '';
        const newWordSpan = document.createElement('span');
        newWordSpan.textContent = word.text;
        newWordSpan.style.display = 'inline-block';
        newWordSpan.style.padding = '2px 1px';
        newWordSpan.style.fontFamily = 'Lora, serif';
        newWordSpan.style.fontSize = '18px';
        newWordSpan.style.lineHeight = '37.8px';
        tempContainer.appendChild(newWordSpan);
        if (i < allWords.length - 1) {
          tempContainer.appendChild(document.createTextNode(' '));
        }
      } else {
        currentPage.push(word);
      }
    }

    // Add the last page if it has words
    if (currentPage.length > 0) {
      newPages.push({ words: currentPage });
    }

    document.body.removeChild(tempContainer);

    // Ensure we have at least one page
    if (newPages.length === 0 && allWords.length > 0) {
      newPages.push({ words: allWords });
    }

    setPages(newPages);
    
    // Adjust current page index if it's out of bounds
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(Math.max(0, newPages.length - 1));
    }
  }, [allWords, currentPageIndex]);

  // Recalculate pages on mount and window resize
  useEffect(() => {
    if (!containerRef.current) return;

    // Use ResizeObserver to detect when container gets dimensions
    const resizeObserver = new ResizeObserver(() => {
      calculatePages();
    });

    resizeObserver.observe(containerRef.current);

    // Also listen to window resize
    const handleResize = () => {
      calculatePages();
    };

    window.addEventListener('resize', handleResize);
    
    // Initial calculation
    calculatePages();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [calculatePages]);

  // Handle mouse activity for chevron visibility
  const handleMouseMove = useCallback(() => {
    setChevronVisible(true);
    
    if (mouseActivityTimeoutRef.current) {
      clearTimeout(mouseActivityTimeoutRef.current);
    }
    
    mouseActivityTimeoutRef.current = window.setTimeout(() => {
      setChevronVisible(false);
    }, 2500);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseActivityTimeoutRef.current) {
        clearTimeout(mouseActivityTimeoutRef.current);
      }
    };
  }, [handleMouseMove]);

  const handleWordClick = useCallback((wordId: string) => {
    // If word is known or ignored, don't show toolbar
    if (knownWords.has(wordId) || ignoredWords.has(wordId)) {
      return;
    }
    
    // Toggle selection - if already selected, close toolbar; otherwise open it
    if (selectedWordId === wordId) {
      setSelectedWordId(null);
    } else {
      setSelectedWordId(wordId);
      // Also mark as clicked for highlighting
      setClickedWords(prev => {
        const newSet = new Set(prev);
        if (!newSet.has(wordId)) {
          newSet.add(wordId);
        }
        return newSet;
      });
    }
  }, [selectedWordId, knownWords, ignoredWords]);

  const handleMarkAsKnown = useCallback((wordId: string) => {
    setKnownWords(prev => new Set(prev).add(wordId));
    setClickedWords(prev => {
      const newSet = new Set(prev);
      newSet.delete(wordId);
      return newSet;
    });
  }, []);

  const handleIgnore = useCallback((wordId: string) => {
    setIgnoredWords(prev => new Set(prev).add(wordId));
    setClickedWords(prev => {
      const newSet = new Set(prev);
      newSet.delete(wordId);
      return newSet;
    });
  }, []);

  const getWordLevel = useCallback((wordId: string) => {
    return wordLevels.get(wordId) ?? 1;
  }, [wordLevels]);

  const handleSetWordLevel = useCallback((wordId: string, level: number) => {
    setWordLevels(prev => {
      const next = new Map(prev);
      const nextLevel = Math.max(1, Math.min(4, level));
      next.set(wordId, nextLevel);
      return next;
    });
  }, []);

  const handleOpenAIChat = useCallback((wordText: string) => {
    // TODO: Implement AI chat functionality
    console.log('Open AI chat for word:', wordText);
    // This would open a chat interface with Lynx AI
  }, []);

  const handleInspectSentence = useCallback((wordId: string) => {
    // Find the sentence containing this word
    for (const sentence of lesson.sentences) {
      if (sentence.words.some(w => w.id === wordId)) {
        console.log('Inspect sentence:', sentence.words.map(w => w.text).join(' '));
        // TODO: Implement sentence inspection UI
        break;
      }
    }
  }, []);

  // Find word by ID
  const getWordById = useCallback((wordId: string): Word | undefined => {
    for (const sentence of lesson.sentences) {
      const word = sentence.words.find(w => w.id === wordId);
      if (word) return word;
    }
    return undefined;
  }, []);

  const handleOpenDetailPanel = useCallback((view: string, wordId: string) => {
    setDetailPanelView(view);
    setDetailWordId(wordId);
    setDetailPanelOpen(true);
  }, []);

  const handleCloseDetailPanel = useCallback(() => {
    setDetailPanelOpen(false);
  }, []);

  // Get word element from DOM
  const getWordElement = useCallback((wordId: string): HTMLElement | null => {
    return document.getElementById(wordId);
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentPageIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1));
  }, [pages.length]);

  const [hoveredPageIndex, setHoveredPageIndex] = React.useState<number | null>(null);

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const pageIndex = Math.min(
      Math.max(0, Math.floor(percentage * pages.length)),
      pages.length - 1
    );
    setCurrentPageIndex(pageIndex);
  }, [pages.length]);

  const handleProgressBarMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = mouseX / rect.width;
    const pageIndex = Math.min(
      Math.max(0, Math.floor(percentage * pages.length)),
      pages.length - 1
    );
    setHoveredPageIndex(pageIndex);
  }, [pages.length]);

  const handleProgressBarMouseLeave = useCallback(() => {
    setHoveredPageIndex(null);
  }, []);

  // Calculate progress: position thumb at the end of the fill progress
  const fillProgress = pages.length > 0 ? Math.min(100, ((currentPageIndex + 1) / pages.length) * 100) : 0;
  const thumbProgress = fillProgress;

  return (
    <div className={`reader ${detailPanelOpen ? 'panel-open' : ''}`} ref={containerRef}>
      {pages.length === 0 ? (
        <div className="reader-loading">Loading...</div>
      ) : (
        <>
          <div className="reader-progress-container">
            <div 
              className="reader-progress-bar"
              onClick={handleProgressBarClick}
              onMouseMove={handleProgressBarMouseMove}
              onMouseLeave={handleProgressBarMouseLeave}
            >
              <div 
                className="reader-progress-fill"
                style={{ width: `${fillProgress}%` }}
              />
              <div 
                className="reader-progress-thumb"
                style={{ left: `${thumbProgress}%` }}
              />
              {hoveredPageIndex !== null && (
                <div 
                  className="reader-progress-tooltip"
                  style={{ left: `${((hoveredPageIndex + 1) / pages.length) * 100}%` }}
                >
                  Page {hoveredPageIndex + 1}
                </div>
              )}
            </div>
          </div>
          <div className={`reader-content ${detailPanelOpen ? 'panel-open' : ''}`}>
            <div 
              className="pages-container"
              style={{
                transform: `translateX(-${currentPageIndex * 100}%)`,
                transition: 'transform 0.3s ease-in-out'
              }}
            >
              {pages.map((page, index) => (
                <div key={index} className="page-wrapper">
                  <PageComponent
                    words={page.words}
                    clickedWords={clickedWords}
                    onWordClick={handleWordClick}
                    knownWords={knownWords}
                    ignoredWords={ignoredWords}
                  />
                </div>
              ))}
            </div>
            <NavigationChevrons
              onPrevious={handlePrevious}
              onNext={handleNext}
              canGoPrevious={currentPageIndex > 0}
              canGoNext={currentPageIndex < pages.length - 1}
              visible={chevronVisible}
            />
          </div>
          <WordDetailPanel
            isOpen={detailPanelOpen}
            view={detailPanelView}
            word={detailWordId ? getWordById(detailWordId) : undefined}
            wordLevel={detailWordId ? getWordLevel(detailWordId) : 1}
            onClose={handleCloseDetailPanel}
          />
          {selectedWordId && (() => {
            const word = getWordById(selectedWordId);
            return word ? (
              <WordToolbar
                wordId={selectedWordId}
                wordText={word.text}
                wordTranslation={word.translation}
                wordElement={getWordElement(selectedWordId)}
                wordLevel={getWordLevel(selectedWordId)}
                onSetWordLevel={handleSetWordLevel}
                onOpenDetailPanel={handleOpenDetailPanel}
                onClose={() => setSelectedWordId(null)}
                onMarkAsKnown={handleMarkAsKnown}
                onIgnore={handleIgnore}
                onOpenAIChat={handleOpenAIChat}
                onInspectSentence={handleInspectSentence}
              />
            ) : null;
          })()}
        </>
      )}
    </div>
  );
};

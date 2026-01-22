import React, { useState, useEffect, useRef, useCallback } from 'react';
import { lesson } from '../data/lesson';
import type { Word } from '../data/lesson';
import { Page as PageComponent } from './Page';
import { NavigationChevrons } from './NavigationChevrons';
import { WordToolbar } from './WordToolbar';
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
  const [lingqWords, setLingqWords] = useState<Set<string>>(new Set());
  const [phraseSelection, setPhraseSelection] = useState<{
    sentenceIndex: number;
    startIdx: number;
    endIdx: number;
  } | null>(null);
  const [invalidSelection, setInvalidSelection] = useState<{
    wordIds: string[];
    text: string;
  } | null>(null);
  const [isSelectingPhrase, setIsSelectingPhrase] = useState(false);
  const [didDragSelection, setDidDragSelection] = useState(false);
  const selectionAnchorRef = useRef<{ sentenceIndex: number; wordIndex: number; wordId: string } | null>(null);
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

  const wordOrder = React.useMemo(() => allWords.map(word => word.id), [allWords]);
  const wordIndexMap = React.useMemo(() => {
    const map = new Map<string, number>();
    wordOrder.forEach((id, index) => map.set(id, index));
    return map;
  }, [wordOrder]);
  const wordTextMap = React.useMemo(() => {
    const map = new Map<string, string>();
    allWords.forEach(word => map.set(word.id, word.text));
    return map;
  }, [allWords]);

  const wordMeta = React.useMemo(() => {
    const map = new Map<string, { sentenceIndex: number; wordIndex: number }>();
    lesson.sentences.forEach((sentence, sentenceIndex) => {
      sentence.words.forEach((word, wordIndex) => {
        map.set(word.id, { sentenceIndex, wordIndex });
      });
    });
    return map;
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
    if (didDragSelection) {
      setDidDragSelection(false);
      return;
    }
    // If word is known or ignored, don't show toolbar
    if (knownWords.has(wordId) || ignoredWords.has(wordId)) {
      return;
    }
    
    // Toggle selection - if already selected, close toolbar; otherwise open it
    if (selectedWordId === wordId) {
      setSelectedWordId(null);
      setPhraseSelection(null);
      setInvalidSelection(null);
      setClickedWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordId);
        return newSet;
      });
    } else {
      setSelectedWordId(wordId);
      setPhraseSelection(null);
      setInvalidSelection(null);
      setLingqWords(prev => new Set(prev).add(wordId));
      // Also mark as clicked for highlighting
      setClickedWords(prev => {
        const newSet = new Set(prev);
        if (!newSet.has(wordId)) {
          newSet.add(wordId);
        }
        return newSet;
      });
    }
  }, [selectedWordId, knownWords, ignoredWords, didDragSelection]);

  const updatePhraseSelection = useCallback(
    (anchor: { sentenceIndex: number; wordIndex: number }, currentIndex: number) => {
      const sentenceWords = lesson.sentences[anchor.sentenceIndex].words;
      const maxSpan = 9;
      let start = Math.min(anchor.wordIndex, currentIndex);
      let end = Math.max(anchor.wordIndex, currentIndex);
      const span = end - start + 1;
      if (span > maxSpan) {
        const selectedIds = sentenceWords.slice(start, end + 1).map(word => word.id);
        setClickedWords(new Set(selectedIds));
        setPhraseSelection(null);
        setInvalidSelection({
          wordIds: selectedIds,
          text: sentenceWords
            .slice(start, end + 1)
            .map(word => word.text)
            .join(' '),
        });
        setDidDragSelection(true);
        return;
      }

      setInvalidSelection(null);
      setPhraseSelection({ sentenceIndex: anchor.sentenceIndex, startIdx: start, endIdx: end });
      const selectedIds = sentenceWords.slice(start, end + 1).map(word => word.id);
      setClickedWords(new Set(selectedIds));
      if (selectedIds.length > 1) {
        setDidDragSelection(true);
      }
    },
    [lesson.sentences]
  );

  const handleWordPointerDown = useCallback(
    (wordId: string) => {
      if (knownWords.has(wordId) || ignoredWords.has(wordId)) {
        return;
      }
      const meta = wordMeta.get(wordId);
      if (!meta) return;
      selectionAnchorRef.current = { sentenceIndex: meta.sentenceIndex, wordIndex: meta.wordIndex, wordId };
      setIsSelectingPhrase(true);
      setDidDragSelection(false);
      setInvalidSelection(null);
      updatePhraseSelection(meta, meta.wordIndex);
    },
    [knownWords, ignoredWords, wordMeta, updatePhraseSelection]
  );

  const handleWordPointerEnter = useCallback(
    (wordId: string) => {
      if (!isSelectingPhrase || !selectionAnchorRef.current) return;
      const anchor = selectionAnchorRef.current;
      const meta = wordMeta.get(wordId);
      if (!meta) return;
      if (meta.sentenceIndex !== anchor.sentenceIndex) {
        const anchorIndex = wordIndexMap.get(anchor.wordId);
        const currentIndex = wordIndexMap.get(wordId);
        if (anchorIndex === undefined || currentIndex === undefined) return;
        const start = Math.min(anchorIndex, currentIndex);
        const end = Math.max(anchorIndex, currentIndex);
        const selectedIds = wordOrder.slice(start, end + 1);
        const text = selectedIds
          .map(id => wordTextMap.get(id))
          .filter((value): value is string => Boolean(value))
          .join(' ');
        setPhraseSelection(null);
        setInvalidSelection({ wordIds: selectedIds, text });
        setClickedWords(new Set(selectedIds));
        setDidDragSelection(true);
        return;
      }
      updatePhraseSelection(anchor, meta.wordIndex);
    },
    [isSelectingPhrase, wordMeta, wordIndexMap, wordOrder, wordTextMap, updatePhraseSelection]
  );

  const handleWordPointerUp = useCallback(() => {
    setIsSelectingPhrase(false);
    if (phraseSelection && selectionAnchorRef.current) {
      const span = phraseSelection.endIdx - phraseSelection.startIdx + 1;
      const sentenceWords = lesson.sentences[phraseSelection.sentenceIndex].words;
      const selectedIds = sentenceWords
        .slice(phraseSelection.startIdx, phraseSelection.endIdx + 1)
        .map(word => word.id);
      setLingqWords(prev => {
        const next = new Set(prev);
        selectedIds.forEach(id => next.add(id));
        return next;
      });
      if (span > 1) {
        setSelectedWordId(selectionAnchorRef.current.wordId);
      }
    }
    if (invalidSelection && selectionAnchorRef.current) {
      setSelectedWordId(selectionAnchorRef.current.wordId);
    }
    selectionAnchorRef.current = null;
  }, [phraseSelection, invalidSelection, lesson.sentences]);

  useEffect(() => {
    const handleWindowUp = () => {
      if (isSelectingPhrase) {
        handleWordPointerUp();
      }
    };
    window.addEventListener('mouseup', handleWindowUp);
    return () => window.removeEventListener('mouseup', handleWindowUp);
  }, [isSelectingPhrase, handleWordPointerUp]);

  const handleMarkAsKnown = useCallback((wordId: string) => {
    setKnownWords(prev => new Set(prev).add(wordId));
    setLingqWords(prev => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
    setClickedWords(prev => {
      const newSet = new Set(prev);
      newSet.delete(wordId);
      return newSet;
    });
  }, []);

  const handleIgnore = useCallback((wordId: string) => {
    setIgnoredWords(prev => new Set(prev).add(wordId));
    setLingqWords(prev => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
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
    <div className="reader" ref={containerRef}>
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
          <div className="reader-content">
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
                    lingqWords={lingqWords}
                    onWordClick={handleWordClick}
                    onWordPointerDown={handleWordPointerDown}
                    onWordPointerEnter={handleWordPointerEnter}
                    onWordPointerUp={handleWordPointerUp}
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
          {selectedWordId && (() => {
            const selectionWords = phraseSelection
              ? lesson.sentences[phraseSelection.sentenceIndex].words.slice(
                  phraseSelection.startIdx,
                  phraseSelection.endIdx + 1
                )
              : (() => {
                  const word = getWordById(selectedWordId);
                  return word ? [word] : [];
                })();

            if (selectionWords.length === 0) return null;
            const anchorId = selectionWords[0]?.id ?? selectedWordId;
            const anchorRect = (() => {
              if (selectionWords.length === 1) return undefined;
              const firstEl = getWordElement(selectionWords[0].id);
              const lastEl = getWordElement(selectionWords[selectionWords.length - 1].id);
              if (!firstEl || !lastEl) return undefined;
              const firstRect = firstEl.getBoundingClientRect();
              const lastRect = lastEl.getBoundingClientRect();
              const left = Math.min(firstRect.left, lastRect.left);
              const right = Math.max(firstRect.right, lastRect.right);
              const top = Math.min(firstRect.top, lastRect.top);
              const bottom = Math.max(firstRect.bottom, lastRect.bottom);
              return new DOMRect(left, top, right - left, bottom - top);
            })();

            const phraseText = selectionWords.map(word => word.text).join(' ');
            const phraseTranslation = selectionWords
              .map(word => word.translation || word.text)
              .join(' ');
            const invalidText = invalidSelection?.text
              ? (() => {
                  const words = invalidSelection.text.trim().split(/\s+/);
                  if (words.length <= 9) return invalidSelection.text;
                  return `${words.slice(0, 9).join(' ')}…`;
                })()
              : undefined;

            return (
              <WordToolbar
                wordId={anchorId}
                wordText={phraseText}
                wordTranslation={phraseTranslation}
                wordElement={getWordElement(anchorId)}
                wordLevel={getWordLevel(anchorId)}
                anchorRect={anchorRect}
                invalidSelectionText={invalidText}
                onSetWordLevel={handleSetWordLevel}
                onClose={() => {
                  setSelectedWordId(null);
                  setPhraseSelection(null);
                  setInvalidSelection(null);
                  setClickedWords(new Set());
                }}
                onMarkAsKnown={handleMarkAsKnown}
                onIgnore={handleIgnore}
                onOpenAIChat={handleOpenAIChat}
                onInspectSentence={handleInspectSentence}
              />
            );
          })()}
        </>
      )}
    </div>
  );
};

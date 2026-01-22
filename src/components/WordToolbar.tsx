import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  EyeOff,
  MessageSquare,
  NotebookPen,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import englishFlag from '../assets/english-flag.png';
import lynxIcon from '../assets/lynx-icon.png';
import sentenceReviewIcon from '../assets/sentence_review_icon.png';
import { WordStatusIndicator } from './WordStatusIndicator';
import './WordToolbar.css';

interface WordToolbarProps {
  wordId: string;
  wordText: string;
  wordTranslation?: string;
  wordElement: HTMLElement | null;
  wordLevel: number;
  onSetWordLevel: (wordId: string, level: number) => void;
  onClose: () => void;
  onMarkAsKnown: (wordId: string) => void;
  onIgnore: (wordId: string) => void;
  onOpenAIChat: (wordText: string) => void;
  onInspectSentence: (wordId: string) => void;
}

export const WordToolbar: React.FC<WordToolbarProps> = ({
  wordId,
  wordText,
  wordTranslation,
  wordElement,
  wordLevel,
  onSetWordLevel,
  onClose,
  onMarkAsKnown,
  onIgnore,
  onOpenAIChat,
  onInspectSentence,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const meaningDropdownRef = useRef<HTMLDivElement>(null);
  const dictionaryMenuRef = useRef<HTMLDivElement>(null);
  const explainDropdownRef = useRef<HTMLDivElement>(null);
  const inspectDropdownRef = useRef<HTMLDivElement>(null);
  const statusPopoverRef = useRef<HTMLDivElement>(null);
  const notesDropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isUserPositioned, setIsUserPositioned] = useState(false);
  const [meaningOffset, setMeaningOffset] = useState({ x: 0, y: 0 });
  const [dictionaryMenuOffset, setDictionaryMenuOffset] = useState({ x: 0, y: 0 });
  const [explainOffset, setExplainOffset] = useState({ x: 0, y: 0 });
  const [inspectOffset, setInspectOffset] = useState({ x: 0, y: 0 });
  const [statusOffset, setStatusOffset] = useState({ x: 0, y: 0 });
  const [notesOffset, setNotesOffset] = useState({ x: 0, y: 0 });
  const translation = wordTranslation || wordText;
  const [menuOpen, setMenuOpen] = useState(false);
  const [meaningsOpen, setMeaningsOpen] = useState(false);
  const [meaningQuery, setMeaningQuery] = useState('');
  const [selectedMeaning, setSelectedMeaning] = useState(translation);
  const [dictionaryMenuOpen, setDictionaryMenuOpen] = useState(false);
  const [dictionaryPopupOpen, setDictionaryPopupOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainChunkCount, setExplainChunkCount] = useState(0);
  const [explainHovered, setExplainHovered] = useState(false);
  const [explainRun, setExplainRun] = useState(0);
  const [explainHasGenerated, setExplainHasGenerated] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesQuery, setNotesQuery] = useState('');
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const meanings = useMemo(
    () => [
      { value: 'to run, to jog', count: '2.8k' },
      { value: 'to operate, to function', count: '1.5k' },
      { value: 'to manage, to direct', count: '892' },
      { value: 'to flow, to stream', count: '456' },
    ],
    []
  );

  const dictionaries = useMemo(
    () => [
      { id: 'deepl-fr', name: 'Deepl Translator', icon: englishFlag },
      { id: 'deepl-uk', name: 'Deepl Translator', icon: englishFlag },
      { id: 'deepl-uk-2', name: 'Deepl Translator', icon: englishFlag },
      { id: 'deepl-uk-3', name: 'Deepl Translator', icon: englishFlag },
    ],
    []
  );

  const [selectedDictionary, setSelectedDictionary] = useState(dictionaries[0]);
  const explanationChunks = useMemo(
    () => [
      `In this story about Kenji's morning routine, 公園`,
      '(kōen) refers specifically to the small neighborhood park near his apartment—a common setting in Japanese slice-of-life narratives where characters find moments of peace before their busy day.',
    ],
    []
  );
  const inspectSentence = useMemo(
    () => ({
      original: ['彼は毎朝', '公園', 'を走っています。'],
      translation: ['He runs in the', 'park', 'every morning.'],
    }),
    []
  );
  const [notes, setNotes] = useState(() => [
    {
      id: 'note-1',
      text: 'This verb often implies a habitual action when used with ています',
      createdAt: Date.now() - 2 * 60 * 1000,
    },
    {
      id: 'note-2',
      text: 'Compare with 歩く (aruku) - walking',
      createdAt: Date.now() - 60 * 60 * 1000,
    },
    {
      id: 'note-3',
      text: "Can also mean 'to operate' in context of machines",
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
  ]);

  useEffect(() => {
    setSelectedMeaning(translation);
  }, [translation]);

  useEffect(() => {
    if (!explainOpen || !explainHasGenerated) return;
    setExplainLoading(true);
    setExplainChunkCount(0);
    setExplainHovered(false);
    let chunkTimer: ReturnType<typeof setInterval> | undefined;
    const loadingTimer = setTimeout(() => {
      setExplainLoading(false);
      let index = 0;
      chunkTimer = setInterval(() => {
        index += 1;
        setExplainChunkCount(index);
        if (index >= explanationChunks.length) {
          if (chunkTimer) {
            clearInterval(chunkTimer);
          }
        }
      }, 450);
    }, 650);

    return () => {
      clearTimeout(loadingTimer);
      if (chunkTimer) {
        clearInterval(chunkTimer);
      }
    };
  }, [explainOpen, explainRun, explainHasGenerated, explanationChunks.length]);


  const isMeaningSearch = meaningQuery.startsWith('/');
  const meaningSearchTerm = meaningQuery.slice(1).trim().toLowerCase();
  const filteredMeanings = isMeaningSearch
    ? meanings.filter(meaning => meaning.value.toLowerCase().includes(meaningSearchTerm))
    : [];
  const canAddMeaningFromSearch =
    isMeaningSearch &&
    meaningSearchTerm.length > 0 &&
    !meanings.some(meaning => meaning.value.toLowerCase() === meaningSearchTerm);
  const canSubmitMeaning = !isMeaningSearch && meaningQuery.trim().length > 0;

  useEffect(() => {
    const updatePosition = () => {
      const element = wordElement || document.getElementById(wordId);
      if (!element || !toolbarRef.current) return;

      const rect = element.getBoundingClientRect();
      const toolbarHeight = toolbarRef.current.offsetHeight || 0;
      const toolbarWidth = toolbarRef.current.offsetWidth || 0;
      
      // Position toolbar above the word, centered horizontally
      const top = rect.top - toolbarHeight - 8; // 8px gap
      const left = rect.left + (rect.width / 2) - (toolbarWidth / 2);
      
      // Ensure toolbar stays within viewport
      const viewportWidth = window.innerWidth;
      
      let adjustedLeft = Math.max(10, Math.min(left, viewportWidth - toolbarWidth - 10));
      let adjustedTop = top;
      
      // If toolbar would go above viewport, position it below the word
      if (adjustedTop < 10) {
        adjustedTop = rect.bottom + 8;
      }
      
      setPosition({ top: adjustedTop, left: adjustedLeft });
    };

    // Initial position update with a small delay to ensure DOM is ready
    if (!isUserPositioned) {
      const timeoutId = setTimeout(updatePosition, 0);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }

    return undefined;
  }, [wordElement, wordId, isUserPositioned]);

  useEffect(() => {
    setIsUserPositioned(false);
  }, [wordId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node) &&
        wordElement &&
        !wordElement.contains(event.target as Node)
      ) {
        setMeaningsOpen(false);
        setDictionaryMenuOpen(false);
        setDictionaryPopupOpen(false);
        setExplainOpen(false);
        setInspectOpen(false);
        setNotesOpen(false);
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, wordElement]);

  const handleMarkAsKnown = () => {
    onMarkAsKnown(wordId);
    onClose();
  };

  const handleIgnore = () => {
    onIgnore(wordId);
    onClose();
  };

  const handleToggleMenu = () => {
    setMeaningsOpen(false);
    setDictionaryMenuOpen(false);
    setDictionaryPopupOpen(false);
    setExplainOpen(false);
    setInspectOpen(false);
    setNotesOpen(false);
    setMenuOpen(prev => !prev);
  };

  const handleSetLevel = (level: number) => {
    onSetWordLevel(wordId, level);
    setMenuOpen(false);
  };

  const handleInspectSentence = () => {
    setMenuOpen(false);
    setMeaningsOpen(false);
    setDictionaryMenuOpen(false);
    setDictionaryPopupOpen(false);
    setExplainOpen(false);
    setNotesOpen(false);
    setInspectOpen(prev => !prev);
    onInspectSentence(wordId);
  };

  const handleOpenDefinition = () => {
    setMenuOpen(false);
    setDictionaryMenuOpen(false);
    setDictionaryPopupOpen(false);
    setExplainOpen(false);
    setInspectOpen(false);
    setNotesOpen(false);
    setMeaningsOpen(prev => !prev);
  };

  const handleSelectMeaning = (value: string) => {
    setSelectedMeaning(value);
    setMeaningQuery('');
    setMeaningsOpen(false);
    setDictionaryMenuOpen(false);
  };

  const handleAddMeaning = () => {
    const nextValue = isMeaningSearch ? meaningSearchTerm : meaningQuery.trim();
    if (!nextValue) return;
    handleSelectMeaning(nextValue);
  };

  const handleToggleDictionaryMenu = () => {
    setDictionaryMenuOpen(prev => !prev);
  };

  const handleSelectDictionary = (dictionary: (typeof dictionaries)[number]) => {
    setSelectedDictionary(dictionary);
    setDictionaryMenuOpen(false);
    setDictionaryPopupOpen(true);
  };

  const handleOpenDictionary = () => {
    setDictionaryPopupOpen(true);
  };

  const handleToggleExplain = () => {
    setMenuOpen(false);
    setMeaningsOpen(false);
    setDictionaryMenuOpen(false);
    setDictionaryPopupOpen(false);
    setInspectOpen(false);
    setNotesOpen(false);
    setExplainOpen(prev => !prev);
  };

  const handleRefreshExplain = () => {
    setExplainRun(prev => prev + 1);
  };

  const handleOpenExplainChat = () => {
    onOpenAIChat(wordText);
  };

  const handleGenerateExplain = () => {
    setExplainHasGenerated(true);
    setExplainRun(prev => prev + 1);
  };

  const handleDragStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!toolbarRef.current) return;
    const rect = toolbarRef.current.getBoundingClientRect();
    setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    setIsDragging(true);
    setIsUserPositioned(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const nextLeft = event.clientX - dragOffset.x;
    const nextTop = event.clientY - dragOffset.y;
    setPosition({ top: nextTop, left: nextLeft });
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore if capture is already released
    }
  };

  const handleToggleNotes = () => {
    setMenuOpen(false);
    setMeaningsOpen(false);
    setDictionaryMenuOpen(false);
    setDictionaryPopupOpen(false);
    setExplainOpen(false);
    setInspectOpen(false);
    setNotesOpen(prev => !prev);
  };

  const handleNotesSubmit = () => {
    if (!notesQuery.trim() || notesQuery.startsWith('/')) return;
    const newNote = {
      id: `note-${Date.now()}`,
      text: notesQuery.trim(),
      createdAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    setNotesQuery('');
    setJustSavedId(newNote.id);
    setTimeout(() => setJustSavedId(current => (current === newNote.id ? null : current)), 2500);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const handleStartEditNote = (id: string, text: string) => {
    setEditingNoteId(id);
    setEditingNoteText(text);
  };

  const handleUpdateNote = () => {
    if (!editingNoteId) return;
    const trimmed = editingNoteText.trim();
    if (!trimmed) return;
    setNotes(prev =>
      prev.map(note => (note.id === editingNoteId ? { ...note, text: trimmed } : note))
    );
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const isSearchMode = notesQuery.startsWith('/');
  const searchTerm = notesQuery.slice(1).trim().toLowerCase();
  const filteredNotes = isSearchMode
    ? notes.filter(note => note.text.toLowerCase().includes(searchTerm))
    : notes;
  const canSubmitNotes = !isSearchMode && notesQuery.trim().length > 0;

  const formatAge = (timestamp: number) => {
    const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getViewportOffset = (
    element: HTMLElement,
    listSelector?: string
  ) => {
    const rect = element.getBoundingClientRect();
    const padding = 8;
    let dx = 0;
    let dy = 0;
    const toolbarRect = toolbarRef.current?.getBoundingClientRect();
    const gap = 8;
    const maxHeight = (() => {
      if (!listSelector) return element.offsetHeight;
      const listElement = element.querySelector(listSelector) as HTMLElement | null;
      if (!listElement) return element.offsetHeight;
      const max = Number.parseFloat(window.getComputedStyle(listElement).maxHeight);
      if (!Number.isFinite(max) || max <= 0) return element.offsetHeight;
      const delta = max - listElement.offsetHeight;
      return delta > 0 ? element.offsetHeight + delta : element.offsetHeight;
    })();

    if (toolbarRect) {
      const spaceBelow = window.innerHeight - toolbarRect.bottom - gap - padding;
      const spaceAbove = toolbarRect.top - gap - padding;
      if (maxHeight > spaceBelow && spaceAbove >= maxHeight) {
        dy -= maxHeight + toolbarRect.height + gap;
      } else if (maxHeight > spaceBelow) {
        dy -= Math.max(0, maxHeight - spaceBelow);
      }
    }

    const rectWithOffset = {
      left: rect.left + dx,
      right: rect.right + dx,
      top: rect.top + dy,
      bottom: rect.bottom + dy,
    };
    const maxRight = window.innerWidth - padding;
    const maxBottom = window.innerHeight - padding;

    if (rectWithOffset.right > maxRight) {
      dx -= rectWithOffset.right - maxRight;
    }
    if (rectWithOffset.left < padding) {
      dx += padding - rectWithOffset.left;
    }
    if (rectWithOffset.bottom > maxBottom) {
      dy -= rectWithOffset.bottom - maxBottom;
    }
    if (rectWithOffset.top < padding) {
      dy += padding - rectWithOffset.top;
    }

    return { x: dx, y: dy };
  };

  const bindViewportClamp = (
    isOpen: boolean,
    ref: React.RefObject<HTMLDivElement>,
    setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>,
    listSelector?: string
  ) => {
    if (!isOpen || isUserPositioned) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    const update = () => {
      if (!ref.current) return;
      setOffset(getViewportOffset(ref.current, listSelector));
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  };

  useEffect(
    () =>
      bindViewportClamp(
        meaningsOpen,
        meaningDropdownRef,
        setMeaningOffset,
        '.word-toolbar-meaning-list'
      ),
    [meaningsOpen, isUserPositioned, position, meaningQuery, filteredMeanings.length]
  );

  useEffect(
    () => bindViewportClamp(dictionaryMenuOpen, dictionaryMenuRef, setDictionaryMenuOffset),
    [dictionaryMenuOpen, isUserPositioned, position]
  );

  useEffect(() => bindViewportClamp(explainOpen, explainDropdownRef, setExplainOffset), [
    explainOpen,
    isUserPositioned,
    position,
    explainHovered,
    explainChunkCount,
  ]);

  useEffect(() => bindViewportClamp(inspectOpen, inspectDropdownRef, setInspectOffset), [
    inspectOpen,
    isUserPositioned,
    position,
  ]);

  useEffect(() => bindViewportClamp(menuOpen, statusPopoverRef, setStatusOffset), [
    menuOpen,
    isUserPositioned,
    position,
  ]);

  useEffect(
    () =>
      bindViewportClamp(
        notesOpen,
        notesDropdownRef,
        setNotesOffset,
        '.word-toolbar-notes-list'
      ),
    [notesOpen, isUserPositioned, position, notesQuery, notes.length]
  );

  return (
    <div
      ref={toolbarRef}
      className={isDragging ? 'word-toolbar dragging' : 'word-toolbar'}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="word-toolbar-content">
        <button
          className="word-toolbar-drag-handle"
          type="button"
          aria-label="Drag toolbar"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </button>
        {/* Translation */}
        <div className="word-toolbar-translation">
          <button className="word-toolbar-definition" type="button" onClick={handleOpenDefinition}>
            <span className="word-toolbar-definition-text">{selectedMeaning}</span>
            <span className="word-toolbar-definition-icon">
              <ChevronRight size={16} />
            </span>
          </button>
          {meaningsOpen && (
            <div
              ref={meaningDropdownRef}
              className="word-toolbar-meaning-dropdown"
              style={{ transform: `translate(${meaningOffset.x}px, ${meaningOffset.y}px)` }}
            >
              <div
                className={
                  isMeaningSearch
                    ? 'word-toolbar-meaning-search search'
                    : 'word-toolbar-meaning-search'
                }
              >
                {isMeaningSearch && (
                  <span className="word-toolbar-meaning-search-icon">
                    <Search size={14} />
                  </span>
                )}
                <input
                  className="word-toolbar-meaning-input"
                  placeholder="Add a new note (or type '/' to search) ..."
                  value={meaningQuery}
                  onChange={event => setMeaningQuery(event.target.value)}
                />
                {canSubmitMeaning && (
                  <button
                    className="word-toolbar-meaning-submit"
                    type="button"
                    aria-label="Add meaning"
                    onClick={handleAddMeaning}
                  >
                    <Plus size={14} strokeWidth={1.5} />
                  </button>
                )}
                {meaningQuery && !canSubmitMeaning && (
                  <button
                    className="word-toolbar-meaning-clear"
                    type="button"
                    onClick={() => setMeaningQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {filteredMeanings.length > 0 && (
                <div className="word-toolbar-meaning-list">
                  {filteredMeanings.map(meaning => (
                    <button
                      key={meaning.value}
                      className="word-toolbar-meaning-option"
                      type="button"
                      onClick={() => handleSelectMeaning(meaning.value)}
                    >
                      <span className="word-toolbar-meaning-option-text">{meaning.value}</span>
                      <span className="word-toolbar-meaning-option-count">{meaning.count}</span>
                    </button>
                  ))}
                </div>
              )}
              {canAddMeaningFromSearch && (
                <button className="word-toolbar-meaning-add" type="button" onClick={handleAddMeaning}>
                  <span className="word-toolbar-meaning-add-icon">
                    <Plus size={14} />
                  </span>
                  <span className="word-toolbar-meaning-add-text">{`"${meaningSearchTerm}"`}</span>
                  <span className="word-toolbar-meaning-add-label">Add new</span>
                </button>
              )}
              <div className="word-toolbar-meaning-dictionary-row">
                <button
                  className="word-toolbar-meaning-dictionary active"
                  type="button"
                  onClick={handleOpenDictionary}
                >
                  <img
                    src={selectedDictionary.icon}
                    alt=""
                    className="word-toolbar-meaning-dictionary-icon"
                  />
                  <span className="word-toolbar-meaning-dictionary-name">
                    {selectedDictionary.name}
                  </span>
                  <span className="word-toolbar-meaning-dictionary-action">Look Up</span>
                </button>
                <button
                  className="word-toolbar-meaning-dictionary-toggle"
                  type="button"
                  onClick={handleToggleDictionaryMenu}
                  aria-label="Toggle dictionary menu"
                >
                  {dictionaryMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              {dictionaryPopupOpen && (
                <div className="word-toolbar-modal-overlay" onClick={() => setDictionaryPopupOpen(false)}>
                  <div
                    className="word-toolbar-meaning-dictionary-popup"
                    role="dialog"
                    aria-modal="true"
                    onClick={event => event.stopPropagation()}
                  >
                    <button
                      className="word-toolbar-meaning-dictionary-popup-close"
                      type="button"
                      aria-label="Close dictionary popup"
                      onClick={() => setDictionaryPopupOpen(false)}
                    >
                      <X size={14} />
                    </button>
                    <div className="word-toolbar-meaning-dictionary-popup-title">
                      Current dictionary selection
                    </div>
                    <div className="word-toolbar-meaning-dictionary-popup-body">
                      {selectedDictionary.name}
                    </div>
                    <div className="word-toolbar-meaning-dictionary-popup-preview">
                      <div className="word-toolbar-meaning-dictionary-popup-preview-header">
                        {selectedMeaning}
                      </div>
                      <div className="word-toolbar-meaning-dictionary-popup-preview-body">
                        Embedded dictionary preview placeholder
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {dictionaryMenuOpen && (
                <div
                  ref={dictionaryMenuRef}
                  className="word-toolbar-meaning-dictionary-menu"
                  style={{
                    transform: `translate(${dictionaryMenuOffset.x}px, ${dictionaryMenuOffset.y}px)`,
                  }}
                >
                  {dictionaries.map(dictionary => {
                    const isSelected = dictionary.id === selectedDictionary.id;
                    return (
                      <button
                        key={dictionary.id}
                        className={
                          isSelected
                            ? 'word-toolbar-meaning-dictionary-option selected'
                            : 'word-toolbar-meaning-dictionary-option'
                        }
                        type="button"
                        onClick={() => handleSelectDictionary(dictionary)}
                      >
                        <img
                          src={dictionary.icon}
                          alt=""
                          className="word-toolbar-meaning-dictionary-icon"
                        />
                        <span className="word-toolbar-meaning-dictionary-name">
                          {dictionary.name}
                        </span>
                        {isSelected && (
                          <span className="word-toolbar-meaning-dictionary-check">
                            <Check size={16} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="word-toolbar-divider" />

        {/* Explain This */}
        <div className="word-toolbar-explain">
          <button
            className="word-toolbar-button word-toolbar-tooltip"
            onClick={handleToggleExplain}
            data-tooltip="Explain This"
          >
            <img src={lynxIcon} alt="Lynx AI" className="word-toolbar-icon" />
          </button>
          {explainOpen && (
            <div
              ref={explainDropdownRef}
              className={
                explainHovered
                  ? 'word-toolbar-explain-dropdown expanded'
                  : 'word-toolbar-explain-dropdown'
              }
              style={{ transform: `translate(${explainOffset.x}px, ${explainOffset.y}px)` }}
            >
              {!explainHasGenerated ? (
                <button
                  className="word-toolbar-explain-generate"
                  type="button"
                  onClick={handleGenerateExplain}
                >
                  <Sparkles size={16} strokeWidth={1.5} />
                  <span>Generate Explanation</span>
                  <ChevronRight size={16} className="word-toolbar-explain-generate-chevron" />
                </button>
              ) : explainLoading ? (
                <div className="word-toolbar-explain-loading">
                  <span className="word-toolbar-explain-label">
                    Lynx is thinking
                    <span className="word-toolbar-explain-ellipsis" aria-hidden="true">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </span>
                </div>
              ) : (
                <div
                  className="word-toolbar-explain-content"
                  onMouseEnter={() => setExplainHovered(true)}
                  onMouseLeave={() => setExplainHovered(false)}
                >
                  <p className="word-toolbar-explain-text">
                    {explanationChunks.slice(0, explainChunkCount).map((chunk, index) => (
                      <span key={chunk}>
                        {index > 0 ? ' ' : ''}
                        {chunk}
                      </span>
                    ))}
                  </p>
                  <div
                    className={
                      explainHovered
                        ? 'word-toolbar-explain-actions visible'
                        : 'word-toolbar-explain-actions'
                    }
                  >
                    <button
                      className="word-toolbar-explain-action word-toolbar-tooltip"
                      type="button"
                      data-tooltip="Regenerate"
                      onClick={handleRefreshExplain}
                    >
                      <RefreshCcw size={18} />
                    </button>
                    <button
                      className="word-toolbar-explain-action word-toolbar-tooltip"
                      type="button"
                      data-tooltip="Add as note"
                    >
                      <NotebookPen size={18} />
                    </button>
                    <button
                      className="word-toolbar-explain-action word-toolbar-tooltip"
                      type="button"
                      data-tooltip="Not helpful"
                    >
                      <ThumbsDown size={18} />
                    </button>
                    <button
                      className="word-toolbar-explain-action word-toolbar-tooltip"
                      type="button"
                      data-tooltip="Helpful"
                    >
                      <ThumbsUp size={18} />
                    </button>
                    <button
                      className="word-toolbar-explain-action word-toolbar-tooltip chat"
                      type="button"
                      data-tooltip="Chat with Lynx"
                      onClick={handleOpenExplainChat}
                    >
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inspect Sentence */}
        <div className="word-toolbar-inspect">
          <button
            className="word-toolbar-button word-toolbar-tooltip"
            onClick={handleInspectSentence}
            data-tooltip="Inspect Sentence"
          >
            <img src={sentenceReviewIcon} alt="Inspect Sentence" className="word-toolbar-icon" />
          </button>
          {inspectOpen && (
            <div
              ref={inspectDropdownRef}
              className="word-toolbar-inspect-dropdown"
              style={{ transform: `translate(${inspectOffset.x}px, ${inspectOffset.y}px)` }}
            >
              <div className="word-toolbar-inspect-line muted">
                <span>{inspectSentence.original[0]}</span>
                <span className="word-toolbar-inspect-highlight">{inspectSentence.original[1]}</span>
                <span>{inspectSentence.original[2]}</span>
              </div>
              <div className="word-toolbar-inspect-line">
                <span>{inspectSentence.translation[0]}</span>
                <span className="word-toolbar-inspect-highlight">
                  {inspectSentence.translation[1]}
                </span>
                <span>{inspectSentence.translation[2]}</span>
              </div>
            </div>
          )}
        </div>

        <div className="word-toolbar-divider" />

        <div className="word-toolbar-status">
          <div className="word-toolbar-menu">
            <WordStatusIndicator level={wordLevel} onClick={handleToggleMenu} isOpen={menuOpen} />
            {menuOpen && (
              <div
                ref={statusPopoverRef}
                className="word-toolbar-status-popover"
                style={{ transform: `translate(${statusOffset.x}px, ${statusOffset.y}px)` }}
              >
                <div className="word-toolbar-status-levels">
                  {[
                    { level: 1, label: 'New' },
                    { level: 2, label: 'Recognized' },
                    { level: 3, label: 'Familiar' },
                    { level: 4, label: 'Learned' },
                  ].map(item => {
                    const isActive = item.level === wordLevel;
                    return (
                      <button
                        key={item.level}
                        className={
                          isActive ? 'word-toolbar-status-row active' : 'word-toolbar-status-row'
                        }
                        onClick={() => handleSetLevel(item.level)}
                        type="button"
                      >
                        <span className="word-toolbar-status-level">
                          <span
                            className={
                              isActive
                                ? 'word-toolbar-level-number active'
                                : 'word-toolbar-level-number'
                            }
                          >
                            {item.level}
                          </span>
                          <span className="word-toolbar-level-label">{item.label}</span>
                        </span>
                        <span className="word-toolbar-status-shortcut">{item.level}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="word-toolbar-status-divider" />
                <div className="word-toolbar-status-actions">
                  <button
                    className="word-toolbar-status-row action known"
                    onClick={handleMarkAsKnown}
                    type="button"
                  >
                    <span className="word-toolbar-status-level">
                      <CircleCheck size={18} />
                      <span className="word-toolbar-level-label">Known</span>
                    </span>
                    <span className="word-toolbar-status-shortcut">k</span>
                  </button>
                  <button
                    className="word-toolbar-status-row action ignore"
                    onClick={handleIgnore}
                    type="button"
                  >
                    <span className="word-toolbar-status-level">
                      <EyeOff size={18} />
                      <span className="word-toolbar-level-label">Ignore</span>
                    </span>
                    <span className="word-toolbar-status-shortcut">x</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="word-toolbar-divider" />

        <div className="word-toolbar-notes">
          <button
            className="word-toolbar-button word-toolbar-tooltip"
            onClick={handleToggleNotes}
            data-tooltip="Notes"
          >
            <NotebookPen size={18} strokeWidth={1.5} />
          </button>
          {notesOpen && (
            <div
              ref={notesDropdownRef}
              className="word-toolbar-notes-dropdown"
              style={{ transform: `translate(${notesOffset.x}px, ${notesOffset.y}px)` }}
            >
              <div
                className={
                  isSearchMode
                    ? 'word-toolbar-notes-input search'
                    : 'word-toolbar-notes-input'
                }
              >
                {isSearchMode && (
                  <span className="word-toolbar-notes-search-icon">
                    <Search size={14} />
                  </span>
                )}
                <input
                  value={notesQuery}
                  onChange={event => setNotesQuery(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      handleNotesSubmit();
                    }
                  }}
                  placeholder="Add a new note (or type '/' to search) ..."
                />
                {isSearchMode && notesQuery.length > 1 && (
                  <button
                    className="word-toolbar-notes-clear"
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setNotesQuery('/')}
                  >
                    <X size={14} />
                  </button>
                )}
                {canSubmitNotes && (
                  <button
                    className="word-toolbar-notes-submit"
                    type="button"
                    aria-label="Add note"
                    onClick={handleNotesSubmit}
                  >
                    <Plus size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
              {isSearchMode && searchTerm.length > 0 && filteredNotes.length === 0 ? (
                <div className="word-toolbar-notes-empty">
                  No notes match “{searchTerm}”
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="word-toolbar-notes-empty">
                  No notes yet. Add a new note above!
                </div>
              ) : (
                <div className="word-toolbar-notes-list">
                  {filteredNotes.map(note => (
                    <div
                      key={note.id}
                      className={
                        note.id === editingNoteId
                          ? 'word-toolbar-notes-item editing'
                          : note.id === justSavedId
                            ? 'word-toolbar-notes-item saved'
                            : 'word-toolbar-notes-item'
                      }
                    >
                      {note.id !== editingNoteId && (
                        <div className="word-toolbar-notes-item-actions">
                          <button
                            className="word-toolbar-notes-action"
                            type="button"
                            aria-label="Edit note"
                            onClick={() => handleStartEditNote(note.id, note.text)}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            className="word-toolbar-notes-action delete"
                            type="button"
                            aria-label="Delete note"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      {note.id === editingNoteId ? (
                        <>
                          <textarea
                            className="word-toolbar-notes-edit"
                            value={editingNoteText}
                            onChange={event => setEditingNoteText(event.target.value)}
                            onKeyDown={event => {
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                handleUpdateNote();
                              }
                            }}
                          />
                          <div className="word-toolbar-notes-edit-actions">
                            <button
                              className="word-toolbar-notes-cancel"
                              type="button"
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingNoteText('');
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="word-toolbar-notes-update"
                              type="button"
                              onClick={handleUpdateNote}
                            >
                              Update
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p>{note.text}</p>
                          <div className="word-toolbar-notes-meta">
                            {note.id === justSavedId ? (
                              <span className="word-toolbar-notes-saved">Saved</span>
                            ) : (
                              <span>{formatAge(note.createdAt)}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

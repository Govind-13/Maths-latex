import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, List, Table, Image as ImageIcon, 
  HelpCircle, Search, Sparkles, Code, Trash2, Undo2,
  ListOrdered, Layers, Copy, Check, ChevronDown, CheckSquare
} from 'lucide-react';

interface CodeEditorProps {
  content: string;
  onChange: (value: string) => void;
  fileName: string;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function CodeEditor({
  content,
  onChange,
  fileName,
  editorRef,
}: CodeEditorProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number>(0);

  // Split lines to generate line numbers list
  const lines = content.split('\n');

  // Sync scrolling of line numbers div with textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Helper to insert snippets at selection or cursor position
  const insertSnippet = (before: string, after: string = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = before + selectedText + after;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    // Reposition cursor nicely after state update
    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  // Search and replace logic
  const handleSearch = () => {
    if (!searchQuery) {
      setSearchMatches(0);
      return;
    }
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const matches = content.match(regex);
    setSearchMatches(matches ? matches.length : 0);
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, content]);

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const newContent = content.replace(regex, replaceQuery);
    onChange(newContent);
    setSearchMatches(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex-1 flex flex-col bg-slate-950 border-r border-slate-800 h-full overflow-hidden select-none">
      {/* Editor File Tab Header */}
      <div className="h-13 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono font-bold text-emerald-400 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {fileName}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Find and Replace button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${
              showSearch ? 'bg-slate-800 text-emerald-400' : ''
            }`}
            title="Find and Replace"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Copy content */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Copy LaTeX Source"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Quick Toolbar */}
      <div className="h-10 bg-slate-900 border-b border-slate-850 px-3 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar gap-2 select-none">
        <div className="flex items-center gap-1">
          {[
            { label: 'Bold', icon: <Bold className="w-3.5 h-3.5" />, action: () => insertSnippet('\\textbf{', '}') },
            { label: 'Italic', icon: <Italic className="w-3.5 h-3.5" />, action: () => insertSnippet('\\textit{', '}') },
            { label: 'Bullet List', icon: <List className="w-3.5 h-3.5" />, action: () => insertSnippet('\\begin{itemize}\n    \\item ', '\n\\end{itemize}') },
            { label: 'Numbered List', icon: <ListOrdered className="w-3.5 h-3.5" />, action: () => insertSnippet('\\begin{enumerate}\n    \\item ', '\n\\end{enumerate}') },
            { label: 'Table Matrix', icon: <Table className="w-3.5 h-3.5" />, action: () => insertSnippet('\\begin{center}\n\\begin{tabular}{|c|c|}\n\\hline\n', ' & B \\\\\n\\hline\n\\end{tabular}\n\\end{center}') },
            { label: 'Graphic Image', icon: <ImageIcon className="w-3.5 h-3.5" />, action: () => insertSnippet('\\includegraphics[width=0.75\\textwidth]{', '}') },
            { label: 'Inline Math', icon: <Code className="w-3.5 h-3.5" />, action: () => insertSnippet('$', '$') },
            { label: 'Display Math', icon: <Layers className="w-3.5 h-3.5" />, action: () => insertSnippet('\\begin{equation}\n    ', '\n\\end{equation}') },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="p-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-colors"
              title={btn.label}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-mono">
            {lines.length} lines | {content.length} characters
          </span>
        </div>
      </div>

      {/* Embedded Find and Replace Bar */}
      {showSearch && (
        <div className="bg-slate-900 border-b border-slate-850 p-2.5 flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 max-w-[160px]">
            <input
              type="text"
              placeholder="Find..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none w-full"
            />
            {searchQuery && (
              <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-900 px-1 rounded shrink-0">
                {searchMatches}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 max-w-[160px]">
            <input
              type="text"
              placeholder="Replace..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none w-full"
            />
          </div>
          <button
            onClick={handleReplaceAll}
            disabled={!searchQuery || searchMatches === 0}
            className="bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-200 hover:text-white font-semibold text-xs px-2.5 py-1 rounded transition-colors"
          >
            Replace All
          </button>
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
              setReplaceQuery('');
            }}
            className="text-xs text-slate-500 hover:text-slate-300 ml-auto"
          >
            Close
          </button>
        </div>
      )}

      {/* Text Area & Line Numbers Row */}
      <div className="flex-1 flex overflow-hidden relative select-text">
        {/* Line Numbers sidebar */}
        <div 
          ref={lineNumbersRef}
          className="w-11 bg-slate-950/80 border-r border-slate-900 text-right py-4 pr-2.5 text-slate-600 font-mono text-xs select-none overflow-hidden leading-6"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area Input */}
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className="flex-1 h-full p-4 bg-transparent text-slate-100 font-mono text-13.5px leading-6 focus:outline-none resize-none overflow-y-auto"
          style={{ tabSize: 4 }}
          placeholder="% Start writing LaTeX code here..."
        />
      </div>
    </section>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusSquare, BookOpen, Layers, Settings, HelpCircle, 
  Info, Sparkles, FileText, X, CheckSquare, GraduationCap 
} from 'lucide-react';
import { TexFile, CompilerOptions, LaTeXDiagnostics } from './types';
import { templates } from './utils/latexTemplates';
import { compileLaTeXToReact } from './utils/latexParser';
import { getAiFix } from './utils/ai';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import DocumentPreview from './components/DocumentPreview';

export default function App() {
  // Initialize files: load the classic Academic Abstract template into main.tex by default
  const [files, setFiles] = useState<TexFile[]>([
    {
      id: 'main-tex',
      name: 'main.tex',
      content: templates[0].content,
      type: 'tex',
    },
    {
      id: 'preamble-tex',
      name: 'preamble.tex',
      content: `% Custom Package Declarations and Document Setup
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{xcolor}
`,
      type: 'tex',
    },
    {
      id: 'references-bib',
      name: 'references.bib',
      content: `@article{lorenz1963deterministic,
  title={Deterministic nonperiodic flow},
  author={Lorenz, Edward N},
  journal={Journal of the atmospheric sciences},
  volume={20},
  number={1},
  pages={130--141},
  year={1963}
}
`,
      type: 'bib',
    },
  ]);

  const [activeFileId, setActiveFileId] = useState<string>('main-tex');
  
  // Compiler Layout Options Overrides
  const [compilerOptions, setCompilerOptions] = useState<CompilerOptions>({
    fontSize: '11pt',
    documentClass: 'article',
    fontFamily: 'computer-modern',
    margin: 'standard',
    lineSpacing: 'single',
    showSectionNumbers: true,
    paperSize: 'a4',
  });

  // State to hold compiled values
  const [compiledElement, setCompiledElement] = useState<React.ReactNode>(null);
  const [diagnostics, setDiagnostics] = useState<LaTeXDiagnostics[]>([]);
  const [tableOfContents, setTableOfContents] = useState<{ title: string; depth: number; id: string }[]>([]);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isAiFixing, setIsAiFixing] = useState<boolean>(false);

  // Reference to the main code area textarea
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // Extract a mapping of name -> imageUrl for custom uploaded graphics
  const customImages = files.reduce<{ [key: string]: string }>((acc, file) => {
    if (file.type === 'image' && file.imageUrl) {
      acc[file.name] = file.imageUrl;
    }
    return acc;
  }, {});

  // Fetch the current text being edited
  const activeFile = files.find(f => f.id === activeFileId);
  const activeContent = activeFile ? activeFile.content : '';

  // Trigger compilation of the main.tex document
  const triggerCompile = (force: boolean = false) => {
    setIsCompiling(true);
    
    // Simulate high-power local compiler build delay to feel authentic
    const delay = force ? 400 : 200;
    
    setTimeout(() => {
      const mainTex = files.find(f => f.name === 'main.tex');
      if (!mainTex) {
        setDiagnostics([{
          line: 1,
          type: 'error',
          message: 'Error: Entrypoint main.tex file not found in directory root.'
        }]);
        setIsCompiling(false);
        return;
      }

      const { element, diagnostics: diags, toc } = compileLaTeXToReact(
        mainTex.content, 
        compilerOptions,
        customImages
      );

      setCompiledElement(element);
      setDiagnostics(diags);
      setTableOfContents(toc);
      setIsCompiling(false);
    }, delay);
  };

  // On-the-fly compilation: compile whenever files or layout options update
  useEffect(() => {
    const mainTex = files.find(f => f.name === 'main.tex');
    if (!mainTex) return;

    // Set a debounce timeout to avoid excessive rendering on every keypress
    const timeout = setTimeout(() => {
      triggerCompile();
    }, 450);

    return () => clearTimeout(timeout);
  }, [files, compilerOptions]);

  // Initial compile
  useEffect(() => {
    triggerCompile(true);
  }, []);

  // Update active file content
  const handleContentChange = (newValue: string) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newValue } : f));
  };

  // Add new file to files list
  const handleAddFile = (name: string, type: 'tex' | 'bib' | 'image', imageUrl?: string, content?: string) => {
    const newId = `file-${Date.now()}`;
    const newFile: TexFile = {
      id: newId,
      name,
      content: content || '',
      type,
      imageUrl,
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
  };

  // Rename file
  const handleRenameFile = (id: string, newName: string) => {
    if (id === 'main-tex' || id === 'preamble-tex') return; // protect key files
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        let name = newName.trim();
        const ext = f.type === 'tex' ? '.tex' : (f.type === 'bib' ? '.bib' : '');
        if (ext && !name.toLowerCase().endsWith(ext)) {
          name += ext;
        }
        return { ...f, name };
      }
      return f;
    }));
  };

  // Delete file
  const handleDeleteFile = (id: string) => {
    if (id === 'main-tex') return; // protect entry point
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) {
      setActiveFileId('main-tex');
    }
  };

  // Insert code snippets at the editor cursor
  const handleInsertSnippet = (snippet: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const replacement = snippet;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    handleContentChange(newValue);

    // Place cursor after inserted code
    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  // Apply visual template (overwriting main.tex)
  const handleApplyTemplate = (newContent: string) => {
    setFiles(prev => prev.map(f => f.name === 'main.tex' ? { ...f, content: newContent } : f));
    setActiveFileId('main-tex');
  };

  // AI Fix Handler
  const handleAiFix = async () => {
    const mainTex = files.find(f => f.name === 'main.tex');
    if (!mainTex) return;

    setIsAiFixing(true);
    const diagString = diagnostics.map(d => `Line ${d.line}: ${d.message}`).join('\n');

    try {
      let fixedCode = await getAiFix(mainTex.content, diagString);
      if (fixedCode) {
        // Strip markdown code blocks if present
        fixedCode = fixedCode.replace(/^```[a-z]*\n/i, '').replace(/\n```$/m, '').trim();
        handleContentChange(fixedCode);
      }
    } catch (err) {
      console.error("AI Fix failed:", err);
    } finally {
      setIsAiFixing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      
      {/* Header Bar */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-serif text-white font-black text-lg shadow-md border border-emerald-500 shadow-emerald-500/10">
            T
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white font-serif">LaTeX Document & PDF Editor</span>
            <span className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider">PREVIEW COMPILER & DESIGN ENGINE</span>
          </div>
        </div>

        {/* Header Right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all border border-slate-850"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            Syntax Help
          </button>

          <a
            href="https://en.wikibooks.org/wiki/LaTeX"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-slate-700 transition-colors"
          >
            LaTeX Wiki
          </a>
        </div>
      </header>

      {/* Main body area container */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Left Sidebar Panel */}
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={setActiveFileId}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
          compilerOptions={compilerOptions}
          onChangeCompilerOptions={setCompilerOptions}
          onInsertSnippet={handleInsertSnippet}
          onApplyTemplate={handleApplyTemplate}
        />

        {/* Middle Code Editor Area */}
        <CodeEditor
          content={activeContent}
          onChange={handleContentChange}
          fileName={activeFile ? activeFile.name : 'Unknown'}
          editorRef={editorRef}
        />

        {/* Right Live Paper Preview Area */}
        <DocumentPreview
          compiledElement={compiledElement}
          diagnostics={diagnostics}
          toc={tableOfContents}
          compilerOptions={compilerOptions}
          isCompiling={isCompiling || isAiFixing}
          onForceRecompile={() => triggerCompile(true)}
          onAiFix={handleAiFix}
        />
      </div>

      {/* Help Syntax Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/85 z-[999] flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full flex flex-col max-h-[85vh] shadow-2xl">
            {/* Modal Header */}
            <div className="p-4.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm font-serif">Quick LaTeX Cheat Sheet Guide</h3>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick guide items */}
            <div className="p-4 flex-1 overflow-auto bg-slate-950 text-xs space-y-4 select-text leading-relaxed">
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-200 uppercase tracking-wide text-[10px]">1. Document Structure</h4>
                <p className="text-slate-500">Every document must have headers and structural sections:</p>
                <code className="block bg-slate-900 border border-slate-850 p-2.5 rounded font-mono text-[10.5px] text-sky-400 leading-normal">
                  \title{'{'}Stability Theory{'}'} <br />
                  \author{'{'}Dr. Vance{'}'} <br />
                  \maketitle <br />
                  \section{'{'}Introduction{'}'}
                </code>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-200 uppercase tracking-wide text-[10px]">2. Mathematical Symbols & Equations</h4>
                <p className="text-slate-500">Wrap mathematical notation inside dollar signs for inline, or environments for blocks:</p>
                <code className="block bg-slate-900 border border-slate-850 p-2.5 rounded font-mono text-[10.5px] text-emerald-400 leading-normal">
                  Inline: $E = mc^2$ or $\lambda = 4.669$ <br />
                  Block: <br />
                  \begin{'{'}equation{'}'} <br />
                  &nbsp;&nbsp;x_n+1 = r x_n(1-x_n) <br />
                  \end{'{'}equation{'}'}
                </code>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-200 uppercase tracking-wide text-[10px]">3. Fonts, Highlights & Colors</h4>
                <p className="text-slate-500">Decorate text using formatting tags:</p>
                <code className="block bg-slate-900 border border-slate-850 p-2.5 rounded font-mono text-[10.5px] text-pink-400 leading-normal">
                  Bold: \textbf{'{'}strong text{'}'} <br />
                  Italics: \textit{'{'}emphasized text{'}'} <br />
                  Colored text: \textcolor{'{'}blue{'}'}{'{'}colored text{'}'}
                </code>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-200 uppercase tracking-wide text-[10px]">4. Figures & Custom Images</h4>
                <p className="text-slate-500">Refer to external web links or custom local images. Define widths directly:</p>
                <code className="block bg-slate-900 border border-slate-850 p-2.5 rounded font-mono text-[10.5px] text-teal-400 leading-normal">
                  \includegraphics[width=0.7\textwidth]{'{'}http://url_to_image.png{'}'}
                </code>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-200 uppercase tracking-wide text-[10px]">5. Tabular Columns & Tables</h4>
                <p className="text-slate-500">Separate cells with '&' and break lines using '\\':</p>
                <code className="block bg-slate-900 border border-slate-850 p-2.5 rounded font-mono text-[10.5px] text-amber-400 leading-normal">
                  \begin{'{'}tabular{'}'}{'{'}|l|r|{'}'} <br />
                  \hline <br />
                  Product & Price \\\\ <br />
                  \hline <br />
                  Book & $12.50 \\\\ <br />
                  \hline <br />
                  \end{'{'}tabular{'}'}
                </code>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end shrink-0">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

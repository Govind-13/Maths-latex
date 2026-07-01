import React, { useState, useRef } from 'react';
import { 
  FolderOpen, FileText, Image, Trash2, Plus, Settings, 
  Layers, ChevronRight, GraduationCap, Briefcase, 
  FlaskConical, ListCollapse, Mail, Sparkles, BookOpen,
  Info, Check, PlusCircle, HelpCircle, Eye, EyeOff,
  Upload, Edit2
} from 'lucide-react';
import { TexFile, CompilerOptions } from '../types';
import { templates } from '../utils/latexTemplates';

interface SidebarProps {
  files: TexFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onAddFile: (name: string, type: 'tex' | 'bib' | 'image', imageUrl?: string, content?: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile?: (id: string, newName: string) => void;
  compilerOptions: CompilerOptions;
  onChangeCompilerOptions: (options: CompilerOptions) => void;
  onInsertSnippet: (snippet: string) => void;
  onApplyTemplate: (content: string) => void;
}

export default function Sidebar({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  compilerOptions,
  onChangeCompilerOptions,
  onInsertSnippet,
  onApplyTemplate,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'templates' | 'library' | 'settings'>('files');
  const [newFileName, setNewFileName] = useState('');
  const [showFileForm, setShowFileForm] = useState(false);
  const [newFileType, setNewFileType] = useState<'tex' | 'bib'>('tex');
  const [searchSnippet, setSearchSnippet] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId);

  // Snippet list for library helpers
  const snippetCategories = [
    {
      name: 'Document Structure',
      items: [
        { label: 'Title Block (\\maketitle)', code: '\\title{Document Title}\n\\author{Author Name}\n\\date{\\today}\n\\maketitle\n' },
        { label: 'Section (\\section)', code: '\\section{New Section}\n' },
        { label: 'Subsection (\\subsection)', code: '\\subsection{New Subsection}\n' },
        { label: 'Abstract block', code: '\\begin{abstract}\nThis is a summary abstract of the research work.\n\\end{abstract}\n' },
        { label: 'Page Break (\\newpage)', code: '\\newpage\n' },
      ],
    },
    {
      name: 'Fonts & Typography',
      items: [
        { label: 'Bold (\\textbf)', code: '\\textbf{bold text}' },
        { label: 'Italic (\\textit)', code: '\\textit{italic text}' },
        { label: 'Underline (\\underline)', code: '\\underline{underlined text}' },
        { label: 'Monospace (\\texttt)', code: '\\texttt{code block text}' },
        { label: 'Sans-serif (\\textsf)', code: '\\textsf{sans-serif text}' },
        { label: 'Serif (\\textrm)', code: '\\textrm{serif text}' },
        { label: 'Large Font size', code: '\\Large{large text}' },
        { label: 'Huge Font size', code: '\\Huge{huge text}' },
      ],
    },
    {
      name: 'Colors (xcolor)',
      items: [
        { label: 'Blue text', code: '\\textcolor{blue}{blue colored text}' },
        { label: 'Red text', code: '\\textcolor{red}{red colored text}' },
        { label: 'Teal text', code: '\\textcolor{teal}{teal colored text}' },
        { label: 'Define custom color', code: '\\definecolor{mygreen}{HTML}{34d399}\n\\textcolor{mygreen}{custom green text}' },
      ],
    },
    {
      name: 'Mathematics (KaTeX)',
      items: [
        { label: 'Inline Formula', code: '$E = mc^2$' },
        { label: 'Equation Block', code: '\\begin{equation}\nx_{n+1} = r x_n (1 - x_n)\n\\end{equation}\n' },
        { label: 'Align Block', code: '\\begin{align}\na &= b + c \\\\\nd &= e + f\n\\end{align}\n' },
        { label: 'Fraction (\\frac)', code: '\\frac{numerator}{denominator}' },
        { label: 'Integral (\\int)', code: '\\int_{a}^{b} f(x) \\, dx' },
        { label: 'Summation (\\sum)', code: '\\sum_{i=1}^{n} i' },
        { label: 'Matrix (2x2)', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
        { label: 'Greek letters', code: '$\\alpha, \\beta, \\gamma, \\theta, \\pi, \\sigma$' },
      ],
    },
    {
      name: 'Lists & Layouts',
      items: [
        { label: 'Bulleted List (itemize)', code: '\\begin{itemize}\n    \\item First bulleted item\n    \\item Second bulleted item\n\\end{itemize}\n' },
        { label: 'Numbered List (enumerate)', code: '\\begin{enumerate}\n    \\item First numbered item\n    \\item Second numbered item\n\\end{enumerate}\n' },
        { label: 'Centered Block', code: '\\begin{center}\nCentered content here\n\\end{center}\n' },
      ],
    },
    {
      name: 'Tables & Tabular',
      items: [
        { label: 'Styled Bordered Table', code: '\\begin{center}\n\\begin{tabular}{|l|c|r|}\n\\hline\n\\textbf{Header 1} & \\textbf{Header 2} & \\textbf{Header 3} \\\\\n\\hline\nLeft-aligned & Centered & Right-aligned \\\\\n\\hline\nCell A & Cell B & Cell C \\\\\n\\hline\n\\end{tabular}\n\\end{center}\n' },
      ],
    },
    {
      name: 'Figures & Images',
      items: [
        { label: 'External Image URL', code: '\\begin{center}\n\\includegraphics[width=0.7\\textwidth]{https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600}\n\\\\ \\small{\\textit{Figure 1: Caption Text}}\n\\end{center}\n' },
      ],
    },
  ];

  // Filter snippets based on search input
  const filteredSnippetCategories = snippetCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.label.toLowerCase().includes(searchSnippet.toLowerCase()) || 
      item.code.toLowerCase().includes(searchSnippet.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  // Add new text/bib file
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    let sanitized = newFileName.trim();
    const extension = `.${newFileType}`;
    if (!sanitized.endsWith(extension)) {
      sanitized += extension;
    }

    // Default content for files
    let initialContent = '';
    if (newFileType === 'tex') {
      initialContent = `\\section{${sanitized.replace('.tex', '')}}\n\nThis is a sub-module for your document.\n`;
    } else if (newFileType === 'bib') {
      initialContent = `@article{author2026,\n  author = {Vance, Eleanor},\n  title = {Stability of Attractors},\n  journal = {Journal of Modern Physics},\n  year = {2026}\n}\n`;
    }

    onAddFile(sanitized, newFileType, undefined);
    setNewFileName('');
    setShowFileForm(false);
  };

  // Upload a .tex, .bib, or image file locally
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'tex' || extension === 'bib') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onAddFile(file.name, extension as 'tex' | 'bib', undefined, text);
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onAddFile(file.name, 'image', dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Unsupported file type. Please upload a .tex, .bib, or image file.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'tex' || extension === 'bib') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onAddFile(file.name, extension as 'tex' | 'bib', undefined, text);
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onAddFile(file.name, 'image', dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Unsupported file type. Please drop a .tex, .bib, or image file.");
    }
  };

  // Get matching category icon for templates
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <GraduationCap className="w-5 h-5 text-indigo-500" />;
      case 'professional': return <Briefcase className="w-5 h-5 text-emerald-500" />;
      case 'science': return <FlaskConical className="w-5 h-5 text-purple-500" />;
      case 'cheat-sheet': return <ListCollapse className="w-5 h-5 text-amber-500" />;
      default: return <Mail className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 text-slate-300 overflow-hidden z-20">
      {/* Sidebar Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950 px-2 shrink-0 h-13 overflow-x-auto select-none no-scrollbar">
        {[
          { id: 'files', label: 'Files', icon: <FolderOpen className="w-4 h-4" /> },
          { id: 'templates', label: 'Templates', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'library', label: 'Library Helper', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'settings', label: 'Layout Options', icon: <Settings className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 hover:text-white ${
              activeTab === tab.id
                ? 'border-emerald-500 text-white bg-slate-900/50'
                : 'border-transparent text-slate-400'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sidebar Content Panels */}
      <div className="flex-1 overflow-y-auto min-h-0">
        
        {/* TAB 1: FILES PANEL */}
        {activeTab === 'files' && (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-4 space-y-4 min-h-[350px] transition-all rounded-lg ${
              isDragging ? 'bg-emerald-950/20 border-2 border-dashed border-emerald-500/50 m-1' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Project Files</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setShowFileForm(!showFileForm)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  title="Add Tex/Bib File"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Upload .tex, .bib, or Image File"
                >
                  <Upload className="w-4 h-4 text-emerald-500" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".tex,.bib,image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Quick Helper for newly created file form */}
            {showFileForm && (
              <form onSubmit={handleCreateFile} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Create Document File</span>
                  <button
                    type="button"
                    onClick={() => setShowFileForm(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="filename"
                    className="flex-1 bg-slate-900 border border-slate-700 text-xs px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-xs px-2 py-1.5 rounded text-white focus:outline-none"
                  >
                    <option value="tex">.tex</option>
                    <option value="bib">.bib</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white font-bold text-xs py-1.5 rounded hover:bg-emerald-500 transition-colors"
                >
                  Create File
                </button>
              </form>
            )}

            {/* Drag & Drop Prompt when dragging */}
            {isDragging && (
              <div className="text-center py-6 border border-dashed border-emerald-500/30 rounded-lg bg-emerald-950/10 text-xs text-emerald-400 font-medium">
                Drop your LaTeX / Bib / Image file here!
              </div>
            )}

            {/* Document Files List */}
            <div className="space-y-1">
              {files.map((file) => {
                const isActive = file.id === activeFileId;
                return (
                  <div
                    key={file.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500 font-semibold shadow-sm' 
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                    onClick={() => onSelectFile(file.id)}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      {file.type === 'tex' && <FileText className="w-4 h-4 text-sky-400 shrink-0" />}
                      {file.type === 'bib' && <Layers className="w-4 h-4 text-purple-400 shrink-0" />}
                      {file.type === 'image' && <Image className="w-4 h-4 text-emerald-400 shrink-0" />}
                      
                      {renamingFileId === file.id ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (renameValue.trim() && onRenameFile) {
                                onRenameFile(file.id, renameValue);
                              }
                              setRenamingFileId(null);
                            } else if (e.key === 'Escape') {
                              setRenamingFileId(null);
                            }
                          }}
                          onBlur={() => {
                            if (renameValue.trim() && onRenameFile) {
                              onRenameFile(file.id, renameValue);
                            }
                            setRenamingFileId(null);
                          }}
                          className="bg-slate-950 border border-slate-700 text-xs px-1.5 py-0.5 rounded text-white focus:outline-none focus:border-emerald-500 font-mono w-full max-w-[130px]"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-xs truncate font-mono select-none">{file.name}</span>
                      )}
                    </div>

                    {file.name !== 'main.tex' && file.name !== 'preamble.tex' && (
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFileId(file.id);
                            setRenameValue(file.name);
                          }}
                          className="p-1 hover:bg-slate-750 rounded text-slate-500 hover:text-emerald-400 transition-colors"
                          title="Rename File"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                              onDeleteFile(file.id);
                            }
                          }}
                          className="p-1 hover:bg-slate-750 rounded text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Figures upload helper card */}
            <div className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-lg text-xs space-y-2">
              <div className="flex items-center gap-1 text-slate-300 font-bold">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Working with Images</span>
              </div>
              <p className="text-slate-500 leading-normal">
                Upload image files to use in your document using the <Image className="inline w-3 h-3 text-emerald-400" /> icon, and refer to them inside your code with:
              </p>
              <code className="block bg-slate-900 border border-slate-800 p-2 text-[10.5px] rounded text-emerald-400 select-all font-mono leading-relaxed">
                \includegraphics{"{"}image_name.png{"}"}
              </code>
            </div>
          </div>
        )}

        {/* TAB 2: TEMPLATES PANEL */}
        {activeTab === 'templates' && (
          <div className="p-4 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">LaTeX Template Library</span>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.name}
                  onClick={() => {
                    if (confirm(`Applying template will overwrite the content of main.tex! Continue?`)) {
                      onApplyTemplate(template.content);
                    }
                  }}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3.5 rounded-lg cursor-pointer transition-all space-y-2 group shadow"
                >
                  <div className="flex items-center gap-2.5">
                    {getCategoryIcon(template.category)}
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {template.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {template.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: REFERENCE LIBRARY HELPERS */}
        {activeTab === 'library' && (
          <div className="p-4 space-y-4 flex flex-col h-full">
            <div className="space-y-2.5 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Interactive LaTeX Library Helper</span>
              <input
                type="text"
                placeholder="Search codes or symbols..."
                value={searchSnippet}
                onChange={(e) => setSearchSnippet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
              />
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pt-2 pr-0.5">
              {filteredSnippetCategories.map((cat, catIdx) => (
                <div key={catIdx} className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">{cat.name}</h5>
                  <div className="grid grid-cols-1 gap-1.5">
                    {cat.items.map((item, itemIdx) => (
                      <button
                        key={itemIdx}
                        onClick={() => onInsertSnippet(item.code)}
                        className="flex items-center justify-between text-left bg-slate-950/60 hover:bg-emerald-950/20 border border-slate-850 hover:border-emerald-800/50 px-3 py-2 rounded text-xs text-slate-300 hover:text-emerald-300 transition-all group font-medium"
                      >
                        <span className="truncate pr-2">{item.label}</span>
                        <span className="text-[10px] font-mono text-slate-600 group-hover:text-emerald-500 shrink-0 select-all max-w-[100px] truncate">
                          {item.code.split('\n')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredSnippetCategories.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No matching LaTeX references found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LAYOUT SETTINGS OPTIONS */}
        {activeTab === 'settings' && (
          <div className="p-4 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Document Settings Override</span>
            
            {/* Document Class */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Document Class (Layout Type)</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'article', label: 'Article' },
                  { value: 'report', label: 'Report' },
                  { value: 'book', label: 'Book' },
                  { value: 'letter', label: 'Letter' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChangeCompilerOptions({ ...compilerOptions, documentClass: opt.value as any })}
                    className={`px-3 py-1.5 text-xs rounded transition-all font-medium border ${
                      compilerOptions.documentClass === opt.value
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/80'
                        : 'bg-slate-950 text-slate-500 border-slate-850 hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Font Family */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Global Typography Font</label>
              <div className="space-y-1.5">
                {[
                  { value: 'computer-modern', label: 'Computer Modern Serif (Classic)' },
                  { value: 'times', label: 'Times New Roman (Academic)' },
                  { value: 'helvetica', label: 'Helvetica Standard (Modern)' },
                  { value: 'garamond', label: 'Garamond Fine Print (Editorial)' },
                  { value: 'georgia', label: 'Georgia Serif (Draft)' },
                  { value: 'courier', label: 'Courier Monospace (Data)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChangeCompilerOptions({ ...compilerOptions, fontFamily: opt.value as any })}
                    className={`w-full text-left px-3.5 py-2 text-xs rounded transition-all font-medium border flex items-center justify-between ${
                      compilerOptions.fontFamily === opt.value
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/80 font-bold'
                        : 'bg-slate-950 text-slate-500 border-slate-850 hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {compilerOptions.fontFamily === opt.value && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Base Text Font Size</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: '10pt', label: '10 pt' },
                  { value: '11pt', label: '11 pt' },
                  { value: '12pt', label: '12 pt' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChangeCompilerOptions({ ...compilerOptions, fontSize: opt.value as any })}
                    className={`px-2 py-1.5 text-xs rounded transition-all font-medium border ${
                      compilerOptions.fontSize === opt.value
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/80'
                        : 'bg-slate-950 text-slate-500 border-slate-850 hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Margin Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Page Margin Width</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'standard', label: 'Standard (1.5 in)' },
                  { value: 'modern', label: 'Modern (1 in)' },
                  { value: 'narrow', label: 'Narrow (0.5 in)' },
                  { value: 'wide', label: 'Wide (2.0 in)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChangeCompilerOptions({ ...compilerOptions, margin: opt.value as any })}
                    className={`px-3 py-1.5 text-xs rounded transition-all font-medium border ${
                      compilerOptions.margin === opt.value
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/80'
                        : 'bg-slate-950 text-slate-500 border-slate-850 hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Spacing */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Line Spacing multiplier</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'single', label: 'Single' },
                  { value: 'one-and-half', label: '1.5' },
                  { value: 'double', label: 'Double' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChangeCompilerOptions({ ...compilerOptions, lineSpacing: opt.value as any })}
                    className={`px-2 py-1.5 text-xs rounded transition-all font-medium border ${
                      compilerOptions.lineSpacing === opt.value
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/80'
                        : 'bg-slate-950 text-slate-500 border-slate-850 hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">A4 vs Letter Format</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'a4', label: 'A4 Paper' },
                  { value: 'letter', label: 'Letter size' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChangeCompilerOptions({ ...compilerOptions, paperSize: opt.value as any })}
                    className={`px-3 py-1.5 text-xs rounded transition-all font-medium border ${
                      compilerOptions.paperSize === opt.value
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/80'
                        : 'bg-slate-950 text-slate-500 border-slate-850 hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Numbers Toggle */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-850">
              <div className="space-y-0.5">
                <span className="text-xs font-bold block text-slate-300">Numbered Sections</span>
                <span className="text-[10px] text-slate-500 block">Auto-inject section numbers</span>
              </div>
              <button
                onClick={() => onChangeCompilerOptions({ ...compilerOptions, showSectionNumbers: !compilerOptions.showSectionNumbers })}
                className={`w-10 h-6 rounded-full p-1 transition-all duration-200 ${
                  compilerOptions.showSectionNumbers ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-all duration-200 transform ${
                    compilerOptions.showSectionNumbers ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

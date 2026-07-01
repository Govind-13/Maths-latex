import React, { useState, useEffect } from 'react';
import { 
  Plus, Minus, RefreshCw, Printer, Download, Eye, 
  Terminal, AlertTriangle, Info, ChevronDown, ChevronUp, FileText,
  Copy, Check, X, RotateCcw
} from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { CompilerOptions, LaTeXDiagnostics } from '../types';

interface DocumentPreviewProps {
  compiledElement: React.ReactNode;
  diagnostics: LaTeXDiagnostics[];
  toc: { title: string; depth: number; id: string }[];
  compilerOptions: CompilerOptions;
  isCompiling: boolean;
  onForceRecompile: () => void;
}

export default function DocumentPreview({
  compiledElement,
  diagnostics,
  toc,
  compilerOptions,
  isCompiling,
  onForceRecompile,
}: DocumentPreviewProps) {
  const [zoomLevel, setZoomLevel] = useState(0.8);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [activeExportModal, setActiveExportModal] = useState<'html' | 'markdown' | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Auto-show diagnostics panel if there are errors
  useEffect(() => {
    if (diagnostics.filter(d => d.type === 'error').length > 0) {
      setShowDiagnostics(true);
    }
  }, [diagnostics]);

  // Handle Zoom operations safely
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.4));
  const handleZoomReset = () => setZoomLevel(0.85);

  // Dynamic html2pdf loader and downloader
  const downloadAsPDF = async () => {
    const docElement = document.getElementById('compiled-document');
    if (!docElement) return;

    try {
      // Temporarily clear styling scale transformation to prevent clipping
      const originalTransform = docElement.style.transform;
      docElement.style.transform = 'scale(1)';

      const options = {
        margin: 0,
        filename: 'Compiled_Document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { 
          unit: 'mm', 
          format: compilerOptions.paperSize === 'a4' ? 'a4' : 'letter', 
          orientation: 'portrait' 
        }
      };

      await html2pdf().set(options).from(docElement).save();
      docElement.style.transform = originalTransform;
    } catch (err) {
      alert(`Could not generate PDF: ${(err as Error).message}`);
    }
  };

  // Client-side Microsoft Word DOCX exporter
  const downloadAsDOCX = () => {
    const docElement = document.getElementById('compiled-document');
    if (!docElement) return;

    try {
      const htmlContent = docElement.innerHTML;
      
      // Determine font family from active document style classes
      let wordFont = "Times New Roman, Times, serif";
      if (docElement.classList.contains('style-helvetica')) {
        wordFont = "Arial, Helvetica, sans-serif";
      } else if (docElement.classList.contains('style-courier')) {
        wordFont = "Courier New, Courier, monospace";
      } else if (docElement.classList.contains('style-garamond')) {
        wordFont = "EB Garamond, Georgia, serif";
      } else if (docElement.classList.contains('style-georgia')) {
        wordFont = "Georgia, serif";
      }

      // Dynamic styles matching the applet's look
      const styles = `
        <style>
          @page WordSection1 {
            size: ${compilerOptions.paperSize === 'a4' ? '210mm 297mm' : '8.5in 11.0in'};
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-header-margin: .5in;
            mso-footer-margin: .5in;
            mso-paper-source: 0;
          }
          div.WordSection1 {
            page: WordSection1;
          }
          body {
            font-family: ${wordFont};
            font-size: ${compilerOptions.fontSize === '12pt' ? '12pt' : (compilerOptions.fontSize === '11pt' ? '11pt' : '10pt')};
            line-height: 1.5;
            color: #000000;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #111111;
            font-weight: bold;
            margin-top: 12pt;
            margin-bottom: 6pt;
          }
          h1 { font-size: 18pt; }
          h2 { font-size: 14pt; }
          h3 { font-size: 12pt; }
          p { margin: 0 0 8pt; text-align: justify; }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 12pt 0;
          }
          table, th, td {
            border: 1px solid #cccccc;
          }
          th, td {
            padding: 8px 12px;
            font-size: 10pt;
            text-align: left;
          }
          ul, ol {
            margin-top: 0;
            margin-bottom: 8pt;
            padding-left: 24px;
          }
          li {
            margin-bottom: 4px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .italic { font-style: italic; }
          blockquote {
            border-left: 3px solid #dddddd;
            padding-left: 12px;
            margin: 12pt 24px;
            color: #555555;
            font-style: italic;
          }
        </style>
      `;

      const documentTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Compiled LaTeX Document</title>
          <!--[if gte mso 9]>
          <xml>
            <o:DocumentProperties>
              <o:Author>LaTeX Document Editor</o:Author>
              <o:Template>Normal</o:Template>
            </o:DocumentProperties>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          ${styles}
        </head>
        <body>
          <div class="WordSection1">
            ${htmlContent}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + documentTemplate], {
        type: 'application/msword;charset=utf-8'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Compiled_Document.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Could not generate DOCX: ${(err as Error).message}`);
    }
  };

  // Standard high-quality vector print
  const handlePrint = () => {
    // Inject temporary print styles targeting only the document
    const styleId = 'latex-document-print-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      @media print {
        body {
          background: white !important;
          color: black !important;
        }
        /* Hide entire web interface */
        #root, header, aside, section {
          display: none !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        /* Show only compiled document */
        #compiled-document {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          padding: 20mm !important;
          margin: 0 !important;
          box-shadow: none !important;
          border: none !important;
          transform: none !important;
        }
      }
    `;

    // Trigger print
    window.print();
  };

  // Helper to extract plain text string representing the HTML preview
  const getCompiledHTML = (): string => {
    const docElement = document.getElementById('compiled-document');
    return docElement ? docElement.outerHTML : '<!-- Document not rendered -->';
  };

  // Helper to construct a simple Markdown representation from current text
  const getCompiledMarkdown = (): string => {
    let md = '';
    md += `# Document Contents\n\n`;
    toc.forEach(item => {
      const prefix = '#'.repeat(item.depth);
      md += `${prefix} ${item.title}\n\n`;
    });
    return md;
  };

  const handleCopyExportText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <section className="w-1/2 flex flex-col bg-slate-900 border-l border-slate-800 h-full overflow-hidden select-none">
      {/* Top action bar */}
      <div className="h-13 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onForceRecompile}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
            Recompile
          </button>
          
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest bg-slate-900 px-2 py-1 rounded">
            Live Preview
          </span>
        </div>

        {/* Zoom controls & Exports */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs text-slate-400">
            <button onClick={handleZoomOut} className="p-1 hover:text-white rounded" title="Zoom Out">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="min-w-[42px] text-center font-bold font-mono text-[10px]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button onClick={handleZoomIn} className="p-1 hover:text-white rounded" title="Zoom In">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleZoomReset} className="p-1 hover:text-white rounded border-l border-slate-800 pl-1.5 ml-1" title="Reset Zoom">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Formats Dropdown */}
          <button
            onClick={() => setActiveExportModal('html')}
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Export compiled HTML Code"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* High-quality vector printing */}
          <button
            onClick={handlePrint}
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Print Vector PDF / Save via Browser"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Client-side PDF downloader */}
          <button
            onClick={downloadAsPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 font-bold text-xs rounded-lg border border-slate-800 hover:border-emerald-500/30 transition-all shadow cursor-pointer"
            title="Download PDF directly"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            PDF
          </button>

          {/* Client-side DOCX downloader */}
          <button
            onClick={downloadAsDOCX}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-sky-400 hover:text-sky-300 font-bold text-xs rounded-lg border border-slate-800 hover:border-sky-500/30 transition-all shadow cursor-pointer"
            title="Download Microsoft Word DOCX"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            DOCX
          </button>
        </div>
      </div>

      {/* Main document display workspace */}
      <div className="flex-1 overflow-auto p-12 flex justify-center bg-slate-950/45 relative select-text">
        <div 
          id="pdf-wrapper"
          style={{ 
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="h-fit shrink-0 select-text"
        >
          {compiledElement}
        </div>
      </div>

      {/* Diagnostics / Compiler Console drawer */}
      <div className="border-t border-slate-800 bg-slate-950 shrink-0">
        <div 
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-900/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300">Compiler Diagnostics Console</span>
            
            <div className="flex gap-1.5 text-[10px] font-bold">
              {diagnostics.filter(d => d.type === 'error').length > 0 && (
                <span className="bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  {diagnostics.filter(d => d.type === 'error').length} Errors
                </span>
              )}
              {diagnostics.filter(d => d.type === 'warning').length > 0 && (
                <span className="bg-amber-950 text-amber-400 border border-amber-900 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  {diagnostics.filter(d => d.type === 'warning').length} Warnings
                </span>
              )}
              {diagnostics.filter(d => d.type === 'info').length > 0 && (
                <span className="bg-blue-950 text-blue-400 border border-blue-900 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Info className="w-3 h-3" />
                  {diagnostics.filter(d => d.type === 'info').length} Info
                </span>
              )}
              {diagnostics.length === 0 && (
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded">
                  Status: Compilation Succeeded
                </span>
              )}
            </div>
          </div>

          <button className="text-slate-500 hover:text-slate-300">
            {showDiagnostics ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {showDiagnostics && (
          <div className="h-44 border-t border-slate-900 overflow-y-auto px-4 py-3 space-y-2 select-text font-mono text-[11px] leading-relaxed">
            {diagnostics.map((diag, idx) => (
              <div 
                key={idx} 
                className={`p-2 rounded-lg border flex gap-2.5 ${
                  diag.type === 'error' 
                    ? 'bg-red-950/20 text-red-400 border-red-900/40' 
                    : diag.type === 'warning' 
                      ? 'bg-amber-950/20 text-amber-400 border-amber-900/40' 
                      : 'bg-blue-950/20 text-blue-400 border-blue-900/40'
                }`}
              >
                <div className="font-bold shrink-0">Line {diag.line}:</div>
                <div className="flex-1">
                  <div className="font-bold mb-0.5">{diag.message}</div>
                  {diag.raw && <code className="block bg-black/40 px-1.5 py-0.5 rounded text-slate-500 text-[10px] mt-1 select-all">{diag.raw}</code>}
                </div>
              </div>
            ))}
            {diagnostics.length === 0 && (
              <div className="text-center py-8 text-slate-500 italic text-xs">
                Perfect! No compiler warnings or syntax mismatches detected.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Export Modals */}
      {activeExportModal && (
        <div className="fixed inset-0 bg-black/75 z-[999] flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full flex flex-col max-h-[80vh] shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Export Compiled Code & Outlines</h3>
              </div>
              <button 
                onClick={() => setActiveExportModal(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selection tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/50 px-2 shrink-0">
              <button
                onClick={() => setActiveExportModal('html')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeExportModal === 'html' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Compiled HTML
              </button>
              <button
                onClick={() => setActiveExportModal('markdown')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeExportModal === 'markdown' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Document Outline (Markdown)
              </button>
            </div>

            {/* Modal content body */}
            <div className="p-4 flex-1 overflow-auto bg-slate-950 select-text">
              <pre className="font-mono text-xs text-slate-300 bg-slate-950 rounded-lg p-4 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
                {activeExportModal === 'html' ? getCompiledHTML() : getCompiledMarkdown()}
              </pre>
            </div>

            {/* Modal footer action */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3 rounded-b-xl shrink-0">
              <button
                onClick={() => handleCopyExportText(activeExportModal === 'html' ? getCompiledHTML() : getCompiledMarkdown())}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors"
              >
                {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={() => setActiveExportModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { CompilerOptions, LaTeXDiagnostics } from '../types';

interface ColorMap {
  [key: string]: string;
}

const DEFAULT_COLORS: ColorMap = {
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#ca8a04',
  black: '#000000',
  white: '#ffffff',
  gray: '#4b5563',
  lightgray: '#d1d5db',
  darkgray: '#1f2937',
  cyan: '#06b6d4',
  magenta: '#d946ef',
  orange: '#ea580c',
  violet: '#7c3aed',
  brown: '#78350f',
  olive: '#84cc16',
  teal: '#0d9488',
  purple: '#9333ea',
  pink: '#db2777',
};

// Find matching character taking nested counts into consideration
function findMatchingChar(text: string, startIndex: number, openChar: string, closeChar: string): number {
  let depth = 1;
  for (let i = startIndex + 1; i < text.length; i++) {
    // skip escaped characters
    if (i > 0 && text[i-1] === '\\') continue;
    if (text[i] === openChar) depth++;
    else if (text[i] === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// Convert a LaTeX dimension option (e.g. 0.5\textwidth, 100px, 5cm) into a CSS style string
function parseImageOptions(optionsStr: string): React.CSSProperties {
  const styles: React.CSSProperties = { maxWidth: '100%', height: 'auto' };
  if (!optionsStr) return styles;

  const pairs = optionsStr.split(',');
  for (let pair of pairs) {
    const [key, val] = pair.trim().split('=');
    if (!key || !val) continue;

    const cleanKey = key.trim();
    const cleanVal = val.trim();

    if (cleanKey === 'width') {
      if (cleanVal.includes('\\textwidth')) {
        const factor = parseFloat(cleanVal) || 1;
        styles.width = `${factor * 100}%`;
      } else if (cleanVal.match(/^\d+$/)) {
        styles.width = `${cleanVal}px`;
      } else {
        styles.width = cleanVal;
      }
    } else if (cleanKey === 'height') {
      styles.height = cleanVal;
    }
  }
  return styles;
}

export function compileLaTeXToReact(
  latex: string,
  options: CompilerOptions,
  customImages: { [key: string]: string } = {}
): {
  element: React.ReactNode;
  diagnostics: LaTeXDiagnostics[];
  toc: { title: string; depth: number; id: string }[];
} {
  const diagnostics: LaTeXDiagnostics[] = [];
  const toc: { title: string; depth: number; id: string }[] = [];
  const customColors: ColorMap = { ...DEFAULT_COLORS };

  // Helper to determine line number from string index
  const getLineNumber = (index: number): number => {
    return latex.substring(0, index).split('\n').length;
  };

  // 1. Preprocessing: Strip comments but keep newlines to preserve correct line numbers
  let processedLatex = '';
  let inComment = false;
  for (let i = 0; i < latex.length; i++) {
    if (inComment) {
      if (latex[i] === '\n') {
        inComment = false;
        processedLatex += '\n';
      } else {
        processedLatex += ' '; // replace comment characters with spaces to keep indices/lines aligned
      }
    } else {
      if (latex[i] === '%' && (i === 0 || latex[i-1] !== '\\')) {
        inComment = true;
        processedLatex += ' ';
      } else {
        processedLatex += latex[i];
      }
    }
  }

  // 2. Parse global custom color declarations (\definecolor{name}{HTML}{HEX})
  const defineColorRegex = /\\definecolor\{([^}]+)\}\{HTML\}\{([^}]+)\}/g;
  let colorMatch;
  while ((colorMatch = defineColorRegex.exec(processedLatex)) !== null) {
    const colorName = colorMatch[1].trim();
    const colorHex = '#' + colorMatch[2].trim().replace('#', '');
    customColors[colorName] = colorHex;
  }

  // 3. Extract metadata
  const titleMatch = processedLatex.match(/\\title\{([\s\S]*?)\}/);
  const authorMatch = processedLatex.match(/\\author\{([\s\S]*?)\}/);
  const dateMatch = processedLatex.match(/\\date\{([\s\S]*?)\}/);

  const titleText = titleMatch ? titleMatch[1].trim() : '';
  const authorText = authorMatch ? authorMatch[1].trim() : '';
  const dateText = dateMatch ? dateMatch[1].trim() : '';

  // 4. Extract document body
  let bodyText = processedLatex;
  const docBeginIndex = processedLatex.indexOf('\\begin{document}');
  const docEndIndex = processedLatex.indexOf('\\end{document}');

  if (docBeginIndex !== -1) {
    if (docEndIndex !== -1) {
      bodyText = processedLatex.substring(docBeginIndex + '\\begin{document}'.length, docEndIndex);
    } else {
      diagnostics.push({
        line: getLineNumber(docBeginIndex),
        type: 'warning',
        message: 'No matching \\end{document} found. Compiling remaining code.',
      });
      bodyText = processedLatex.substring(docBeginIndex + '\\begin{document}'.length);
    }
  } else {
    diagnostics.push({
      line: 1,
      type: 'info',
      message: 'No \\begin{document} block found. Parsing raw snippet as document body.',
    });
  }

  // Counter for unique HTML IDs
  let uniqueIdCounter = 0;
  const getUniqueId = (prefix: string) => `${prefix}-${++uniqueIdCounter}`;

  // Recursive parser to convert body LaTeX markup into React Nodes
  function parseContent(text: string, currentTextSize: string = 'text-base'): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    let idx = 0;

    // Helper to add plain text nodes cleanly
    const pushText = (plain: string) => {
      if (!plain) return;
      nodes.push(<span key={getUniqueId('text')} className={currentTextSize}>{plain}</span>);
    };

    while (idx < text.length) {
      // Find the next interesting item: backslash, $, or $$
      const backslashPos = text.indexOf('\\', idx);
      const mathPos = text.indexOf('$', idx);

      let nextPos = -1;
      if (backslashPos !== -1 && mathPos !== -1) {
        nextPos = Math.min(backslashPos, mathPos);
      } else if (backslashPos !== -1) {
        nextPos = backslashPos;
      } else if (mathPos !== -1) {
        nextPos = mathPos;
      }

      // No special characters left, push the rest of the text
      if (nextPos === -1) {
        pushText(text.substring(idx));
        break;
      }

      // Push text prior to the special character
      if (nextPos > idx) {
        pushText(text.substring(idx, nextPos));
        idx = nextPos;
      }

      // --- HANDLE MATH MODE ($ or $$) ---
      if (text[idx] === '$') {
        const isDisplayMath = text[idx+1] === '$';
        const delimiter = isDisplayMath ? '$$' : '$';
        const startPos = idx;
        const searchStart = idx + delimiter.length;
        const endPos = text.indexOf(delimiter, searchStart);

        if (endPos === -1) {
          diagnostics.push({
            line: getLineNumber(processedLatex.indexOf(text)) + getLineNumber(idx) - 1,
            type: 'error',
            message: `Unclosed math mode delimiter ${delimiter}`,
            raw: text.substring(idx, idx + 15) + '...',
          });
          pushText(delimiter);
          idx += delimiter.length;
          continue;
        }

        const mathFormula = text.substring(searchStart, endPos).trim();
        try {
          const html = katex.renderToString(mathFormula, {
            displayMode: isDisplayMath,
            throwOnError: false,
          });
          const MathClass = isDisplayMath ? 'my-4 block w-full text-center overflow-x-auto py-2' : 'inline-block px-1';
          nodes.push(
            <span
              key={getUniqueId('math')}
              id={getUniqueId('math-el')}
              className={MathClass}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          nodes.push(
            <code key={getUniqueId('math-error')} id={getUniqueId('err')} className="text-red-500 text-xs font-mono px-1">
              {mathFormula}
            </code>
          );
        }
        idx = endPos + delimiter.length;
        continue;
      }

      // --- HANDLE COMMANDS OR ENVIRONMENTS (\...) ---
      if (text[idx] === '\\') {
        // Find command name
        let cmdEnd = idx + 1;
        while (cmdEnd < text.length && /[a-zA-Z]/.test(text[cmdEnd])) {
          cmdEnd++;
        }

        // Handle single-character commands or escape symbols (e.g., \\, \&, \%)
        if (cmdEnd === idx + 1) {
          const nextChar = text[idx+1];
          if (nextChar === '\\') {
            nodes.push(<br key={getUniqueId('br')} />);
            idx += 2;
            continue;
          } else if (['&', '%', '$', '_', '{', '}', '#'].includes(nextChar)) {
            pushText(nextChar);
            idx += 2;
            continue;
          } else if (nextChar === ' ') {
            pushText(' ');
            idx += 2;
            continue;
          }
        }

        const cmdName = text.substring(idx + 1, cmdEnd);

        // --- ENVIRONMENT HANDLING (\begin{...} ... \end{...}) ---
        if (cmdName === 'begin') {
          // Parse environment name
          const braceStart = text.indexOf('{', cmdEnd);
          if (braceStart === -1) {
            diagnostics.push({
              line: getLineNumber(idx),
              type: 'error',
              message: 'Malformed \\begin statement. Missing environment name.',
            });
            idx = cmdEnd;
            continue;
          }

          const braceEnd = findMatchingChar(text, braceStart, '{', '}');
          if (braceEnd === -1) {
            diagnostics.push({
              line: getLineNumber(idx),
              type: 'error',
              message: 'Unclosed environment name braces after \\begin',
            });
            idx = braceStart + 1;
            continue;
          }

          const envName = text.substring(braceStart + 1, braceEnd).trim();
          const searchEndCmd = `\\end{${envName}}`;
          const endEnvIndex = text.indexOf(searchEndCmd, braceEnd + 1);

          if (endEnvIndex === -1) {
            diagnostics.push({
              line: getLineNumber(idx),
              type: 'error',
              message: `Missing closing statement ${searchEndCmd} for environment \\begin{${envName}}`,
            });
            const remainingContent = text.substring(braceEnd + 1);
            nodes.push(
              <div key={getUniqueId('env-error')} className="border-l-4 border-red-500 pl-4 py-1 my-2 bg-red-50/50">
                <div className="font-bold text-red-700 text-sm">Environment Error: \begin{'{'}{envName}{'}'} has no matching \end</div>
                <div>{parseContent(remainingContent, currentTextSize)}</div>
              </div>
            );
            break;
          }

          const envContent = text.substring(braceEnd + 1, endEnvIndex);
          idx = endEnvIndex + searchEndCmd.length;

          // Process known environments
          if (envName === 'document') {
            nodes.push(...parseContent(envContent, currentTextSize));
          } else if (envName === 'abstract') {
            nodes.push(
              <div key={getUniqueId('abstract')} id={getUniqueId('abstract-card')} className="my-6 mx-8 text-sm text-gray-700 bg-gray-50/50 p-4 border border-gray-100 rounded-sm">
                <div className="font-bold text-center tracking-wider uppercase mb-2 text-xs text-gray-900">Abstract</div>
                <div className="italic leading-relaxed text-justify">{parseContent(envContent, 'text-sm')}</div>
              </div>
            );
          } else if (envName === 'center') {
            nodes.push(
              <div key={getUniqueId('center')} className="text-center my-4 w-full flex flex-col items-center">
                {parseContent(envContent, currentTextSize)}
              </div>
            );
          } else if (envName === 'flushleft') {
            nodes.push(
              <div key={getUniqueId('left')} className="text-left my-4">
                {parseContent(envContent, currentTextSize)}
              </div>
            );
          } else if (envName === 'flushright') {
            nodes.push(
              <div key={getUniqueId('right')} className="text-right my-4">
                {parseContent(envContent, currentTextSize)}
              </div>
            );
          } else if (envName === 'quote') {
            nodes.push(
              <blockquote key={getUniqueId('quote')} className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600 mx-4">
                {parseContent(envContent, currentTextSize)}
              </blockquote>
            );
          } else if (envName === 'itemize' || envName === 'enumerate') {
            // Split content by \item
            const itemPositions: number[] = [];
            let itemIdx = envContent.indexOf('\\item');
            while (itemIdx !== -1) {
              itemPositions.push(itemIdx);
              itemIdx = envContent.indexOf('\\item', itemIdx + 5);
            }

            const items: React.ReactNode[] = [];
            for (let k = 0; k < itemPositions.length; k++) {
              const start = itemPositions[k] + 5;
              const end = k + 1 < itemPositions.length ? itemPositions[k + 1] : envContent.length;
              const itemText = envContent.substring(start, end).trim();
              items.push(
                <li key={getUniqueId('li')} className="mb-1 leading-relaxed">
                  {parseContent(itemText, currentTextSize)}
                </li>
              );
            }

            if (envName === 'itemize') {
              nodes.push(
                <ul key={getUniqueId('ul')} className="list-disc pl-8 my-4 space-y-1">
                  {items}
                </ul>
              );
            } else {
              nodes.push(
                <ol key={getUniqueId('ol')} className="list-decimal pl-8 my-4 space-y-1">
                  {items}
                </ol>
              );
            }
          } else if (envName === 'equation' || envName === 'align' || envName === 'gather') {
            try {
              const displayMathFormula = envContent.trim();
              const html = katex.renderToString(displayMathFormula, {
                displayMode: true,
                throwOnError: false,
              });
              nodes.push(
                <div
                  key={getUniqueId('display-math')}
                  id={getUniqueId('math-block')}
                  className="my-4 block w-full text-center overflow-x-auto py-2"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch (err) {
              nodes.push(
                <pre key={getUniqueId('display-math-err')} className="bg-red-50 text-red-600 text-xs font-mono p-2 rounded my-2">
                  {envContent}
                </pre>
              );
            }
          } else if (envName === 'tabular') {
            // Tabular environment
            // Extract the tabular column formatting code, e.g. {|l|c|r|}
            const colBraceStart = text.indexOf('{', braceEnd + 1);
            let columnsLayout = 'l';
            let tabContent = envContent;

            if (colBraceStart !== -1 && colBraceStart < text.indexOf('\\begin', braceEnd + 1) && colBraceStart < text.indexOf('}', colBraceStart)) {
              const colBraceEnd = findMatchingChar(text, colBraceStart, '{', '}');
              if (colBraceEnd !== -1) {
                columnsLayout = text.substring(colBraceStart + 1, colBraceEnd).trim();
                // If column format was parsed, adjust where tabContent begins
                tabContent = text.substring(colBraceEnd + 1, endEnvIndex);
                idx = endEnvIndex + searchEndCmd.length;
              }
            }

            // Parse column specifications: support l, c, r and dividers '|'
            const cols = columnsLayout.replace(/[^lcr|]/g, '').split('');
            const alignmentMap: { [key: string]: 'left' | 'center' | 'right' } = {
              l: 'left',
              c: 'center',
              r: 'right',
            };

            const headerStyle = "font-bold border-b-2 border-gray-300 px-4 py-2 bg-gray-50 text-xs uppercase tracking-wider";
            const cellStyle = "border-b border-gray-200 px-4 py-2.5 text-sm";

            // Parse tabular rows separated by \\ and cells by &
            const rawRows = tabContent.split('\\\\');
            const tableRows: React.ReactNode[] = [];

            rawRows.forEach((rawRow, rowIdx) => {
              const cleanRow = rawRow.trim();
              if (!cleanRow && rowIdx === rawRows.length - 1) return; // skip trailing empty row
              if (cleanRow === '\\hline' || cleanRow === '\\hline\\hline') {
                // border indicator, we can handle it via inline borders on cells
                return;
              }

              // Strip horizontal lines from the row content itself
              const rowContent = cleanRow.replace(/\\hline/g, '').trim();
              const cells = rowContent.split('&');

              const isHeader = rowIdx === 0 || rawRows[rowIdx - 1]?.includes('\\hline');

              const cellElements = cells.map((cell, cellIdx) => {
                const alignSpec = cols.filter(char => char !== '|')[cellIdx] || 'l';
                const alignment = alignmentMap[alignSpec] || 'left';

                // Check for border specifications in cols
                const hasLeftBorder = cols[cellIdx * 2] === '|' || cols[cellIdx * 2 - 1] === '|';
                const hasRightBorder = cols[cellIdx * 2 + 1] === '|';

                const borderClasses = `
                  ${hasLeftBorder ? 'border-l border-gray-200' : ''}
                  ${hasRightBorder ? 'border-r border-gray-200' : ''}
                `.trim();

                const style: React.CSSProperties = { textAlign: alignment };

                return isHeader ? (
                  <th
                    key={getUniqueId('th')}
                    id={getUniqueId('table-th')}
                    className={`${headerStyle} ${borderClasses}`}
                    style={style}
                  >
                    {parseContent(cell.trim(), 'text-xs font-bold')}
                  </th>
                ) : (
                  <td
                    key={getUniqueId('td')}
                    id={getUniqueId('table-td')}
                    className={`${cellStyle} ${borderClasses}`}
                    style={style}
                  >
                    {parseContent(cell.trim(), currentTextSize)}
                  </td>
                );
              });

              tableRows.push(
                <tr key={getUniqueId('tr')} className="hover:bg-gray-50/50 transition-colors">
                  {cellElements}
                </tr>
              );
            });

            nodes.push(
              <div key={getUniqueId('table-wrap')} id={getUniqueId('t-wrap')} className="my-6 overflow-x-auto w-full flex justify-center">
                <table className="border-collapse border border-gray-300 max-w-full shadow-sm rounded-sm overflow-hidden bg-white">
                  <tbody>{tableRows}</tbody>
                </table>
              </div>
            );
          } else {
            // Unsupported environment, just render as nested blocks
            diagnostics.push({
              line: getLineNumber(idx),
              type: 'info',
              message: `Rendering unknown environment \\begin{${envName}} as a simple container block.`,
            });
            nodes.push(
              <div key={getUniqueId('env-generic')} className="my-2 p-2 border border-dashed border-gray-300 rounded">
                <div className="text-xs text-gray-400 uppercase font-mono mb-1">{envName} Environment</div>
                {parseContent(envContent, currentTextSize)}
              </div>
            );
          }
          continue;
        }

        // --- DIRECT COMMANDS (\cmd{arg}) ---
        if (cmdName === 'maketitle') {
          nodes.push(
            <div key={getUniqueId('maketitle')} id={getUniqueId('title-block')} className="text-center mb-10 border-b border-gray-100 pb-8 mt-4 select-none">
              {titleText && (
                <h1 className="text-3.5xl font-extrabold tracking-tight text-gray-900 leading-tight mb-3">
                  {titleText}
                </h1>
              )}
              {authorText && (
                <div className="text-lg font-medium text-gray-700 italic mb-2 leading-relaxed">
                  {authorText.split('\\\\').map((auth, aIdx) => (
                    <div key={aIdx}>{auth.trim()}</div>
                  ))}
                </div>
              )}
              {dateText && (
                <p className="text-sm font-semibold text-gray-500 mt-2">
                  {dateText === '\\today' ? new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : dateText}
                </p>
              )}
            </div>
          );
          idx = cmdEnd;
          continue;
        }

        if (cmdName === 'tableofcontents') {
          nodes.push(
            <div key={getUniqueId('toc')} id={getUniqueId('toc-block')} className="my-8 p-6 bg-slate-50 border border-slate-200 rounded shadow-sm max-w-2xl mx-auto">
              <h2 className="text-xl font-bold border-b pb-2 mb-4 text-slate-800">Contents</h2>
              <ul className="space-y-2">
                {toc.map((item, tIdx) => (
                  <li
                    key={tIdx}
                    style={{ paddingLeft: `${(item.depth - 1) * 1.5}rem` }}
                    className="flex justify-between text-sm"
                  >
                    <a href={`#${item.id}`} className="text-blue-600 hover:underline hover:text-blue-800 flex-1 truncate">
                      {item.title}
                    </a>
                    <span className="text-gray-400 font-mono">...............................................</span>
                    <span className="text-gray-600 font-medium ml-2">{tIdx + 1}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
          idx = cmdEnd;
          continue;
        }

        if (cmdName === 'newpage') {
          nodes.push(
            <div key={getUniqueId('newpage')} className="py-4 border-b-2 border-dashed border-sky-300 text-center select-none opacity-60 print:hidden my-8">
              <span className="bg-sky-50 text-sky-600 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-sky-100">
                Page Break
              </span>
            </div>
          );
          idx = cmdEnd;
          continue;
        }

        // Single argument command parsing, e.g., \textbf{Hello}
        const hasOptions = text[cmdEnd] === '[';
        let optionsStr = '';
        let argStart = cmdEnd;

        if (hasOptions) {
          const optionEnd = findMatchingChar(text, cmdEnd, '[', ']');
          if (optionEnd !== -1) {
            optionsStr = text.substring(cmdEnd + 1, optionEnd);
            argStart = optionEnd + 1;
          }
        }

        const hasArg = text[argStart] === '{';
        if (hasArg) {
          const argEnd = findMatchingChar(text, argStart, '{', '}');
          if (argEnd !== -1) {
            const argument = text.substring(argStart + 1, argEnd);
            idx = argEnd + 1;

            // Process commands with argument
            if (cmdName === 'section' || cmdName === 'subsection' || cmdName === 'subsubsection' || cmdName === 'paragraph') {
              const depthMap: { [key: string]: number } = {
                section: 1,
                subsection: 2,
                subsubsection: 3,
                paragraph: 4,
              };
              const depth = depthMap[cmdName] || 1;
              const headingId = `heading-${getUniqueId('h')}`;

              // Table of contents tracking
              toc.push({
                title: argument,
                depth,
                id: headingId,
              });

              const numPrefix = options.showSectionNumbers
                ? `${toc.filter(t => t.depth === depth).length}. `
                : '';

              if (cmdName === 'section') {
                nodes.push(
                  <h2
                    key={getUniqueId('section')}
                    id={headingId}
                    className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-1 mt-8 mb-4 tracking-tight"
                  >
                    {numPrefix}{argument}
                  </h2>
                );
              } else if (cmdName === 'subsection') {
                nodes.push(
                  <h3
                    key={getUniqueId('subsection')}
                    id={headingId}
                    className="text-xl font-bold text-gray-800 mt-6 mb-3 tracking-tight"
                  >
                    {numPrefix}{argument}
                  </h3>
                );
              } else if (cmdName === 'subsubsection') {
                nodes.push(
                  <h4
                    key={getUniqueId('subsubsection')}
                    id={headingId}
                    className="text-lg font-bold text-gray-700 mt-4 mb-2 tracking-tight"
                  >
                    {numPrefix}{argument}
                  </h4>
                );
              } else {
                nodes.push(
                  <h5
                    key={getUniqueId('paragraph')}
                    id={headingId}
                    className="text-base font-bold text-gray-600 mt-3 mb-1"
                  >
                    {argument}
                  </h5>
                );
              }
            } else if (cmdName === 'textbf') {
              nodes.push(
                <strong key={getUniqueId('bold')} className="font-bold text-gray-900">
                  {parseContent(argument, currentTextSize)}
                </strong>
              );
            } else if (cmdName === 'textit' || cmdName === 'emph') {
              nodes.push(
                <em key={getUniqueId('italic')} className="italic">
                  {parseContent(argument, currentTextSize)}
                </em>
              );
            } else if (cmdName === 'underline') {
              nodes.push(
                <span key={getUniqueId('underline')} className="underline decoration-1 underline-offset-2">
                  {parseContent(argument, currentTextSize)}
                </span>
              );
            } else if (cmdName === 'texttt') {
              nodes.push(
                <code key={getUniqueId('code')} className="font-mono text-sm bg-gray-50 border border-gray-100 rounded-md px-1.5 py-0.5 text-pink-600">
                  {argument}
                </code>
              );
            } else if (cmdName === 'textsf') {
              nodes.push(
                <span key={getUniqueId('sans')} className="font-sans">
                  {parseContent(argument, currentTextSize)}
                </span>
              );
            } else if (cmdName === 'textrm') {
              nodes.push(
                <span key={getUniqueId('serif')} className="font-serif">
                  {parseContent(argument, currentTextSize)}
                </span>
              );
            } else if (['tiny', 'small', 'normalsize', 'large', 'Large', 'LARGE', 'huge', 'Huge'].includes(cmdName)) {
              const sizeClasses: { [key: string]: string } = {
                tiny: 'text-xxs',
                small: 'text-sm',
                normalsize: 'text-base',
                large: 'text-lg',
                Large: 'text-xl',
                LARGE: 'text-2xl',
                huge: 'text-3xl',
                Huge: 'text-4xl',
              };
              nodes.push(
                <span key={getUniqueId('size')} className={sizeClasses[cmdName]}>
                  {parseContent(argument, sizeClasses[cmdName])}
                </span>
              );
            } else if (cmdName === 'textcolor') {
              // \textcolor{colorName}{text}
              // Or, if nested: we might have nested braces
              const colorName = argument.trim();
              const textBraceStart = text.indexOf('{', argEnd + 1);

              if (textBraceStart !== -1) {
                const textBraceEnd = findMatchingChar(text, textBraceStart, '{', '}');
                if (textBraceEnd !== -1) {
                  const coloredText = text.substring(textBraceStart + 1, textBraceEnd);
                  idx = textBraceEnd + 1;

                  const colorValue = customColors[colorName] || colorName;
                  nodes.push(
                    <span key={getUniqueId('color')} style={{ color: colorValue }}>
                      {parseContent(coloredText, currentTextSize)}
                    </span>
                  );
                }
              } else {
                // simple color mapping on the text inside the current block
                const colorValue = customColors[colorName] || colorName;
                nodes.push(
                  <span key={getUniqueId('color')} style={{ color: colorValue }}>
                    {parseContent(argument, currentTextSize)}
                  </span>
                );
              }
            } else if (cmdName === 'color') {
              // change color for the rest of the current block
              const colorName = argument.trim();
              const colorValue = customColors[colorName] || colorName;
              currentTextSize += ` text-[${colorValue}]`; // modify current text class
            } else if (cmdName === 'includegraphics') {
              const imgUrl = argument.trim();
              // Check if URL is local custom upload or external URL
              const finalUrl = customImages[imgUrl] || imgUrl;
              const imgStyles = parseImageOptions(optionsStr);

              nodes.push(
                <div key={getUniqueId('img-wrap')} className="my-6 flex flex-col items-center select-none">
                  <img
                    src={finalUrl}
                    alt="LaTeX Illustration"
                    style={imgStyles}
                    referrerPolicy="no-referrer"
                    className="rounded-sm border border-gray-100 shadow-sm object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              );
            } else if (cmdName === 'url' || cmdName === 'href') {
              let url = argument.trim();
              let label = url;

              if (cmdName === 'href') {
                const labelBraceStart = text.indexOf('{', argEnd + 1);
                if (labelBraceStart !== -1) {
                  const labelBraceEnd = findMatchingChar(text, labelBraceStart, '{', '}');
                  if (labelBraceEnd !== -1) {
                    label = text.substring(labelBraceStart + 1, labelBraceEnd);
                    idx = labelBraceEnd + 1;
                  }
                }
              }

              nodes.push(
                <a
                  key={getUniqueId('link')}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-medium hover:text-blue-800 break-all inline-flex items-center gap-0.5"
                >
                  {label}
                </a>
              );
            } else if (cmdName === 'vspace') {
              const height = argument.replace(/[^0-9a-zA-Z.-]/g, '');
              nodes.push(<div key={getUniqueId('vspace')} style={{ height: height || '1rem' }} />);
            } else if (cmdName === 'hspace') {
              const width = argument.replace(/[^0-9a-zA-Z.-]/g, '');
              nodes.push(<span key={getUniqueId('hspace')} style={{ width: width || '1rem', display: 'inline-block' }} />);
            } else {
              // Custom command or unhandled macros, output raw
              nodes.push(
                <span key={getUniqueId('cmd-unknown')} className="text-gray-400 font-mono text-sm underline decoration-dotted">
                  {argument}
                </span>
              );
            }
            continue;
          }
        }

        // Command with NO argument, e.g., \today, \hfill, \vfill
        if (cmdName === 'today') {
          nodes.push(<span key={getUniqueId('today')}>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>);
        } else if (cmdName === 'hfill') {
          nodes.push(<span key={getUniqueId('hfill')} className="flex-grow inline-block" />);
        } else if (cmdName === 'vfill') {
          nodes.push(<div key={getUniqueId('vfill')} className="flex-grow" />);
        } else if (cmdName === 'dots' || cmdName === 'ldots') {
          pushText('...');
        } else if (cmdName === 'quad') {
          nodes.push(<span key={getUniqueId('quad')} className="mx-2" />);
        } else if (cmdName === 'qquad') {
          nodes.push(<span key={getUniqueId('qquad')} className="mx-4" />);
        } else {
          // Keep command text literal if not handled
          pushText(`\\${cmdName}`);
        }
        idx = cmdEnd;
      }
    }

    return nodes;
  }

  const compiledElements = parseContent(bodyText);

  // Layout classes mapping
  const fontClasses: { [key: string]: string } = {
    'computer-modern': 'font-serif tracking-normal leading-relaxed',
    times: 'font-serif tracking-normal leading-relaxed text-black style-times',
    helvetica: 'font-sans tracking-wide leading-relaxed text-slate-800 style-helvetica',
    courier: 'font-mono text-xs leading-normal style-courier',
    garamond: 'font-serif tracking-normal leading-relaxed text-neutral-900 style-garamond',
    georgia: 'font-serif tracking-normal leading-relaxed text-gray-900 style-georgia',
  };

  const marginClasses: { [key: string]: string } = {
    standard: 'p-[25mm] md:p-[30mm]',
    modern: 'p-[20mm] md:p-[25mm]',
    narrow: 'p-[10mm] md:p-[15mm]',
    wide: 'p-[35mm] md:p-[40mm]',
  };

  const spacingClasses: { [key: string]: string } = {
    single: 'space-y-4',
    'one-and-half': 'space-y-5 leading-8',
    double: 'space-y-6 leading-10',
  };

  const paperClasses: { [key: string]: string } = {
    a4: 'w-[210mm] min-h-[297mm]',
    letter: 'w-[8.5in] min-h-[11in]',
  };

  const compiledContainer = (
    <div
      id="compiled-document"
      className={`
        ${fontClasses[options.fontFamily]}
        ${marginClasses[options.margin]}
        ${spacingClasses[options.lineSpacing]}
        ${paperClasses[options.paperSize]}
        bg-white text-gray-900 shadow-2xl relative transition-all duration-300 mx-auto border border-gray-100 select-text text-justify overflow-hidden
      `}
      style={{
        fontSize: options.fontSize === '10pt' ? '14px' : options.fontSize === '11pt' ? '15px' : '16px',
      }}
    >
      <div className="flex flex-col h-full print:p-0">
        {compiledElements}
      </div>
      {/* Decorative page number footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-gray-400 font-serif font-semibold select-none print:hidden">
        1
      </div>
    </div>
  );

  return {
    element: compiledContainer,
    diagnostics,
    toc,
  };
}

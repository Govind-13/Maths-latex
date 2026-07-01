export interface TexFile {
  id: string;
  name: string;
  content: string;
  type: 'tex' | 'bib' | 'image';
  imageUrl?: string; // data URL or web link for images
}

export interface CompilerOptions {
  fontSize: '10pt' | '11pt' | '12pt';
  documentClass: 'article' | 'report' | 'book' | 'letter';
  fontFamily: 'computer-modern' | 'times' | 'helvetica' | 'courier' | 'garamond' | 'georgia';
  margin: 'standard' | 'modern' | 'narrow' | 'wide';
  lineSpacing: 'single' | 'double' | 'one-and-half';
  showSectionNumbers: boolean;
  paperSize: 'a4' | 'letter';
}

export interface LaTeXDiagnostics {
  line: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  raw?: string;
}

export interface LaTeXTemplate {
  name: string;
  description: string;
  category: 'academic' | 'professional' | 'science' | 'cheat-sheet' | 'personal';
  content: string;
  icon: string;
}

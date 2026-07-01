import { LaTeXTemplate } from '../types';

export const templates: LaTeXTemplate[] = [
  {
    name: 'Academic Research Abstract',
    description: 'A professional article layout featuring abstract, math equations, tables, and bibliography.',
    category: 'academic',
    icon: 'GraduationCap',
    content: `% \\documentclass[11pt]{article}
% \\usepackage{xcolor}
% \\usepackage{geometry}
% \\usepackage{graphicx}

\\title{On the Dynamical Stability of Chaotic Attractors}
\\author{Prof. Eleanor Vance \\\\ Department of Applied Mathematics, University of Science}
\\date{July 2026}

\\begin{document}

\\maketitle

\\begin{abstract}
This paper investigates the topological properties and dynamical stability of high-dimensional chaotic systems. We establish a novel bound for Lyapunov exponents under boundary perturbations and demonstrate practical applications in cryptographic key generation using Lorenz and Rossler equations.
\\end{abstract}

\\section{Introduction}
Dynamical systems with sensitive dependence on initial conditions are commonly known as \\textbf{chaotic systems}. Since the seminal work of Edward Lorenz, predicting long-term states in atmospheric systems has remained a fundamental challenge. 

In this work, we analyze the \\textit{logistic map} and its generalizations under discrete time steps:
\\begin{equation}
x_{n+1} = r x_n (1 - x_n)
\\end{equation}
where $x_n \\in [0,1]$ represents the ratio of existing population to the maximum possible population at year $n$, and $r$ is a positive constant representing reproduction rates.

\\subsection{System Classification}
We can classify dynamical behaviors based on the parameter $r$. Below is a summary:

\\begin{itemize}
    \\item \\textbf{Stable Fixed Points}: For $r < 3.0$, the population stabilizes.
    \\item \\textbf{Period Doubling}: At $r = 3.0$, the system oscillates between 2 values.
    \\item \\textbf{Onset of Chaos}: For $r > 3.57$, the system exhibits chaotic behavior.
\\end{itemize}

\\section{Methodology and Simulation}
We conducted numerical experiments simulating the Julia Set attractor. The mathematical mapping is defined by:
\\begin{equation}
f(z) = z^2 + c
\\end{equation}

The fractal landscape rendered from our simulation is displayed below.

\\begin{center}
\\includegraphics[width=0.75\\textwidth]{https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600}
\\\\ \\small{\\textit{Figure 1: Numerical simulation of a complex boundary attractor.}}
\\end{center}

\\subsection{Experimental Data Table}
The empirical bifurcation points were recorded in the following matrix:

\\begin{center}
\\begin{tabular}{|l|c|r|}
\\hline
\\textbf{Parameter r} & \\textbf{Attractor State} & \\textbf{Entropy Value} \\\\
\\hline
1.0 to 2.9 & Stable Node & 0.000 \\\\
\\hline
3.0 to 3.4 & Period 2, 4, 8 & 0.124 \\\\
\\hline
3.5 to 3.8 & Intermittent Chaos & 0.681 \\\\
\\hline
3.9 to 4.0 & Fully Turbulent Chaos & 0.994 \\\\
\\hline
\\end{tabular}
\\end{center}

\\section{Conclusion}
By utilizing custom numerical solvers, we verified that the transition to chaos is strictly bounded by the Feigenbaum constant:
\\begin{equation}
\\delta \\approx 4.6692
\\end{equation}

\\textcolor{teal}{\\textbf{Acknowledgments:}} This work was funded by the National Science Council under Grant No. MATH-2026-X49.

\\end{document}
`
  },
  {
    name: 'Professional CV / Resume',
    description: 'An elegant, high-impact resume template with structured headers, custom colors, and list sections.',
    category: 'professional',
    icon: 'Briefcase',
    content: `% \\documentclass[10pt]{article}
% \\usepackage{xcolor}

\\title{\\textcolor{blue}{DR. ALEX CHEN} \\\\ \\large{Senior Machine Learning Engineer & Researcher}}
\\author{alex.chen@email.com ~|~ +1 (555) 019-2831 ~|~ San Francisco, CA}
\\date{Resume ~|~ Updated July 2026}

\\begin{document}

\\maketitle

\\section{Executive Summary}
Highly motivated researcher and software architect with 8+ years of experience building high-scale machine learning systems and deep learning frameworks. Expert in natural language processing, vector search architectures, and high-performance compilation tools.

\\section{Professional Experience}

\\subsection{Lead Research Engineer | Anthropic AI (2024 - Present)}
\\begin{itemize}
    \\item Led a team of 6 engineers training state-of-the-art multi-modal LLM alignment models.
    \\item Improved training compilation efficiency by \\textbf{35\\%} utilizing distributed PyTorch operators.
    \\item Designed low-latency routing algorithms serving 100M+ active queries.
\\end{itemize}

\\subsection{Senior ML Infrastructure Engineer | Google (2021 - 2024)}
\\begin{itemize}
    \\item Designed and optimized TPU-compiler graph passes, reducing memory fragmentation.
    \\item Built real-time embedding pipelines handling 50k requests per second.
    \\item Authored 4 core patents on sparse transformer attention mechanisms.
\\end{itemize}

\\section{Education}
\\begin{itemize}
    \\item \\textbf{Ph.D. in Computer Science} (Specialization in Machine Learning) \\\\
    Stanford University | 2017 - 2021 | GPA: 3.96 / 4.00
    \\item \\textbf{B.S. in Applied Mathematics & Physics} \\\\
    Massachusetts Institute of Technology | 2013 - 2017
\\end{itemize}

\\section{Technical Skills}
\\begin{center}
\\begin{tabular}{l|c|r}
\\textbf{Category} & \\textbf{Technologies} & \\textbf{Expertise Level} \\\\
\\hline
AI/ML & PyTorch, JAX, TensorFlow, Transformers, HuggingFace & Advanced \\\\
Languages & C++, Python, Rust, CUDA, TypeScript, LaTeX & Expert \\\\
Infrastructure & Kubernetes, Docker, GCP, AWS, Ray Distributed & Proficient \\\\
\\end{tabular}
\\end{center}

\\end{document}
`
  },
  {
    name: 'Scientific Lab Report',
    description: 'A formal science lab report layout including experimental objectives, formula analysis, and tables.',
    category: 'science',
    icon: 'FlaskConical',
    content: `% \\documentclass[12pt]{report}
\\title{Physics Lab II: Electromagnetic Wave Deflection}
\\author{Candidate: Sarah Jenkins ~|~ Partner: Daniel K.}
\\date{Performed: June 15, 2026 ~|~ Due: July 01, 2026}

\\begin{document}

\\maketitle

\\section{Objective}
The purpose of this laboratory experiment is to measure the charge-to-mass ratio ($e/m$) of an electron by analyzing its circular path deflection inside a uniform magnetic field generated by Helmholtz coils.

\\section{Theoretical Background}
An electron accelerated through a potential difference $V$ gains kinetic energy:
\\begin{equation}
e V = \\frac{1}{2} m v^2
\\end{equation}

When entering a magnetic field $B$ perpendicular to its velocity vector, the Lorentz force supplies the centripetal acceleration:
\\begin{equation}
e v B = \\frac{m v^2}{r}
\\end{equation}

Solving these equations simultaneously yields the primary expression for the charge-to-mass ratio:
\\begin{equation}
\\frac{e}{m} = \\frac{2V}{B^2 r^2}
\\end{equation}

\\section{Experimental Setup}
The apparatus consists of a Helium-filled vacuum tube mounted inside a Helmholtz coil setup, connected to:
\\begin{enumerate}
    \\item A high-voltage DC power supply (acceleration voltage $V$).
    \\item A low-voltage AC heater filament source.
    \\item An ammeter to measure coil current $I$, which determines the field strength $B$:
\\end{enumerate}

\\begin{equation}
B = \\left(\\frac{4}{5}\\right)^{3/2} \\frac{\\mu_0 N I}{R}
\\end{equation}

\\section{Data Collection and Results}
The deflection radius $r$ was recorded against varying voltages $V$ and currents $I$:

\\begin{center}
\\begin{tabular}{|c|c|c|c|}
\\hline
\\textbf{Trial} & \\textbf{Voltage (V)} & \\textbf{Current (I)} & \\textbf{Radius (cm)} \\\\
\\hline
1 & 150 V & 1.2 A & 4.5 cm \\\\
2 & 200 V & 1.2 A & 5.2 cm \\\\
3 & 250 V & 1.5 A & 4.9 cm \\\\
4 & 300 V & 1.8 A & 4.4 cm \\\\
\\hline
\\end{tabular}
\\end{center}

\\section{Error Analysis}
Our calculated ratio was:
\\begin{equation}
\\left(\\frac{e}{m}\\right)_{exp} \\approx 1.84 \\times 10^{11} \\text{ C/kg}
\\end{equation}

Comparing this to the literature value of $1.7588 \\times 10^{11}$ C/kg yields an experimental error of:
\\begin{equation}
\\text{Percentage Error} = \\left| \\frac{1.7588 - 1.84}{1.7588} \\right| \\times 100\\% \\approx 4.6\\%
\\end{equation}

\\textcolor{red}{\\textbf{Critical Discussion:}} The primary sources of error include visually reading the glowing electron beam's radius against the mirrored scale and local fluctuations in the Earth's magnetic field.

\\end{document}
`
  },
  {
    name: 'Math Formula & Cheat Sheet',
    description: 'A dense, organized document structured for study guides, complex proofs, and formulas.',
    category: 'cheat-sheet',
    icon: 'ListCollapse',
    content: `% \\documentclass[10pt]{article}
\\title{Advanced Calculus & Linear Algebra Cheat Sheet}
\\author{Mathematics Study Group}
\\date{Semester Final Exam Guide - Summer 2026}

\\begin{document}

\\maketitle

\\section{Linear Algebra Fundamentals}
\\subsection{Determinants and Inverses}
For a $2 \\times 2$ matrix $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$, the determinant is:
\\begin{equation}
\\det(A) = ad - bc
\\end{equation}

If $\\det(A) \\neq 0$, the inverse is defined by:
\\begin{equation}
A^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}
\\end{equation}

\\subsection{Eigenvalues and Eigenvectors}
Eigenvalues $\\lambda$ are solved via the characteristic equation:
\\begin{equation}
\\det(A - \\lambda I) = 0
\\end{equation}

\\section{Calculus & Trigonometry}
\\subsection{Taylor Series Expansion}
The Taylor series of a smooth function $f(x)$ centered at a real value $a$ is:
\\begin{equation}
f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x - a)^n
\\end{equation}

Common expansions around $a = 0$ (Maclaurin Series):
\\begin{itemize}
    \\item $e^x = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\dots$
    \\item $\\sin(x) = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\dots$
    \\item $\\cos(x) = 1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} - \\dots$
\\end{itemize}

\\subsection{Trigonometric Identities}
Euler's formula links complex exponentiation and trigonometry:
\\begin{equation}
e^{i \\theta} = \\cos(\\theta) + i \\sin(\\theta)
\\end{equation}

From which we derive the double angle formulae:
\\begin{itemize}
    \\item $\\sin(2\\theta) = 2 \\sin(\\theta) \\cos(\\theta)$
    \\item $\\cos(2\\theta) = \\cos^2(\\theta) - \\sin^2(\\theta) = 2 \\cos^2(\\theta) - 1$
\\end{itemize}

\\section{Important Constants}
\\begin{center}
\\begin{tabular}{c|c|r}
\\textbf{Constant} & \\textbf{Symbol} & \\textbf{Approximation} \\\\
\\hline
Pi & $\\pi$ & 3.14159265 \\\\
Euler's Number & $e$ & 2.71828182 \\\\
Golden Ratio & $\\phi$ & 1.61803398 \\\\
Euler-Mascheroni & $\\gamma$ & 0.57721566 \\\\
\\end{tabular}
\\end{center}

\\end{document}
`
  },
  {
    name: 'Formal Elegant Letter',
    description: 'An elegant professional correspondence template with contact boxes, dates, and sign-offs.',
    category: 'personal',
    icon: 'Mail',
    content: `% \\documentclass[12pt]{letter}
\\title{Letter of Recommendation: Academic Advancement}
\\author{Dr. Eleanor Vance}
\\date{July 1, 2026}

\\begin{document}

\\begin{flushleft}
\\textbf{From:} \\\\
Dr. Eleanor Vance \\\\
Chair, Department of Mathematics \\\\
University of Science \\\\
evance@scienceuniv.edu \\\\
\\end{flushleft}

\\begin{flushright}
\\textbf{To:} \\\\
Admissions & Scholarship Committee \\\\
Elite Institute of Technology \\\\
Cambridge, MA \\\\
\\end{flushright}

\\vspace{1cm}
\\noindent\\textbf{Subject: Professional Recommendation for Sarah Jenkins}
\\vspace{0.5cm}

\\noindent Dear Members of the Admissions Committee,

\\vspace{0.3cm}
I am writing to express my strongest possible recommendation for Sarah Jenkins, who is applying for the Doctorate in Quantum Computing and Mathematical Physics at your esteemed institution. I have known Sarah for the past three years in my capacity as her Professor and Research Advisor.

During her tenure in our advanced dynamics laboratory, Sarah stood out as an exceptionally gifted analytical thinker. She led the simulation of electromagnetic wave deflections and achieved a remarkable level of precision, reducing calibration errors by \\textbf{12\\%}. Her final research paper under my supervision, \\textit{"Quantum Wave-Function Deflection Dynamics"}, demonstrated a maturity of research methodology typically expected of post-doctoral scholars.

Sarah possesses not only deep mathematical intuition but also a stellar command of computational modeling. She is fluent in multiple programming paradigms, including JAX, CUDA, and LaTeX, which she utilized to author the lab's standard documentation.

On a personal level, Sarah is collaborative, highly motivated, and is an active peer mentor in our department's outreach program for young women in mathematics. I have no doubt she will be a stellar addition to your graduate research community.

Please feel free to contact me if you require any further details regarding Sarah's academic achievements or personal character.

\\vspace{1cm}
\\noindent Sincerely,

\\vspace{1.5cm}
\\noindent \\textbf{Dr. Eleanor Vance} \\\\
Chair, Department of Applied Mathematics \\\\
University of Science
\\end{document}
`
  }
];

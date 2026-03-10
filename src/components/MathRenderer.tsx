import React, { useMemo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface Props {
  text: string;
  block?: boolean;
}

/**
 * Consume one brace-delimited group {…} including nested braces.
 * Returns the matched string (with braces) and the new index.
 */
function eatBraceGroup(s: string, i: number): [string, number] {
  if (i >= s.length || s[i] !== '{') return ['', i];
  let depth = 0, start = i;
  while (i < s.length) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') depth--;
    i++;
    if (depth === 0) break;
  }
  return [s.slice(start, i), i];
}

/**
 * After a \command, eat all brace groups, optional brackets, and sub/superscripts.
 * e.g. \frac{a}{b}, \sqrt[3]{x}, \text{hello}_{sub}^{sup}
 */
function eatArgs(s: string, i: number): [string, number] {
  let out = '';
  // Eat optional bracket args like \sqrt[3]{x}
  if (i < s.length && s[i] === '[') {
    const start = i;
    let depth = 0;
    while (i < s.length) {
      if (s[i] === '[') depth++;
      else if (s[i] === ']') depth--;
      i++;
      if (depth === 0) break;
    }
    out += s.slice(start, i);
  }
  // Eat brace groups
  while (i < s.length && s[i] === '{') {
    const [g, ni] = eatBraceGroup(s, i);
    out += g;
    i = ni;
  }
  // Eat trailing subscript/superscript with their brace groups
  while (i < s.length && (s[i] === '_' || s[i] === '^')) {
    out += s[i];
    i++;
    if (i < s.length && s[i] === '{') {
      const [g, ni] = eatBraceGroup(s, i);
      out += g;
      i = ni;
    } else if (i < s.length) {
      out += s[i];
      i++;
    }
  }
  return [out, i];
}

// Common LaTeX commands that should be treated as math
const LATEX_COMMANDS = new Set([
  'frac', 'dfrac', 'tfrac', 'cfrac',
  'sqrt', 'cbrt', 'root',
  'sum', 'prod', 'int', 'iint', 'iiint', 'oint',
  'lim', 'limsup', 'liminf',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh',
  'log', 'ln', 'exp', 'lg',
  'max', 'min', 'sup', 'inf', 'gcd', 'lcm',
  'vec', 'hat', 'bar', 'dot', 'ddot', 'tilde', 'overline', 'underline', 'overrightarrow', 'overleftarrow',
  'mathbf', 'mathit', 'mathrm', 'mathcal', 'mathbb', 'mathsf', 'mathtt', 'mathfrak',
  'textbf', 'textit', 'textrm', 'texttt', 'textsf',
  'text', 'mbox', 'hbox',
  'left', 'right', 'bigl', 'bigr', 'Bigl', 'Bigr',
  'cdot', 'times', 'div', 'pm', 'mp', 'circ', 'bullet',
  'leq', 'geq', 'neq', 'approx', 'equiv', 'sim', 'simeq', 'propto',
  'subset', 'supset', 'subseteq', 'supseteq', 'in', 'notin', 'ni',
  'cup', 'cap', 'setminus', 'emptyset', 'varnothing',
  'forall', 'exists', 'nexists',
  'infty', 'partial', 'nabla', 'hbar', 'ell',
  'to', 'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow', 'leftrightarrow', 'Leftrightarrow', 'mapsto', 'uparrow', 'downarrow',
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi',
  'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon',
  'phi', 'varphi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
  'quad', 'qquad', 'space', 'enspace',
  'not', 'neg',
  'angle', 'measuredangle', 'triangle', 'perp', 'parallel',
  'therefore', 'because',
  'boxed', 'cancel', 'bcancel', 'xcancel',
  'underbrace', 'overbrace',
  'begin', 'end',
  'ce', 'pu', // chemistry (mhchem)
  'mathrm', 'operatorname',
]);

function process(text: string): string[] {
  if (!text) return [];
  let t = String(text);

  // Escape literal dollar signs
  t = t.replace(/\\\$/g, '\x00');

  // Convert \[...\] to $$...$$ and \(...\) to $...$
  t = t.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
  t = t.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

  // Find all existing math ranges to avoid double-wrapping
  function findMathRanges(s: string): [number, number][] {
    const ranges: [number, number][] = [];
    const rx = /\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g;
    let m;
    while ((m = rx.exec(s)) !== null) ranges.push([m.index, m.index + m[0].length]);
    return ranges;
  }

  let ranges = findMathRanges(t);
  const inMath = (x: number) => ranges.some(([a, b]) => x >= a && x < b);

  // === Pass 1: Wrap bare \commands that are outside $ delimiters ===
  let out = '', last = 0, si = 0;
  while (si < t.length) {
    const bi = t.indexOf('\\', si);
    if (bi === -1) break;

    // Skip if inside existing math
    if (inMath(bi)) { si = bi + 1; continue; }

    const cm = t.slice(bi).match(/^\\([a-zA-Z]+)/);
    if (!cm) { si = bi + 1; continue; }

    const cmdName = cm[1];

    // Only wrap known LaTeX commands
    if (!LATEX_COMMANDS.has(cmdName)) { si = bi + cm[0].length; continue; }

    // Handle \begin{env}...\end{env} as block math
    if (cmdName === 'begin') {
      const envMatch = t.slice(bi).match(/^\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/);
      if (envMatch) {
        const fullMatch = envMatch[0];
        out += t.slice(last, bi) + '$$' + fullMatch + '$$';
        last = bi + fullMatch.length;
        si = last;
        continue;
      }
    }

    const [args, end] = eatArgs(t, bi + cm[0].length);
    out += t.slice(last, bi) + '$' + cm[0] + args + '$';
    last = end;
    si = end;
  }
  out += t.slice(last);
  t = out;

  // Recalculate ranges after pass 1
  ranges = findMathRanges(t);

  // === Pass 2: Wrap standalone subscript/superscript patterns outside math ===
  // Patterns like H_2O, x^2, CO_2, Fe^{3+}, etc.
  t = t.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)|([A-Za-z0-9])([_^])(\{[^}]*\}|[A-Za-z0-9+\-])/g,
    (match, math, pre, op, arg) => {
      if (math) return math; // already in math mode
      return '$' + pre + op + arg + '$';
    }
  );

  // === Pass 3: Wrap Greek letter words outside math ===
  const greekWords = 'alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega';
  t = t.replace(
    new RegExp('(\\$\\$[\\s\\S]*?\\$\\$|\\$[^$\\n]*?\\$)|\\b(' + greekWords + ')\\b', 'gi'),
    (m, math, letter) => math ? math : '$\\' + letter.toLowerCase() + '$'
  );

  // === Pass 4: Merge adjacent inline math spans ===
  // $a$$b$ → $ab$, handles cases where wrapping created adjacent $ signs
  t = t.replace(/\$\$(?!\$)/g, (match, offset) => {
    // Only merge if this is truly adjacent inline (not block $$)
    // Check if there's a non-$ before and after
    const before = offset > 0 ? t[offset - 1] : '';
    const after = offset + 2 < t.length ? t[offset + 2] : '';
    // If this looks like end-of-inline followed by start-of-inline, merge
    if (before && before !== '$' && after && after !== '$') {
      return '';
    }
    return match;
  });

  // === Pass 5: Downgrade short $$ blocks to inline $ ===
  t = t.replace(/\$\$([^$\n]{1,60}?)\$\$/g, (m, inner) =>
    !inner.includes('\n') && !inner.includes('\\\\') && !inner.includes('\\begin') ? '$' + inner + '$' : m
  );

  // Restore escaped dollar signs
  t = t.replace(/\x00/g, '\\$');

  // Split into parts: math ($$...$$ or $...$) and plain text
  return t.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g);
}

const MathText: React.FC<Props> = ({ text, block = false }) => {
  const parts = useMemo(() => process(text), [text]);

  return (
    <span style={{ display: block ? 'block' : 'inline', overflowWrap: 'break-word', wordWrap: 'break-word', maxWidth: '100%' }}>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith('$$') && p.endsWith('$$')) {
          const math = p.slice(2, -2).trim();
          try {
            return (
              <span key={i} style={{ display: 'block', textAlign: 'center', padding: '8px 0', overflowX: 'auto' }}>
                <BlockMath math={math} />
              </span>
            );
          } catch {
            return <span key={i} style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.85em' }}>{math}</span>;
          }
        }
        if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
          const math = p.slice(1, -1).trim();
          if (!math) return null;
          try {
            return (
              <span key={i} style={{ display: 'inline', margin: '0 1px' }}>
                <InlineMath math={math} />
              </span>
            );
          } catch {
            return <span key={i} style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.85em' }}>{math}</span>;
          }
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
};

export default MathText;

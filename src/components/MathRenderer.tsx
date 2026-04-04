import React, { useMemo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface Props {
  text: string;
  block?: boolean;
}

// Common LaTeX commands
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
  'ce', 'pu',
  'mathrm', 'operatorname',
]);

// Characters that are valid inside a math expression
const MATH_CHARS = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789=+\\-*/^_{}[]()|\',.<>!: ');

// Map of unicode math symbols → LaTeX equivalents
const UNICODE_MATH_MAP: [RegExp, string][] = [
  [/±/g, '\\pm'], [/∓/g, '\\mp'], [/×/g, '\\times'], [/÷/g, '\\div'],
  [/≤/g, '\\leq'], [/≥/g, '\\geq'], [/≠/g, '\\neq'], [/≈/g, '\\approx'],
  [/∞/g, '\\infty'], [/→/g, '\\rightarrow'], [/←/g, '\\leftarrow'],
  [/⇒/g, '\\Rightarrow'], [/⇐/g, '\\Leftarrow'],
  [/∈/g, '\\in'], [/∉/g, '\\notin'], [/⊂/g, '\\subset'], [/⊃/g, '\\supset'],
  [/∪/g, '\\cup'], [/∩/g, '\\cap'], [/∅/g, '\\emptyset'],
  [/∀/g, '\\forall'], [/∃/g, '\\exists'],
  [/∂/g, '\\partial'], [/∇/g, '\\nabla'], [/√/g, '\\sqrt{}'],
  [/∝/g, '\\propto'], [/°/g, '^\\circ'], [/·/g, '\\cdot'],
  [/⊥/g, '\\perp'], [/∥/g, '\\parallel'], [/△/g, '\\triangle'], [/∠/g, '\\angle'],
];

/**
 * Check if character at position is a "math-like" character.
 * Used to expand math regions outward from a \command.
 */
function isMathChar(ch: string): boolean {
  return MATH_CHARS.has(ch);
}

/**
 * Check if a word (sequence of letters) looks like prose rather than a math variable.
 * Math variables are typically 1-3 letters. Words 5+ letters are usually prose.
 * Exception: some math words like "energy", "mass" that might appear adjacent to math.
 */
function isProseWord(word: string): boolean {
  if (word.length <= 3) return false;
  // Known math-adjacent short words that might appear in expressions
  const mathWords = new Set(['left', 'right', 'over', 'under', 'sqrt', 'frac', 'text', 'quad']);
  if (mathWords.has(word.toLowerCase())) return false;
  return word.length >= 5;
}

/**
 * From a starting position (a \command), expand LEFT to find where the math expression starts.
 * Stops at: sentence punctuation (. or : or , followed by space and a prose word),
 * newlines, or the start of string.
 */
function expandLeft(s: string, pos: number): number {
  let i = pos - 1;
  let lastGoodPos = pos;

  while (i >= 0) {
    const ch = s[i];

    // Stop at newlines
    if (ch === '\n') break;

    // If we see a letter, check if it's part of a prose word
    if (/[a-zA-Z]/.test(ch)) {
      // Scan the full word
      let wordEnd = i + 1;
      let wordStart = i;
      while (wordStart > 0 && /[a-zA-Z]/.test(s[wordStart - 1])) wordStart--;
      const word = s.slice(wordStart, wordEnd);

      if (isProseWord(word)) {
        // This is a prose word. Check if there's math-like stuff after it
        // (like "energy:" or "velocity is")
        const afterWord = s.slice(wordEnd, pos).trim();
        if (afterWord === ':' || afterWord === '=' || afterWord === '') {
          // "energy:" or "velocity =" — include the colon/equals but not the word
          lastGoodPos = wordEnd;
          // Check for colon/equals after
          let scan = wordEnd;
          while (scan < pos && s[scan] === ' ') scan++;
          if (scan < pos && (s[scan] === ':' || s[scan] === '=')) {
            lastGoodPos = scan;
          }
        }
        break;
      }
      i = wordStart - 1;
      lastGoodPos = wordStart;
      continue;
    }

    // Stop at sentence-ending punctuation followed by space
    if (ch === '.' && i > 0 && i < s.length - 1 && s[i + 1] === ' ') {
      // Period followed by space — likely end of sentence
      lastGoodPos = i + 1;
      break;
    }

    // Math characters are ok to include
    if (isMathChar(ch)) {
      lastGoodPos = i;
      i--;
      continue;
    }

    break;
  }

  // Trim leading whitespace from the captured region
  while (lastGoodPos < pos && s[lastGoodPos] === ' ') lastGoodPos++;

  return lastGoodPos;
}

/**
 * From after eating a \command and its args, expand RIGHT to capture the rest of
 * the math expression. Eats: operators, variables, numbers, more \commands, parens, braces.
 * Stops at: prose words, sentence punctuation, newlines.
 */
function expandRight(s: string, pos: number): number {
  let i = pos;

  while (i < s.length) {
    const ch = s[i];

    // Stop at newlines
    if (ch === '\n') break;

    // Another \command — eat it with args and continue
    if (ch === '\\') {
      const cmdMatch = s.slice(i).match(/^\\([a-zA-Z]+)/);
      if (cmdMatch && LATEX_COMMANDS.has(cmdMatch[1])) {
        i += cmdMatch[0].length;
        // Eat \left/ \right delimiter
        if (cmdMatch[1] === 'left' || cmdMatch[1] === 'right' ||
            cmdMatch[1] === 'bigl' || cmdMatch[1] === 'bigr' ||
            cmdMatch[1] === 'Bigl' || cmdMatch[1] === 'Bigr') {
          if (i < s.length && /[()[\]|{}.\\/]/.test(s[i])) {
            if (s[i] === '\\') {
              // \left\{ etc
              i++;
              if (i < s.length) i++;
            } else {
              i++;
            }
          }
        }
        // Eat optional brackets [...]
        if (i < s.length && s[i] === '[') {
          let depth = 0;
          while (i < s.length) {
            if (s[i] === '[') depth++;
            else if (s[i] === ']') { depth--; if (depth === 0) { i++; break; } }
            i++;
          }
        }
        // Eat brace groups {...}
        while (i < s.length && s[i] === '{') {
          let depth = 0;
          while (i < s.length) {
            if (s[i] === '{') depth++;
            else if (s[i] === '}') { depth--; if (depth === 0) { i++; break; } }
            i++;
          }
        }
        // Eat sub/superscripts
        while (i < s.length && (s[i] === '_' || s[i] === '^')) {
          i++;
          if (i < s.length && s[i] === '{') {
            let depth = 0;
            while (i < s.length) {
              if (s[i] === '{') depth++;
              else if (s[i] === '}') { depth--; if (depth === 0) { i++; break; } }
              i++;
            }
          } else if (i < s.length) {
            i++;
          }
        }
        continue;
      }
      break; // Unknown \command — stop
    }

    // Period followed by capital letter or space = likely end of sentence
    if (ch === '.') {
      // Check what follows
      if (i + 1 < s.length && /[A-Z\s]/.test(s[i + 1])) break;
      // Decimal point in number is ok
      if (i > 0 && /\d/.test(s[i - 1]) && i + 1 < s.length && /\d/.test(s[i + 1])) {
        i++;
        continue;
      }
      break;
    }

    // If we see a letter, check if it starts a prose word
    if (/[a-zA-Z]/.test(ch)) {
      // Scan the full word
      let wordStart = i;
      let wordEnd = i;
      while (wordEnd < s.length && /[a-zA-Z']/.test(s[wordEnd])) wordEnd++;
      const word = s.slice(wordStart, wordEnd);

      if (isProseWord(word)) {
        // Prose word — stop before it
        break;
      }
      // Short word (likely a variable) — include it
      i = wordEnd;
      continue;
    }

    // Sub/superscripts
    if (ch === '_' || ch === '^') {
      i++;
      if (i < s.length && s[i] === '{') {
        let depth = 0;
        while (i < s.length) {
          if (s[i] === '{') depth++;
          else if (s[i] === '}') { depth--; if (depth === 0) { i++; break; } }
          i++;
        }
      } else if (i < s.length && /[a-zA-Z0-9+\-]/.test(s[i])) {
        i++;
      }
      continue;
    }

    // Brace groups
    if (ch === '{') {
      let depth = 0;
      while (i < s.length) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}') { depth--; if (depth === 0) { i++; break; } }
        i++;
      }
      continue;
    }

    // Parentheses — include them (they're part of math)
    if (ch === '(' || ch === ')') {
      i++;
      continue;
    }

    // Math operators and characters
    if (/[\d=+\-*/,<>|!: ]/.test(ch)) {
      // Space: only include if followed by more math
      if (ch === ' ') {
        // Look ahead past spaces — is there more math?
        let peek = i;
        while (peek < s.length && s[peek] === ' ') peek++;
        if (peek < s.length) {
          const nextCh = s[peek];
          // More math follows: operator, \command, digit, short variable, paren, brace
          if (nextCh === '\\' || /[\d=+\-*/^_({<>|]/.test(nextCh)) {
            i = peek;
            continue;
          }
          // Check if a short variable or word follows
          if (/[a-zA-Z]/.test(nextCh)) {
            let we = peek;
            while (we < s.length && /[a-zA-Z']/.test(s[we])) we++;
            const w = s.slice(peek, we);
            if (!isProseWord(w)) {
              // Check if after this word there's more math (=, +, \, etc.)
              let afterWord = we;
              while (afterWord < s.length && s[afterWord] === ' ') afterWord++;
              if (afterWord < s.length && /[=+\-*/\\^_<>({]/.test(s[afterWord])) {
                i = peek;
                continue;
              }
              // Word followed by more math-like stuff like subscript
              if (we < s.length && (s[we] === '_' || s[we] === '^')) {
                i = peek;
                continue;
              }
            }
          }
        }
        break; // Space not followed by more math — stop
      }
      i++;
      continue;
    }

    // Anything else — stop
    break;
  }

  // Trim trailing whitespace and punctuation from captured region
  while (i > pos && (s[i - 1] === ' ' || s[i - 1] === ',' || s[i - 1] === ':')) i--;

  return i;
}

/**
 * Find ranges of existing $...$ and $$...$$ delimited math.
 */
function findMathRanges(s: string): [number, number][] {
  const ranges: [number, number][] = [];
  const rx = /\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g;
  let m;
  while ((m = rx.exec(s)) !== null) ranges.push([m.index, m.index + m[0].length]);
  return ranges;
}

function inAnyRange(x: number, ranges: [number, number][]): boolean {
  return ranges.some(([a, b]) => x >= a && x < b);
}

/**
 * Main processing function — converts mixed text+LaTeX into an array of
 * plain text and $/$$ delimited math segments.
 */
function process(text: string): string[] {
  if (!text) return [];
  let t = String(text);

  // === Pass 0: Replace unicode math symbols with LaTeX commands ===
  // Do this BEFORE handling $ delimiters, and skip existing math blocks
  for (const [regex, replacement] of UNICODE_MATH_MAP) {
    t = t.replace(
      new RegExp('(\\$\\$[\\s\\S]*?\\$\\$|\\$[^$\\n]*?\\$)|' + regex.source, 'g'),
      (match, mathGroup) => mathGroup ? mathGroup : '$' + replacement + '$'
    );
  }

  // Escape literal \$
  t = t.replace(/\\\$/g, '\x00ESCAPED_DOLLAR\x00');

  // Fix unpaired $ signs
  const dollarCount = (t.match(/\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    const lastIdx = t.lastIndexOf('$');
    t = t.slice(0, lastIdx) + t.slice(lastIdx + 1);
  }

  // Convert \[...\] to $$...$$ and \(...\) to $...$
  t = t.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
  t = t.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

  // === Pass 1: Find bare \commands outside $ and wrap full math expressions ===
  let ranges = findMathRanges(t);
  const wrappedRegions: [number, number][] = []; // track what we've wrapped to avoid overlaps
  let result = '';
  let lastIdx = 0;
  let searchFrom = 0;

  while (searchFrom < t.length) {
    const backslashIdx = t.indexOf('\\', searchFrom);
    if (backslashIdx === -1) break;

    // Skip if inside existing math
    if (inAnyRange(backslashIdx, ranges) || inAnyRange(backslashIdx, wrappedRegions)) {
      searchFrom = backslashIdx + 1;
      continue;
    }

    const cmdMatch = t.slice(backslashIdx).match(/^\\([a-zA-Z]+)/);
    if (!cmdMatch) { searchFrom = backslashIdx + 1; continue; }

    const cmdName = cmdMatch[1];
    if (!LATEX_COMMANDS.has(cmdName)) { searchFrom = backslashIdx + cmdMatch[0].length; continue; }

    // Handle \begin{env}...\end{env} as block math
    if (cmdName === 'begin') {
      const envMatch = t.slice(backslashIdx).match(/^\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/);
      if (envMatch) {
        const fullLen = envMatch[0].length;
        result += t.slice(lastIdx, backslashIdx) + '$$' + envMatch[0] + '$$';
        lastIdx = backslashIdx + fullLen;
        searchFrom = lastIdx;
        wrappedRegions.push([backslashIdx, lastIdx]);
        continue;
      }
    }

    // Expand LEFT from the \command to capture leading math context
    const mathStart = expandLeft(t, backslashIdx);

    // Eat the \command itself
    let pos = backslashIdx + cmdMatch[0].length;

    // Handle \left/\right — eat delimiter
    if (cmdName === 'left' || cmdName === 'right' ||
        cmdName === 'bigl' || cmdName === 'bigr' ||
        cmdName === 'Bigl' || cmdName === 'Bigr') {
      if (pos < t.length && /[()[\]|{}.\\/]/.test(t[pos])) {
        if (t[pos] === '\\') { pos++; if (pos < t.length) pos++; }
        else pos++;
      }
    }

    // Eat optional bracket args [...]
    if (pos < t.length && t[pos] === '[') {
      let depth = 0;
      while (pos < t.length) {
        if (t[pos] === '[') depth++;
        else if (t[pos] === ']') { depth--; if (depth === 0) { pos++; break; } }
        pos++;
      }
    }

    // Eat brace groups {...}
    while (pos < t.length && t[pos] === '{') {
      let depth = 0;
      while (pos < t.length) {
        if (t[pos] === '{') depth++;
        else if (t[pos] === '}') { depth--; if (depth === 0) { pos++; break; } }
        pos++;
      }
    }

    // Eat trailing sub/superscripts
    while (pos < t.length && (t[pos] === '_' || t[pos] === '^')) {
      pos++;
      if (pos < t.length && t[pos] === '{') {
        let depth = 0;
        while (pos < t.length) {
          if (t[pos] === '{') depth++;
          else if (t[pos] === '}') { depth--; if (depth === 0) { pos++; break; } }
          pos++;
        }
      } else if (pos < t.length) {
        pos++;
      }
    }

    // Expand RIGHT to capture trailing math context
    const mathEnd = expandRight(t, pos);

    // Build result: text before + $mathExpression$
    result += t.slice(lastIdx, mathStart) + '$' + t.slice(mathStart, mathEnd) + '$';
    lastIdx = mathEnd;
    searchFrom = mathEnd;
    wrappedRegions.push([mathStart, mathEnd]);
  }
  result += t.slice(lastIdx);
  t = result;

  // === Pass 2: Wrap standalone subscript/superscript patterns outside math ===
  t = t.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)|([A-Za-z0-9])([_^])(\{[^}]*\}|[A-Za-z0-9+\-])/g,
    (match, math, pre, op, arg) => {
      if (math) return math;
      return '$' + pre + op + arg + '$';
    }
  );

  // === Pass 3: Merge adjacent inline math spans ===
  // $A$stuff$B$ → $AstuffB$ when stuff is math-like glue
  ranges = findMathRanges(t);
  if (ranges.length >= 2) {
    let merged = t.slice(0, ranges[0][0]);
    let i = 0;

    while (i < ranges.length) {
      let currentStart = ranges[i][0];
      let currentEnd = ranges[i][1];
      const isBlock = t.slice(currentStart, currentStart + 2) === '$$';

      if (!isBlock) {
        // Try to merge with subsequent inline spans
        while (i + 1 < ranges.length) {
          const [nextStart, nextEnd] = ranges[i + 1];
          const nextIsBlock = t.slice(nextStart, nextStart + 2) === '$$';
          if (nextIsBlock) break;

          const between = t.slice(currentEnd, nextStart);
          const trimmed = between.trim();

          // Merge if between is math-like glue (operators, short vars, numbers, parens, empty)
          if (trimmed.length === 0 ||
              (trimmed.length <= 50 &&
               !/[.!?;]/.test(trimmed) &&
               !trimmed.split(/\s+/).some(w => /^[a-zA-Z]{5,}$/.test(w)) &&
               /[=+\-*/^_<>()0-9]/.test(trimmed))) {
            // Merge: take inner content of both and glue
            const currentInner = t.slice(currentStart + 1, currentEnd - 1);
            const nextInner = t.slice(nextStart + 1, nextEnd - 1);
            // Build merged: rewrite as one span
            currentEnd = nextEnd;
            const mergedContent = currentInner + between + nextInner;
            // Update ranges entry to reflect merged span
            // We'll handle this by directly building the string
            const mergedSpan = '$' + mergedContent + '$';
            // Replace in our tracking
            currentStart = currentStart; // keep start
            currentEnd = nextEnd; // extend end
            i++;
            // Continue trying to merge with next
            // For string building, we'll handle below
            continue;
          }
          break;
        }

        // Rebuild the merged span content from original text
        const origStart = ranges[Math.max(0, i - (currentEnd !== ranges[i][1] ? 1 : 0))];
        // Simpler approach: just grab everything from first span start to last span end
        // and strip the intermediate $ pairs
      }

      merged += t.slice(currentStart, currentEnd);
      i++;
      if (i < ranges.length) {
        merged += t.slice(currentEnd, ranges[i][0]);
      }
    }
    if (ranges.length > 0) {
      merged += t.slice(ranges[ranges.length - 1][1]);
    }
    t = merged;

    // Simpler merge: just replace $$ (closing then opening) with nothing
    // This handles $A$$B$ → $AB$
    t = t.replace(/\$\$(?!\$)/g, (match, offset) => {
      // Check context: is this end-of-inline + start-of-inline?
      if (offset > 0 && offset + 2 < t.length) {
        const before = t[offset - 1];
        const after = t[offset + 2];
        // If both sides have non-$ content, this is adjacent inline math — merge
        if (before !== '$' && after !== '$') {
          return ' ';
        }
      }
      return match;
    });
  }

  // === Pass 4: Downgrade short $$ blocks to inline $ ===
  t = t.replace(/\$\$([^$\n]{1,100}?)\$\$/g, (m, inner) =>
    !inner.includes('\n') && !inner.includes('\\\\') && !inner.includes('\\begin') ? '$' + inner + '$' : m
  );

  // === Pass 5: Clean up ===
  t = t.replace(/\$\s*\$/g, ''); // Remove empty math spans
  t = t.replace(/\x00ESCAPED_DOLLAR\x00/g, '\\$'); // Restore escaped dollars

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
        // Handle line breaks in plain text
        if (p.includes('\n')) {
          return (
            <span key={i}>
              {p.split('\n').map((line, j, arr) => (
                <React.Fragment key={j}>
                  {line}
                  {j < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
};

export default MathText;

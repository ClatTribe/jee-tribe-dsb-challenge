import React, { useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  block?: boolean;
}

const MathText: React.FC<MathTextProps> = ({ text, block = false }) => {
  const parts = useMemo(() => {
    if (!text) return [];
    let t = String(text);

    // 1. Fix: Handle cases where AI returns escaped dollar signs
    t = t.replace(/\\\$/g, '$');

    // 2. Standardize delimiters: Replace \[...\] with $$...$$ and \(...\) with $...$
    t = t.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    t = t.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

    const greekLetters = [
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 
      'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 
      'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
    ];

    // 3. Robust Auto-wrapping: 
    // First, handle raw LaTeX commands like \omega or \frac{1}{2}
    t = t.replace(/(\$\$[\s\S]*?\$\$|\$.*?\$)|(\\[a-zA-Z]+(?:\{.*?\})?(?:[_^][a-zA-Z0-9{}]+)?)/g, (match, math, command) => {
      if (math) return math;
      return `$${command}$`;
    });

    // Second, handle isolated Greek words like "omega" or "alpha"
    const greekRegex = new RegExp(`(\\$\\$[\\s\\S]*?\\$\\$|\\$.*?\\$)|\\b(${greekLetters.join('|')})\\b`, 'gi');
    t = t.replace(greekRegex, (match, math, letter) => {
      if (math) return math;
      return `$\\${letter}$`;
    });

    // Split text by $$...$$ and $...$
    return t.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);
  }, [text]);

  return (
    <div className={`${block ? 'block space-y-4' : 'inline'} leading-relaxed`}>
      {parts.map((part, i) => {
        if (!part) return null;
        
        if (part.startsWith('$$')) {
          return (
            <div key={i} className="overflow-x-auto text-center py-2">
              <BlockMath math={part.slice(2, -2).trim()} />
            </div>
          );
        } else if (part.startsWith('$')) {
          return (
            <span key={i} className="mx-0.5">
              <InlineMath math={part.slice(1, -1).trim()} />
            </span>
          );
        }
        
        return (
          <Markdown 
            key={i} 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => block ? <p>{children}</p> : <span className="inline">{children}</span>,
              div: ({ children }) => block ? <div>{children}</div> : <span className="inline">{children}</span>,
              ul: ({ children }) => <ul className="list-disc pl-5 my-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>
            }}
          >
            {part}
          </Markdown>
        );
      })}
    </div>
  );
};

export default MathText;

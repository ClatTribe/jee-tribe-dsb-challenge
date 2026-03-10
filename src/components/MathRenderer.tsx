import React, { useMemo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface Props {
  text: string;
  block?: boolean;
}

function eatBraces(s: string, i: number): [string, number] {
  let out = '';
  while (i < s.length && s[i] === '{') {
    let d = 0, g = i;
    while (i < s.length) { if (s[i]==='{') d++; else if (s[i]==='}') d--; i++; if (d===0) break; }
    out += s.slice(g, i);
  }
  while (i < s.length && (s[i]==='_'||s[i]==='^')) {
    out += s[i]; i++;
    if (i < s.length && s[i]==='{') {
      let d=0, g=i;
      while (i<s.length) { if(s[i]==='{') d++; else if(s[i]==='}') d--; i++; if(d===0) break; }
      out += s.slice(g, i);
    } else if (i < s.length) { out += s[i]; i++; }
  }
  return [out, i];
}

function process(text: string): string[] {
  if (!text) return [];
  let t = String(text);

  t = t.replace(/\\\$/g, '\x00');
  t = t.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
  t = t.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

  const ranges: [number,number][] = [];
  const rx = /\$\$[\s\S]*?\$\$|\$[^$]*?\$/g;
  let m;
  while ((m = rx.exec(t)) !== null) ranges.push([m.index, m.index+m[0].length]);
  const inMath = (x: number) => ranges.some(([a,b]) => x>=a && x<b);

  let out='', last=0, si=0;
  while (si < t.length) {
    const bi = t.indexOf('\\', si);
    if (bi===-1) break;
    const cm = t.slice(bi).match(/^\\([a-zA-Z]+)/);
    if (!cm) { si=bi+1; continue; }
    if (inMath(bi)) { si=bi+cm[0].length; continue; }
    const [braces, end] = eatBraces(t, bi+cm[0].length);
    out += t.slice(last, bi) + '$' + cm[0] + braces + '$';
    last = end; si = end;
  }
  out += t.slice(last); t = out;

  const gr = 'alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega';
  t = t.replace(new RegExp('(\\$\\$[\\s\\S]*?\\$\\$|\\$[^$]*?\\$)|\\b('+gr+')\\b','gi'), (m,math,l) => math ? math : '$\\'+l.toLowerCase()+'$');

  t = t.replace(/\$\$([^$\n]{1,40}?)\$\$/g, (m,inner) =>
    !inner.includes('\n') && !inner.includes('\\\\') && !inner.includes('\\begin') ? '$'+inner+'$' : m);

  t = t.replace(/\x00/g, '\\$');
  return t.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g);
}

const MathText: React.FC<Props> = ({ text, block = false }) => {
  const parts = useMemo(() => process(text), [text]);

  return (
    <span style={{ display: block ? 'block' : 'inline', overflowWrap: 'break-word', wordWrap: 'break-word', maxWidth: '100%' }}>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith('$$') && p.endsWith('$$')) {
          try { return <span key={i} style={{display:'block',textAlign:'center',padding:'8px 0',overflowX:'auto'}}><BlockMath math={p.slice(2,-2).trim()}/></span>; }
          catch { return <span key={i} style={{color:'#ef4444',fontFamily:'monospace',fontSize:'0.85em'}}>{p.slice(2,-2)}</span>; }
        }
        if (p.startsWith('$') && p.endsWith('$')) {
          try { return <span key={i} style={{display:'inline',margin:'0 2px'}}><InlineMath math={p.slice(1,-1).trim()}/></span>; }
          catch { return <span key={i} style={{color:'#ef4444',fontFamily:'monospace',fontSize:'0.85em'}}>{p.slice(1,-1)}</span>; }
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
};

export default MathText;

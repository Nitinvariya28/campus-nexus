import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Pre-cleans raw text from backend:
 * - Strips all bracket citations: [1], [2], [3], etc.
 * - Strips raw internal document metadata tags: [Document: ...]
 * - Strips internal file links: file:///...
 * - Strips raw catalog codes: Nirma University-PLC-...
 * - Fixes merged bullet points: separates inline "* " into proper distinct lines
 * - Fixes inline headings: "1. Heading * Point 1" -> proper markdown heading
 */
function cleanMarkdownText(str) {
  if (!str) return '';
  let clean = str;

  // 1. Strip all bracket citation numbers like [1], [2], [3], etc.
  clean = clean.replace(/\s*\[\d+\]/g, '');

  // 2. Strip internal document metadata banners: [Document: Title | Section: ...]
  clean = clean.replace(/\[Document:[^\]]+\]/g, '');

  // 3. Strip file:/// links and raw catalog IDs
  clean = clean.replace(/\[([^\]]+)\]\(file:\/\/\/[^\)]+\)/g, '$1');
  clean = clean.replace(/\(file:\/\/\/[^\)]+\)/g, '');
  clean = clean.replace(/file:\/\/\/\S+/g, '');
  clean = clean.replace(/\[?[A-Za-z\s]+-(?:PLC|ACA|ADM|INT|TECH)-\d+\]?:?/g, '');

  // 4. Strip stray horizontal rules (***, ---) and "Related Topics" headings
  clean = clean.replace(/^\s*[\*\-_]{3,}\s*$/gm, '');
  clean = clean.replace(/^\s*##+\s*(?:Related Topics|Document References|References)?\s*$/gm, '');

  // 5. Fix glued inline bullet points: "...will not be accepted. * Career Benchmark:..."
  clean = clean.replace(/([.!?])\s+\*\s+/g, '$1\n\n* ');

  // 6. Fix glued numbered headings with bullet points: "1. Academic Eligibility * CGPA:..."
  clean = clean.replace(/^(\d+\.\s+[^:\n*]+)\s+\*\s+/gm, '### $1\n\n* ');

  // 7. Normalize consecutive line breaks
  clean = clean.replace(/\n{3,}/g, '\n\n');

  return clean.trim();
}

/**
 * Clean markdown content renderer:
 * - Headings: ###
 * - Bold: **text**
 * - Bullet lists: lines starting with * or -
 * - Numbered lists: lines starting with 1. 2. etc.
 * - Code blocks: ```code```
 * - Inline code: `code`
 */
function FormattedContent({ text, isStreaming }) {
  if (!text) return null;

  const blocks = text.split(/\n\n+/);

  return (
    <div className="space-y-3 leading-relaxed text-xs sm:text-sm text-slate-800">
      {blocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Headings: ### Title or ## Title
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={blockIdx} className="text-xs sm:text-sm font-bold text-slate-900 pt-1 tracking-tight">
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={blockIdx} className="text-sm sm:text-base font-bold text-slate-900 pt-1.5 tracking-tight">
              {renderInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }

        // Code block: ```language ... ```
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const codeLines = trimmed.split('\n');
          const code = codeLines.slice(1, -1).join('\n');
          return (
            <pre
              key={blockIdx}
              className="bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto text-xs font-mono my-2 border border-slate-800 shadow-2xs"
            >
              <code>{code}</code>
            </pre>
          );
        }

        // Bullet list: lines starting with * or -
        const rawLines = trimmed.split('\n');
        // Expand any inline glued bullet points within lines
        const lines = rawLines.flatMap((l) => {
          if (l.includes(' * ')) {
            const parts = l.split(/\s+\*\s+/);
            return parts.map((p, i) => (i === 0 ? p : `* ${p}`));
          }
          return [l];
        });

        const isBulletList = lines.every((line) => line.trim().startsWith('* ') || line.trim().startsWith('- '));
        if (isBulletList) {
          return (
            <ul key={blockIdx} className="space-y-1.5 pl-4 list-disc marker:text-blue-500">
              {lines.map((line, lineIdx) => {
                const itemText = line.replace(/^[\*\-]\s+/, '');
                return <li key={lineIdx}>{renderInline(itemText)}</li>;
              })}
            </ul>
          );
        }

        // Numbered list: lines starting with 1. 2. etc.
        const isNumberedList = lines.every((line) => /^\d+\.\s+/.test(line.trim()));
        if (isNumberedList) {
          return (
            <ol key={blockIdx} className="space-y-1.5 pl-4 list-decimal marker:text-blue-600 font-medium">
              {lines.map((line, lineIdx) => {
                const itemText = line.replace(/^\d+\.\s+/, '');
                return <li key={lineIdx} className="font-normal">{renderInline(itemText)}</li>;
              })}
            </ol>
          );
        }

        // Standard paragraph
        const isLastBlock = blockIdx === blocks.length - 1;
        return (
          <p key={blockIdx} className="leading-relaxed">
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {renderInline(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
            {isLastBlock && isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-blue-600 animate-pulse ml-1 align-middle rounded-xs" />
            )}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(str) {
  if (!str) return '';

  const parts = [];
  let remaining = str;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/);
    const codeMatch = remaining.match(/^([\s\S]*?)`([^`]+)`([\s\S]*)$/);

    const matches = [
      boldMatch ? { type: 'bold', index: boldMatch[1].length, match: boldMatch } : null,
      codeMatch ? { type: 'code', index: codeMatch[1].length, match: codeMatch } : null,
    ].filter(Boolean);

    if (matches.length > 0) {
      matches.sort((a, b) => a.index - b.index);
      const earliest = matches[0];

      if (earliest.type === 'bold') {
        const m = earliest.match;
        if (m[1]) parts.push(<span key={key++}>{m[1]}</span>);
        parts.push(
          <strong key={key++} className="font-bold text-slate-900">
            {m[2]}
          </strong>
        );
        remaining = m[3];
      } else if (earliest.type === 'code') {
        const m = earliest.match;
        if (m[1]) parts.push(<span key={key++}>{m[1]}</span>);
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-mono border border-slate-200"
          >
            {m[2]}
          </code>
        );
        remaining = m[3];
      }
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return parts;
}

/**
 * ChatMessage Component
 * Features:
 * - Cleaned realistic text without [1] citation tags or internal document metadata dumps
 * - Word-by-word streaming typewriter effect for new assistant messages
 * - Clean modern user bubble on the right
 * - Clean uncluttered assistant layout with collapsible sources
 * - Elegant follow-up suggestions
 */
export default function ChatMessage({ message, onSelectFollowup, onContentUpdate }) {
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const rawText = message.content || message.answer || '';
  const fullText = cleanMarkdownText(rawText);
  const citations = Array.isArray(message.citations) ? message.citations : [];
  const followups = Array.isArray(message.suggested_followups) ? message.suggested_followups : [];
  const isGuardrailBlocked = message.guardrail_status === 'POLICY_PROHIBITED';

  // Typewriter streaming state for assistant messages
  const [displayedText, setDisplayedText] = useState(isUser || !message.isNew ? fullText : '');
  const [isStreaming, setIsStreaming] = useState(!isUser && Boolean(message.isNew) && Boolean(fullText));

  useEffect(() => {
    if (isUser || !message.isNew || !fullText) {
      setDisplayedText(fullText);
      setIsStreaming(false);
      return;
    }

    // Split text into words/tokens
    const words = fullText.split(/(\s+)/);
    let currentIndex = 0;
    let accumulated = '';
    setIsStreaming(true);

    const intervalId = setInterval(() => {
      if (currentIndex < words.length) {
        accumulated += words[currentIndex];
        setDisplayedText(accumulated);
        currentIndex += 1;
        onContentUpdate?.();
      } else {
        clearInterval(intervalId);
        setIsStreaming(false);
        message.isNew = false;
        onContentUpdate?.();
      }
    }, 18);

    return () => clearInterval(intervalId);
  }, [fullText, isUser, message.isNew]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // User Message
  if (isUser) {
    return (
      <div className="flex justify-end pl-8 sm:pl-16 animate-in fade-in-50 duration-200">
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-2xs max-w-lg">
          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
            {fullText}
          </p>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex items-start gap-3 pr-2 sm:pr-6 animate-in fade-in-50 duration-200">
      {/* Bot Icon */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      {/* Assistant Message Card */}
      <div className="flex-1 bg-white rounded-2xl rounded-tl-xs border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5 min-w-0">
        {/* Guardrail Policy Notice */}
        {isGuardrailBlocked && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Notice: Please ask questions related to university guidelines, placement policies, or interview preparation.</span>
          </div>
        )}

        {/* Formatted Content with Typewriter Streaming */}
        <FormattedContent text={displayedText} isStreaming={isStreaming} />

        {/* Source Citations Drawer (Clean & Decluttered, No [1] Tags) */}
        {!isStreaming && citations.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => setShowCitations(!showCitations)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Verified Sources ({citations.length})</span>
              {showCitations ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {showCitations && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in-50 duration-200">
                {citations.map((cite, idx) => {
                  const rawTitle = cite.title || 'University Guidelines';
                  const cleanTitle = rawTitle
                    .replace(/\[?[A-Za-z\s]+-(?:PLC|ACA|ADM|INT|TECH)-\d+\]?:?/g, '')
                    .replace(/\.md$/g, '')
                    .trim() || 'University Guidelines';

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 text-left space-y-1 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <h5 className="text-xs font-semibold text-slate-800 truncate">
                          {cleanTitle}
                        </h5>
                      </div>

                      {cite.section && (
                        <p className="text-[11px] text-slate-500 pl-5 truncate">
                          Section: {cite.section}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Suggested Follow-up Questions (Clean, subtle chips) */}
        {!isStreaming && followups.length > 0 && onSelectFollowup && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Suggested Follow-ups:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {followups.map((fu, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectFollowup(fu)}
                  className="text-left text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-full border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group"
                >
                  <Sparkles className="w-3 h-3 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
                  <span>{fu}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Footer: Status & Copy Button */}
        {!isStreaming && (
          <div className="pt-2 flex items-center justify-between text-2xs text-slate-400 border-t border-slate-50">
            <span className="flex items-center gap-1.5 font-medium text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Grounded in Nirma University official documents</span>
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

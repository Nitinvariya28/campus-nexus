import React, { useState } from 'react';
import { 
  Bot, 
  Copy, 
  Check, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Clean markdown-like content renderer:
 * - Bold: **text**
 * - Bullet lists: lines starting with * or -
 * - Numbered lists: lines starting with 1. 2. etc.
 * - Code blocks: ```code```
 * - Inline code: `code`
 */
function FormattedContent({ text }) {
  if (!text) return null;

  const blocks = text.split(/\n\n+/);

  return (
    <div className="space-y-3 leading-relaxed text-xs sm:text-sm text-slate-800">
      {blocks.map((block, blockIdx) => {
        const trimmed = block.trim();

        // Code block
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

        // Bullet list
        const lines = trimmed.split('\n');
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

        // Numbered list
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
        return (
          <p key={blockIdx}>
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {renderInline(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
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

    if (boldMatch && (!codeMatch || boldMatch[1].length <= codeMatch[1].length)) {
      if (boldMatch[1]) {
        parts.push(<span key={key++}>{boldMatch[1]}</span>);
      }
      parts.push(
        <strong key={key++} className="font-bold text-slate-900">
          {boldMatch[2]}
        </strong>
      );
      remaining = boldMatch[3];
    } else if (codeMatch) {
      if (codeMatch[1]) {
        parts.push(<span key={key++}>{codeMatch[1]}</span>);
      }
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-mono border border-slate-200"
        >
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return parts;
}

/**
 * ChatMessage Component
 * Premium chat message layout for User (right, blue) and Assistant (left, sleek white card).
 */
export default function ChatMessage({ message, onSelectFollowup }) {
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const citations = Array.isArray(message.citations) ? message.citations : [];
  const followups = Array.isArray(message.suggested_followups) ? message.suggested_followups : [];
  const isGuardrailBlocked = message.guardrail_status === 'POLICY_PROHIBITED';
  const messageText = message.content || message.answer || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end pl-8 sm:pl-16">
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-2xs max-w-lg">
          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
            {messageText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 pr-2 sm:pr-8">
      {/* Bot Icon */}
      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
        <Sparkles className="w-4 h-4 text-blue-600" />
      </div>

      {/* Assistant Card */}
      <div className="flex-1 bg-white rounded-2xl rounded-tl-xs border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3 min-w-0">
        {/* Guardrail Alert (if genuinely prohibited by platform policy) */}
        {isGuardrailBlocked && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Notice: Please ask questions related to university guidelines, placement policies, or interview preparation.</span>
          </div>
        )}

        {/* Formatted Content */}
        <FormattedContent text={messageText} />

        {/* Source Citations Drawer */}
        {citations.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => setShowCitations(!showCitations)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200/70 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Verified Sources ({citations.length})
              </span>
              {showCitations ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {showCitations && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in-50 duration-200">
                {citations.map((cite, idx) => {
                  const relevancePct = typeof cite.relevance_score === 'number'
                    ? Math.round(cite.relevance_score * 100)
                    : null;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase truncate">
                          {cite.category || 'OFFICIAL DOC'}
                        </span>
                        {relevancePct != null && (
                          <span className="text-[10px] font-bold text-emerald-700">
                            {relevancePct}% match
                          </span>
                        )}
                      </div>

                      <h5 className="text-xs font-bold text-slate-800 line-clamp-1">
                        {cite.title || cite.document_id}
                      </h5>

                      {cite.section && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
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

        {/* Suggested Follow-up Questions (ChatGPT interactive chips) */}
        {followups.length > 0 && onSelectFollowup && (
          <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Suggested Follow-ups:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {followups.map((fu, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectFollowup(fu)}
                  className="text-left text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-lg border border-slate-200/80 hover:border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>{fu}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Footer: Status & Copy Button */}
        <div className="pt-2 flex items-center justify-between text-2xs text-slate-400 border-t border-slate-50">
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>AlumiBridge Assistant • Educational Project (Simulated Data)</span>
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
      </div>
    </div>
  );
}

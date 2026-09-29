import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import MessageBubble from '../components/chat/ChatBubble.jsx';
import SectionDivider from '../components/chat/SectionDivider.jsx';
import ProgressBar from '../components/chat/ProgressBar.jsx';
import AnswerControls from '../components/chat/AnswerControls.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAudit } from '../hooks/useAudit.js';

export default function ChatPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const { state, loading, sending, error, answer } = useAudit(auditId);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (state?.status === 'completed') {
      navigate(`/audits/${auditId}/result`, { replace: true });
    }
  }, [state?.status, auditId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state?.history?.length]);

    if (loading || !state) {
        return (
        <PageContainer>
            <StatusMessage loading={loading} error={error} />
        </PageContainer>
        );
    }
  // Build the message list, inserting a divider whenever the S changes
  const messages = [];
  let lastSection = null;

  state.history.forEach((h, i) => {
    if (h.section.key !== lastSection) {
      messages.push(<SectionDivider key={`s-${i}`} name={h.section.name} />);
      lastSection = h.section.key;
    }
    messages.push(<MessageBubble key={`q-${i}`} from="bot">{h.question}</MessageBubble>);
    messages.push(
      <MessageBubble key={`a-${i}`} from="user" variant={h.answer ? 'yes' : 'no'}>
        {h.answer ? 'Sí' : (
          <>
            No
            <span className="mt-1 block text-xs opacity-90">{h.deviation}</span>
          </>
        )}
      </MessageBubble>
    );
  });

  if (state.status === 'in_progress') {
    if (state.section.key !== lastSection) {
      messages.push(<SectionDivider key="s-current" name={state.section.name} />);
    }
    messages.push(<MessageBubble key="q-current" from="bot">{state.question.text}</MessageBubble>);
  }

  return (
     <div className="flex min-h-0 flex-1 flex-col">
       <div className="border-b border-slate-200 bg-white px-4 py-3">
         <div className="mx-auto max-w-2xl">
           <h1 className="font-semibold text-slate-800">{state.title}</h1>
           <p className="text-xs text-slate-500">{[state.area ?? state.department, state.supervisor ?? state.contactPerson].filter(Boolean).join(' · ')}</p>
           <div className="mt-2">
             <ProgressBar answered={state.history.length} total={state.total} />
           </div>
         </div>
       </div>

       <section className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages}
          <div ref={bottomRef} />
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {state.status === 'in_progress' && (
            <AnswerControls key={state.index} onAnswer={answer} disabled={sending} />
          )}
        </div>
      </footer>
    </div>
  );
}
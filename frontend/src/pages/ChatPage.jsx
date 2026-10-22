import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import MessageBubble from '../components/chat/ChatBubble.jsx';
import Avatar from '../components/chat/Avatar.jsx';
import SectionDivider from '../components/chat/SectionDivider.jsx';
import ProgressBar from '../components/chat/ProgressBar.jsx';
import PhotoReply from '../components/chat/PhotoReply.jsx';
import { QuickReplies, RatingReplies, DeviationBar, DEVIATION_MAX } from '../components/chat/AnswerControls.jsx';
import { ratingOption } from '../constants/ratings.js';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAudit } from '../hooks/useAudit.js';

const dayFormat = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const capitalizeFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

export default function ChatPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const { state, loading, sending, error, answer } = useAudit(auditId);
  const bottomRef = useRef(null);

  const [mode, setMode] = useState('choose'); 
  const [text, setText] = useState('');

  useEffect(() => {
    if (state?.status === 'completed') {
      navigate(`/audits/${auditId}/result`, { replace: true });
    }
  }, [state?.status, auditId, navigate]);

  useEffect(() => {
    setMode('choose');
    setText('');
  }, [state?.index]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state?.history?.length, mode]);

  if (loading || !state) {
    return (
      <PageContainer>
        <StatusMessage loading={loading} error={error} />
      </PageContainer>
    );
  }

  const inProgress = state.status === 'in_progress';
  const questionType = inProgress ? state.question.type : null;
  const askingPhoto = questionType === 'photo';
  const messages = [
    <div key="date" className="flex items-center gap-3 text-[11px] text-text-muted">
      <span className="h-px flex-1 bg-white/60" />
      {capitalizeFirst(dayFormat.format(new Date(state.createdAt)))}
      <span className="h-px flex-1 bg-white/60" />
    </div>,
  ];
  let lastSection = null;

  state.history.forEach((h, i) => {
    if (h.section.key !== lastSection) {
      messages.push(<SectionDivider key={`s-${i}`} name={h.section.name} />);
      lastSection = h.section.key;
    }
    messages.push(<MessageBubble key={`q-${i}`} from="bot">{h.question}</MessageBubble>);
    messages.push(
      <MessageBubble key={`a-${i}`} from="user">
        {h.type === 'photo' ? (
          <img src={h.photo} alt="Foto del área" className="max-h-56 rounded-xl" />
        ) : h.type === 'rating' ? (
          <>
            {h.points} · {ratingOption(h.points)?.label}
            {h.deviation && <span className="mt-1 block text-xs ">{h.deviation}</span>}
          </>
        ) : h.answer ? 'Sí' : (
          <>
            No
            <span className="mt-1 block text-xs ">{h.deviation}</span>
          </>
        )}
      </MessageBubble>
    );
  });

  if (inProgress) {
    if (state.section.key !== lastSection) {
      messages.push(<SectionDivider key="s-current" name={state.section.name} />);
    }
    messages.push(<MessageBubble key="q-current" from="bot">{state.question.text}</MessageBubble>);
    messages.push(askingPhoto ? (
      <PhotoReply key="photo" disabled={sending} onSend={photo => answer({ photo })} />
    ) : questionType === 'rating' ? (
      <RatingReplies
        key="rating"
        disabled={sending}
        onSelect={points => (points === 0 ? setMode('deviation') : answer({ points }))}
      />
    ) : (
      <QuickReplies
        key="replies"
        disabled={sending}
        onYes={() => answer({ answer: true })}
        onNo={() => setMode('deviation')}
      />
    ));
  }

  const statusText = sending
    ? 'Enviando…'
    : mode === 'deviation'
      ? `Describe la desviación · ${text.length}/${DEVIATION_MAX}`
      : askingPhoto ? 'Esperando foto...' : 'Esperando respuesta...';

  return (
    <div className="flex min-h-0 flex-1 justify-center px-3 py-4 sm:px-4 sm:py-6">
      {/* chat card */}
      <div className="glass neu-raised flex h-full max-h-[880px] min-h-[420px] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/50 bg-white/40">

        {/* Header */}
        <div className="shrink-0 border-b border-white/40 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar size={42} />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold leading-tight text-zf-blue">{state.title}</h1>
                <p className="truncate text-xs leading-tight text-text-muted">
                  {[state.area ?? state.department, state.evaluatedPerson].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_6px_rgba(52,199,89,0.7)]" />
              <span className="text-xs font-medium text-success">
                {state.history.length}/{state.steps}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar answered={state.history.length} total={state.steps} />
          </div>
        </div>

        {/* Messages */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        {inProgress && (
          <DeviationBar
            active={mode === 'deviation'}
            text={text}
            onTextChange={setText}
            onSend={() => answer(questionType === 'rating'
              ? { points: 0, deviation: text.trim() }
              : { answer: false, deviation: text.trim() })}
            disabled={sending}
            idlePlaceholder={askingPhoto ? 'Toma o sube una foto' : questionType === 'rating' ? 'Califica con 2, 1 o 0' : undefined}
          />
        )}

        {/* Status bar */}
        <p className={`shrink-0 px-5 pb-3 text-[11px] ${error ? 'text-danger' : 'text-text-muted'}`}>
          {error ?? statusText}
        </p>
      </div>
    </div>
  );
}

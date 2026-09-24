{/* Tarjeta principal del chat */}
<div className="glass neu-raised rounded-[28px] overflow-hidden border border-white/50 bg-white/40
  flex flex-col h-[calc(100vh-8.5rem)] min-h-[420px] max-h-[880px] w-full max-w-2xl">

  {/* Header */}
  <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/40">
    <div className="flex items-center gap-3">
      <Avatar size={42} />
      <div>
        <p className="text-sm font-semibold text-zf-blue leading-tight">Bot Name</p>
        <p className="text-xs text-text-muted leading-tight">Subtítulo o estado</p>
      </div>
    </div>
    {/* Badge "En línea" */}
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_rgba(52,199,89,0.7)]" />
      <span className="text-xs font-medium text-success">En línea</span>
    </div>
  </div>

  {/* Área de mensajes */}
  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
    {/* Separador de fecha */}
    <div className="flex items-center gap-3 text-[11px] text-text-muted capitalize">
      <span className="flex-1 h-px bg-white/60" />
      Lunes 22 de septiembre
      <span className="flex-1 h-px bg-white/60" />
    </div>

    {/* Burbujas */}
    <ChatBubble from="bot">Mensaje del bot</ChatBubble>
    <ChatBubble from="user">Respuesta del usuario</ChatBubble>

    {/* Quick replies */}
    <div className="flex items-end gap-2 justify-start">
      <Avatar size={26} />
      <div className="glass neu-raised bg-white/65 border border-white/60 rounded-2xl rounded-bl-sm p-1.5 min-w-[180px]">
        <MenuOption icon={<CheckCircleIcon />} color="success">Sí</MenuOption>
        <MenuOption icon={<XCircleIcon />}    color="danger" >No</MenuOption>
      </div>
    </div>
  </div>

  {/* Input bar */}
  <form className="shrink-0 flex items-center gap-2 px-4 py-3.5 border-t border-white/40">
    <input
      className="neu-inset flex-1 bg-white/50 border border-white/50 rounded-full px-4 py-2
        text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
      placeholder="Escribe tu respuesta..."
    />
    <button
      type="submit"
      className="neu-raised w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-accent to-[#409CFF]
        text-white flex items-center justify-center hover:brightness-110 active:scale-95
        transition-all disabled:opacity-40 disabled:active:scale-100"
    >
      <SendIcon className="w-4 h-4" />
    </button>
  </form>

  {/* Status bar inferior */}
  <p className="shrink-0 px-5 pb-3 text-[11px] text-text-muted">Esperando respuesta...</p>
</div>
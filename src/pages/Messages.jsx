import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, fmtDate, todayISO, getBackendUrl } from '../utils/helpers';

export default function Messages() {
  const { db, updateDB, navigate, clientBalance } = useApp();
  const toast = useToast();

  const clients = db.clients || [];
  const messages = db.messages || [];

  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [msgText, setMsgText] = useState('');
  const [sendChannel, setSendChannel] = useState('sms'); // 'sms' | 'portal'
  const [sending, setSending] = useState(false);

  // 3-dots menus state
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [activeMsgMenuId, setActiveMsgMenuId] = useState(null);

  const chatEndRef = useRef(null);
  const chatMenuRef = useRef(null);

  // Filter clients by search query
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const clientMessages = messages.filter(m => m.clientId === selectedClient?.id);
  const bal = selectedClient ? clientBalance(selectedClient.id) : 0;

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clientMessages.length, selectedClientId]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
        setShowChatMenu(false);
      }
      if (!e.target.closest('.msg-menu-container')) {
        setActiveMsgMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Send message handler
  const handleSendMessage = async (textToSend = null) => {
    const content = (textToSend || msgText).trim();
    if (!content) return;
    if (!selectedClient) {
      toast('Mijoz tanlanmagan', 'error');
      return;
    }

    setSending(true);
    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      clientId: selectedClient.id,
      text: content,
      sender: 'me',
      channel: sendChannel,
      timestamp: new Date().toISOString(),
      status: 'sent',
      starred: false,
    };

    // If channel is SMS, attempt real backend Eskiz send
    if (sendChannel === 'sms' && selectedClient.phone) {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: selectedClient.phone,
            message: content
          })
        });
        const data = await res.json();
        if (data.success) {
          newMsg.status = 'delivered';
          newMsg.eskizMode = data.mode;
          toast(data.mode === 'test' ? "SMS yuborildi (Test rejimida qayd etildi)" : "SMS mijozga jo'natildi!");
        } else {
          newMsg.status = 'sent';
          toast(data.error || "SMS serverga yozildi", 'info');
        }
      } catch (err) {
        newMsg.status = 'sent';
        toast("SMS xabari saqlandi (Offline rejim)", 'info');
      }
    } else {
      toast("Xabar mijoz portaliga yuborildi!");
    }

    updateDB(prev => ({
      ...prev,
      messages: [...(prev.messages || []), newMsg]
    }));

    if (!textToSend) setMsgText('');
    setSending(false);
  };

  // Quick templates
  const handleQuickTemplate = (type) => {
    if (!selectedClient) return;
    let template = '';
    const biz = db.businessName || 'Qarz Daftari';

    if (type === 'reminder') {
      template = `Assalomu alaykum ${selectedClient.name}! ${biz} hisobingiz bo'yicha ${fmtMoney(bal, db.currency)} miqdorida qarzdorlik mavjud. Iltimos, to'lovni o'z vaqtida amalga oshirishingizni so'raymiz.`;
    } else if (type === 'receipt') {
      template = `Hurmatli ${selectedClient.name}, ${biz} tomonidan to'lovingiz qabul qilindi. Rahmat! Joriy balansingiz: ${fmtMoney(bal, db.currency)}.`;
    } else if (type === 'request') {
      template = `Assalomu alaykum ${selectedClient.name}! Sizga kerakli mahsulotlar va nasiya xaridlari bo'yicha buyurtmangiz tayyor. Tasdiqlash uchun xabar qoldiring.`;
    } else if (type === 'hello') {
      template = `Assalomu alaykum ${selectedClient.name}! Ishlaringiz yaxshimi? ${biz} xizmatingizda tayyor.`;
    }

    setMsgText(template);
  };

  // Actions for 3-dots menus
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast("Xabar matni nusxalandi");
    setActiveMsgMenuId(null);
  };

  const handleDeleteMessage = (msgId) => {
    updateDB(prev => ({
      ...prev,
      messages: (prev.messages || []).filter(m => m.id !== msgId)
    }));
    toast("Xabar o'chirildi");
    setActiveMsgMenuId(null);
  };

  const handleToggleStar = (msgId) => {
    updateDB(prev => ({
      ...prev,
      messages: (prev.messages || []).map(m => m.id === msgId ? { ...m, starred: !m.starred } : m)
    }));
    toast("Yulduzcha holati o'zgartirildi");
    setActiveMsgMenuId(null);
  };

  const handleSendToTelegram = (text) => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(db.businessName || 'Qarz Daftari')}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setActiveMsgMenuId(null);
  };

  const handleSendToWhatsApp = (text) => {
    if (!selectedClient?.phone) {
      toast("Mijoz telefon raqami kiritilmagan", 'error');
      return;
    }
    const cleanPhone = selectedClient.phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setActiveMsgMenuId(null);
  };

  const handleClearChat = () => {
    if (!selectedClient) return;
    if (confirm(`${selectedClient.name} bilan barcha xabarlar tarixini o'chirishni xohlaysizmi?`)) {
      updateDB(prev => ({
        ...prev,
        messages: (prev.messages || []).filter(m => m.clientId !== selectedClient.id)
      }));
      toast("Suhbat tarixi tozalandi");
      setShowChatMenu(false);
    }
  };

  return (
    <div className="messages-layout" style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      height: 'calc(100vh - 120px)',
      background: 'var(--surface)',
      borderRadius: '16px',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
    }}>
      {/* LEFT SIDEBAR: CLIENT THREADS */}
      <div style={{
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-2)'
      }}>
        {/* Search header */}
        <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>💬 SMS & Chatlar</span>
            <span className="badge gold" style={{ fontSize: '11px' }}>{clients.length} mijoz</span>
          </div>
          <div className="search-box" style={{ width: '100%', maxWidth: 'none', background: 'var(--surface)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Mijozni qidirish..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Client threads list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {filteredClients.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              Mijoz topilmadi
            </div>
          ) : (
            filteredClients.map(c => {
              const isSelected = selectedClient?.id === c.id;
              const lastMsg = messages.filter(m => m.clientId === c.id).slice(-1)[0];
              const clientBal = clientBalance(c.id);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--surface)' : 'transparent',
                    border: isSelected ? '1px solid var(--gold-soft)' : '1px solid transparent',
                    boxShadow: isSelected ? '0 2px 8px rgba(169, 130, 31, 0.1)' : 'none',
                    marginBottom: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isSelected ? 'linear-gradient(135deg, #A9821F, #7a5f16)' : 'var(--surface-3)',
                    color: isSelected ? '#fff' : 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <b style={{ fontSize: '13.5px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.name}
                      </b>
                      {lastMsg && (
                        <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                          {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '12px',
                        color: 'var(--muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '140px'
                      }}>
                        {lastMsg ? lastMsg.text : (c.phone || "Xabar yo'q")}
                      </span>
                      {clientBal > 0 && (
                        <span style={{ fontSize: '10.5px', color: 'var(--rust)', fontWeight: 700 }}>
                          {fmtMoney(clientBal, '')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', position: 'relative' }}>
        {selectedClient ? (
          <>
            {/* Chat header */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-2)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1F6E5C, #0F4539)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '15px'
                }}>
                  {selectedClient.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <b style={{ fontSize: '15px', color: 'var(--ink)' }}>{selectedClient.name}</b>
                    {selectedClient.category && (
                      <span className="badge" style={{ fontSize: '10.5px' }}>{selectedClient.category}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', gap: '8px' }}>
                    <span>{selectedClient.phone || "Telefon raqami yo'q"}</span>
                    <span>•</span>
                    <span style={{ color: bal > 0 ? 'var(--rust)' : 'var(--teal)', fontWeight: 700 }}>
                      Qarz: {fmtMoney(bal, db.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Right Action Buttons & 3-DOTS MENU */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedClient.phone && (
                  <a
                    href={`tel:${selectedClient.phone}`}
                    className="btn btn-outline btn-sm"
                    title="Qo'ng'iroq qilish"
                    style={{ textDecoration: 'none', padding: '6px 10px' }}
                  >
                    📞
                  </a>
                )}

                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('clientDetail', selectedClient.id)}
                  title="Profilga o'tish"
                  style={{ padding: '6px 10px' }}
                >
                  👤 Profil
                </button>

                {/* 3-DOTS HEADER MENU */}
                <div ref={chatMenuRef} style={{ position: 'relative' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowChatMenu(!showChatMenu)}
                    style={{ fontWeight: 900, fontSize: '16px', padding: '4px 10px' }}
                    title="Qo'shimcha amallar"
                  >
                    ⋮
                  </button>

                  {showChatMenu && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '38px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                      width: '220px',
                      zIndex: 50,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <button
                        className="menu-item-btn"
                        onClick={() => { navigate('clientDetail', selectedClient.id); setShowChatMenu(false); }}
                      >
                        <span>👤</span> Mijoz batafsil profili
                      </button>
                      <button
                        className="menu-item-btn"
                        onClick={() => { navigate('clientPortal'); setShowChatMenu(false); }}
                      >
                        <span>🌐</span> Mijoz Ochiq Portali
                      </button>
                      <button
                        className="menu-item-btn"
                        onClick={() => { handleQuickTemplate('reminder'); setShowChatMenu(false); }}
                      >
                        <span>🔔</span> Qarz eslatmasini tayyorlash
                      </button>
                      {selectedClient.phone && (
                        <button
                          className="menu-item-btn"
                          onClick={() => {
                            const url = `https://t.me/share/url?url=${encodeURIComponent(db.businessName || 'Qarz Daftari')}&text=${encodeURIComponent(`Assalomu alaykum ${selectedClient.name}! Sizda ${fmtMoney(bal, db.currency)} qarz mavjud.`)}`;
                            window.open(url, '_blank');
                            setShowChatMenu(false);
                          }}
                        >
                          <span>✈️</span> Telegramga yo'naltirish
                        </button>
                      )}
                      <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                      <button
                        className="menu-item-btn text-danger"
                        onClick={handleClearChat}
                        style={{ color: 'var(--rust)' }}
                      >
                        <span>🗑️</span> Suhbat tarixini tozalash
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Template Chips Toolbar */}
            <div style={{
              display: 'flex',
              gap: '6px',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-3)',
              overflowX: 'auto',
              flexWrap: 'nowrap'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', alignSelf: 'center', fontWeight: 600, marginRight: '4px' }}>
                Tezkor:
              </span>
              <button className="chip" style={{ fontSize: '11.5px', padding: '4px 10px' }} onClick={() => handleQuickTemplate('reminder')}>
                🔔 Qarz eslatmasi
              </button>
              <button className="chip" style={{ fontSize: '11.5px', padding: '4px 10px' }} onClick={() => handleQuickTemplate('receipt')}>
                🧾 To'lov cheki
              </button>
              <button className="chip" style={{ fontSize: '11.5px', padding: '4px 10px' }} onClick={() => handleQuickTemplate('request')}>
                💰 Nasiya taklifi
              </button>
              <button className="chip" style={{ fontSize: '11.5px', padding: '4px 10px' }} onClick={() => handleQuickTemplate('hello')}>
                👋 Salomlashish
              </button>
            </div>

            {/* Message Stream */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'radial-gradient(circle at top right, rgba(169, 130, 31, 0.03), transparent 70%)'
            }}>
              {clientMessages.length === 0 ? (
                <div style={{
                  margin: 'auto',
                  textAlign: 'center',
                  maxWidth: '300px',
                  color: 'var(--muted)'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                  <b style={{ fontSize: '14px', color: 'var(--ink)' }}>Hozircha xabarlar yo'q</b>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>
                    {selectedClient.name} ga birinchi SMS yoki bildirishnoma xabarini jo'nating.
                  </p>
                </div>
              ) : (
                clientMessages.map(msg => {
                  const isMe = msg.sender === 'me';
                  const showMenu = activeMsgMenuId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end',
                        gap: '6px'
                      }}
                    >
                      {/* Message Bubble */}
                      <div
                        className="msg-menu-container"
                        style={{
                          position: 'relative',
                          maxWidth: '75%',
                          background: isMe ? 'linear-gradient(135deg, #164E3D 0%, #0F382B 100%)' : 'var(--surface-2)',
                          color: isMe ? '#FFFFFF' : 'var(--ink)',
                          padding: '10px 14px',
                          borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
                          border: isMe ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--border)'
                        }}
                      >
                        {/* 3-DOTS BUTTON ON EACH MESSAGE */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMsgMenuId(showMenu ? null : msg.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: isMe ? 'auto' : '4px',
                            left: isMe ? '4px' : 'auto',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--muted)',
                            fontSize: '14px',
                            padding: '2px 4px',
                            borderRadius: '4px'
                          }}
                          title="Xabar amallari"
                        >
                          ⋮
                        </button>

                        {/* 3-DOTS POPUP MENU FOR MESSAGE */}
                        {showMenu && (
                          <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: isMe ? 0 : 'auto',
                            left: isMe ? 'auto' : 0,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            zIndex: 40,
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: '170px'
                          }}>
                            <button className="menu-item-btn" onClick={() => handleCopyText(msg.text)}>
                              <span>📋</span> Nusxa olish
                            </button>
                            <button className="menu-item-btn" onClick={() => handleSendToTelegram(msg.text)}>
                              <span>✈️</span> Telegramga ulashish
                            </button>
                            {selectedClient.phone && (
                              <button className="menu-item-btn" onClick={() => handleSendToWhatsApp(msg.text)}>
                                <span>💬</span> WhatsAppga ulashish
                              </button>
                            )}
                            <button className="menu-item-btn" onClick={() => handleToggleStar(msg.id)}>
                              <span>{msg.starred ? '⭐' : '☆'}</span> {msg.starred ? "Yulduzchani olish" : "Yulduzcha qo'yish"}
                            </button>
                            <div style={{ height: '1px', background: 'var(--border)', margin: '3px 0' }} />
                            <button
                              className="menu-item-btn"
                              style={{ color: 'var(--rust)' }}
                              onClick={() => handleDeleteMessage(msg.id)}
                            >
                              <span>🗑️</span> O'chirish
                            </button>
                          </div>
                        )}

                        {/* Message text content */}
                        <div style={{
                          fontSize: '13.5px',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          paddingLeft: isMe ? '18px' : 0,
                          paddingRight: isMe ? 0 : '18px'
                        }}>
                          {msg.text}
                        </div>

                        {/* Meta footer: channel badge, time, status */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '6px',
                          marginTop: '6px',
                          fontSize: '10.5px',
                          opacity: isMe ? 0.8 : 0.6
                        }}>
                          {msg.starred && <span>⭐</span>}
                          <span style={{
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--surface-3)',
                            fontSize: '9.5px',
                            fontWeight: 700
                          }}>
                            {msg.channel === 'sms' ? '📱 SMS' : '🌐 Portal'}
                          </span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <span>{msg.status === 'delivered' ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface-2)'
            }}>
              {/* Channel Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn btn-sm ${sendChannel === 'sms' ? 'btn-gold' : 'btn-outline'}`}
                    onClick={() => setSendChannel('sms')}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    📱 SMS (Eskiz)
                  </button>
                  <button
                    className={`btn btn-sm ${sendChannel === 'portal' ? 'btn-gold' : 'btn-outline'}`}
                    onClick={() => setSendChannel('portal')}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    🌐 Mijoz Portali
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {msgText.length} belgi · {Math.ceil((msgText.length || 1) / 160)} SMS
                </div>
              </div>

              {/* Input Area */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <textarea
                  rows={2}
                  placeholder={`${selectedClient.name} ga ${sendChannel === 'sms' ? 'SMS xabar' : 'portal xabari'} yozing... (Enter jo'natadi)`}
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    resize: 'none',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    fontSize: '13.5px',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
                <button
                  className="btn btn-gold"
                  onClick={() => handleSendMessage()}
                  disabled={sending || !msgText.trim()}
                  style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>🚀</span>
                  <b>{sending ? 'Yuborilmoqda...' : 'Yuborish'}</b>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--muted)' }}>
            Mijozni tanlang
          </div>
        )}
      </div>

      {/* Internal CSS for hoverable 3-dots items */}
      <style>{`
        .menu-item-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          border: none;
          background: none;
          color: var(--ink);
          font-size: 12.5px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: background 0.12s ease;
          width: 100%;
        }
        .menu-item-btn:hover {
          background: var(--surface-2);
        }
        @media (max-width: 768px) {
          .messages-layout {
            grid-template-columns: 1fr !important;
            height: calc(100vh - 140px) !important;
          }
        }
      `}</style>
    </div>
  );
}

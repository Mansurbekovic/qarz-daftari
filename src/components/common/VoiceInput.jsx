import React, { useState, useEffect, useRef } from 'react';
import { parseVoiceDebt, playBeep } from '../../utils/helpers';
import { useToast } from '../../contexts/ToastContext';

export default function VoiceInput({ onResult, onRawText, placeholder = "Ovozli qidirish yoki aytish..." }) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'uz-UZ';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      playBeep('success');
    };

    recognition.onresult = (event) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
      if (onRawText) onRawText(current);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast('Mikrofonga ruxsat berilmadi', 'error');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, [onRawText, toast]);

  const toggleListening = () => {
    if (!supported) {
      toast('Brauzeringizda ovozli kiritish qo\'llab-quvvatlanmaydi', 'warning');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (transcript && onResult) {
        const parsed = parseVoiceDebt(transcript);
        onResult(parsed);
        toast(`Tushunildi: "${transcript}"`);
      }
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        // restart if active
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 150);
        } catch (err) {}
      }
    }
  };

  const handleApply = () => {
    if (transcript && onResult) {
      const parsed = parseVoiceDebt(transcript);
      onResult(parsed);
      toast(`Ovoz qabul qilindi: "${transcript}"`);
      setTranscript('');
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  return (
    <div className="voice-input-container">
      <button
        type="button"
        className={`btn-voice ${isListening ? 'active recording' : ''}`}
        onClick={toggleListening}
        title={isListening ? "Ovoz yozishni to'xtatish" : "Ovoz bilan aytish (Mikrofon)"}
      >
        <span className="voice-icon">{isListening ? '⏹️' : '🎙️'}</span>
        <span className="voice-label">{isListening ? "Eshitilmoqda..." : "Ovozli kiritish"}</span>
        {isListening && <span className="pulse-ring"></span>}
      </button>

      {transcript && (
        <div className="voice-transcript-bubble">
          <span className="transcript-text">"{transcript}"</span>
          <button type="button" className="btn-mini-apply" onClick={handleApply}>
            ✓ Qo'llash
          </button>
        </div>
      )}
    </div>
  );
}

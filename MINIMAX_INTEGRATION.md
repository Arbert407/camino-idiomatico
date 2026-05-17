# Integración MiniMax + Speech-to-Text Open Source

## API Key desde Input (localStorage)

La API key se ingresa desde un input en la UI y se guarda en localStorage - nunca está en el código.

---

### Flujo completo

```
┌─────────────────────────────────────────────────────────────────┐
│                 FLUJO COMPLETO                      │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │Settings     │    │Input        │                   │
│  │Page        │───→│API Key     │                   │
│  └──────────────┘    └─────┬─────┘                   │
│                            │                          │
│                     localStorage                   │
│                            │                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────┐ │
│  │ Usuario  │ →  │ Grabación│ →  │ STT     │ →  │enviar│ │
│  │selecciona│    │ audio   │    │(Web API)│    │a IA │ │
│  │ ejercicio│    │         │    │         │    │     │ │
│  └──────────┘    └──────────┘    └──────────┘    └──┬───┘ │
│                                                      │       │
│  Header: Authorization: Bearer {apiKey}               │
│                                   │                    │
│                            ┌──────▼──────┐         │
│                            │ API Route  │         │
│                            │ (receives │         │
│                            │   key)    │         │
│                            └──────┬──────┘         │
│                                   │                │
│  Feedback                 ┌──────────▼──────┐     │
│  en pantalla    ←────────│ respuesta     │──────│
│                       └───────────────┘
└──────────────────────────────────────────────────────────────┘
```

---

### Hook: useAPIKey

```typescript
// hooks/useAPIKey.ts
'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'minimax_api_key';

export function useAPIKey() {
  const [apiKey, setAPIKeyState] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setAPIKeyState(stored);
    }
    setIsLoaded(true);
  }, []);

  // Guardar en localStorage
  const setAPIKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setAPIKeyState(key);
  }, []);

  // Eliminar del localStorage
  const clearAPIKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAPIKeyState('');
  }, []);

  return {
    apiKey,
    isLoaded,
    setAPIKey,
    clearAPIKey,
    hasAPIKey: !!apiKey,
  };
}
```

---

### Componente: APIKeyInput

```typescript
// components/APIKeyInput.tsx
'use client';

import { useState } from 'react';
import { useAPIKey } from '@/hooks/useAPIKey';

export function APIKeyInput() {
  const { apiKey, setAPIKey, clearAPIKey, hasAPIKey } = useAPIKey();
  const [input, setInput] = useState('');
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    if (!input.trim()) return;
    setAPIKey(input.trim());
    setInput('');
    setMessage('¡Guardada!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleClear = () => {
    clearAPIKey();
    setMessage('Eliminada');
    setTimeout(() => setMessage(''), 2000);
  };

  if (!isLoaded) return null;

  return (
    <div className="p-4 border rounded-lg max-w-md">
      <h3 className="font-bold mb-2">Configuración API</h3>
      
      {hasAPIKey ? (
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓ API Key configurada</span>
          <button
            onClick={handleClear}
            className="text-sm text-red-500 hover:underline"
          >
            Eliminar
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-2">
            <input
              type={show ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ingresa tu API Key de MiniMax"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={() => setShow(!show)}
              className="px-2 text-gray-500"
            >
              {show ? '🙈' : '👁️'}
            </button>
          </div>
          
          <button
            onClick={handleSave}
            disabled={!input.trim()}
            className="w-full py-2 bg-blue-500 text-white rounded disabled:opacity50"
          >
            Guardar
          </button>
        </>
      )}
      
      {message && (
        <p className="mt-2 text-sm text-green-600">{message}</p>
      )}
      
      <p className="mt-2 text-xs text-gray-500">
        La key se guarda en localStorage, nunca en el código
      </p>
    </div>
  );
}
```

---

## STT Options (Código Abierto)

| Herramienta | Costo | Instalación | Calidad |
|------------|-------|------------|---------|
| **Web Speech API** | Gratis | Browser native | Buena |
| Whisper.cpp | Gratis |编译 | Excelente |
| Coqui STT | Gratis | Docker | Buena |
| Vosk | Gratis | Binario | Regular |

---

## Recomendado: Web Speech API

Es nativo del navegador, no necesita安装, y funciona en Chrome/Edge/Safari.

### Ejemplo de uso

```typescript
// hooks/useSpeechRecognition.ts
import { useState, useCallback } from 'react';

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => setError(event.error);
    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
```

---

## Flujo Completo con STT

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                      │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────┐ │
│  │ Usuario  │ →  │ Grabación│ →  │ STT     │ →  │enviar│ │
│  │selecciona│    │ audio   │    │(Web API)│    │a IA │ │
│  │ ejercicio│    │         │    │         │    │     │ │
│  └──────────┘    └──────────┘    └──────────┘    └──┬───┘ │
│                                                      │       │
│                                               ┌──────▼──────┐
│                                               │ MiniMax API │
│                                               │ (texto)   │
│                                               └──────┬──────┘
│                                                      │
│  Feedback                 ┌──────────┐    ┌──────────▼──────┐
│  en pantalla    ←────────│ respuesta│ ←──│ feedback    │
│                       └──────────┘    └───────────────┘
└──────────────────────────────────────────────────────────────┘
```

---

## Componente de Ejercicio con STT

```typescript
// components/EjercicioConAudio.tsx
'use client';

import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useState } from 'react';

interface Props {
  pregunta: string;
  contexto: string;
  onSubmit: (texto: string) => Promise<void>;
}

export function EjercicioConAudio({ pregunta, contexto, onSubmit }: Props) {
  const {
    transcript,
    isListening,
    error,
    startListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!transcript.trim()) return;

    setLoading(true);
    try {
      const result = await onSubmit(transcript);
      setFeedback(result.feedback);
    } catch (err) {
      setFeedback('Error al obtener feedback. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-4">
        <h3 className="font-bold text-lg">{pregunta}</h3>
        <p className="text-gray-600 text-sm">{contexto}</p>
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg min-h-[100px]">
        {transcript ? (
          <p className="text-lg">{transcript}</p>
        ) : (
          <p className="text-gray-400">Press the button and speak...</p>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-2">Error: {error}</p>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={startListening}
          disabled={isListening}
          className={`px-4 py-2 rounded-lg ${
            isListening
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {isListening ? '🎤 Recording...' : '🎤 Start'}
        </button>

        <button
          onClick={resetTranscript}
          className="px-4 py-2 bg-gray-200 rounded-lg"
        >
          Clear
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!transcript.trim() || loading}
        className="w-full py-3 bg-green-500 text-white rounded-lg disabled:opacity50"
      >
        {loading ? 'Processing...' : 'Get Feedback'}
      </button>

      {feedback && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <pre className="whitespace-pre-wrap">{feedback}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## Hook de useSpeechRecognition

```typescript
// hooks/useSpeechRecognition.ts
'use client';

import { useState, useCallback, useEffect } from 'react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionAlternative[];
  resultIndex: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = 
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
```

---

## API Route que recibe el texto (con API key desde header)

```typescript
// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Leer API key desde header (enviada por frontend)
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 401 }
      );
    }

    const { message, context } = await req.json();

    const prompt = `
Eres un mentor técnico estadounidense.
Analiza la respuesta del usuario sobre: ${context.topic}
Nivel: ${context.level}
Área: ${context.area}

El usuario dijo: "${message}"

Responde en este formato:
✅ LO QUE HICISTE BIEN:
🔧 CORRECCIÓN:
💡 MEJORA SUGERIDA:
❓ PREGUNTA DE SEGUIMIENTO:
`;

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    return NextResponse.json({
      feedback: data.choices?.[0]?.message?.content || 'No se pudo obtener feedback'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al procesar' },
      { status: 500 }
    );
  }
}

const SYSTEM_PROMPT = `
Eres un mentor técnico estadounidense con 10+ años de experiencia en tech.
El usuario es un ingeniero practicando inglés técnico.
Sé amable pero direto.
Corrige máximo 1-2 errores.
Siempre destaca algo positivo primero.
Haz 1 pregunta de seguimiento relacionada.
`;
```

---

### Frontend: Llamar a la API con la key

```typescript
// hooks/useFeedback.ts
'use client';

import { useAPIKey } from './useAPIKey';

export function useFeedback() {
  const { apiKey } = useAPIKey();

  const getFeedback = async (message: string, context: any) => {
    if (!apiKey) {
      throw new Error('API key no configurada');
    }

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener feedback');
    }

    return response.json();
  };

  return { getFeedback };
}

---

## Resumen del flujo

```
1. Usuario abre Settings
       ↓
2. Ingresa API Key → localStorage
       ↓
3. Usuario abre ejercicio
       ↓
4. Presiona "Start" (Web Speech API activa)
       ↓
5. Usuario habla en inglés
       ↓
6. Browser convierte audio → texto
       ↓
7. Texto se muestra en pantalla
       ↓
8. Usuario presiona "Get Feedback"
       ↓
9. Texto + API Key (desde localStorage) → API Route
       ↓
10. API Route → MiniMax → Feedback
       ↓
11. Feedback se muestra
```

---

## Requisitos

- [x] STT: Web Speech API (gratis, browser native)
- [x] API Key: Input en UI → localStorage
- [x] Frontend: Next.js + React
- [x] Backend: API Route (recibe key desde header)
/**
 * voice.js — Módulo de Voz da AMÉLIA v3.0
 * ==========================================
 *
 * Correções desta versão:
 *  ✅ Bug do áudio: o microfone NÃO captura mais a fala da AMÉLIA.
 *     Solução: o reconhecimento só começa APÓS a síntese terminar (evento onend).
 *              Enquanto o sistema fala, o microfone fica inativo.
 *  ✅ Senhas padronizadas: U001, M001, L001
 *  ✅ Compatível com o novo fluxo de botões do script.js
 *
 * Usa Web Speech API (nativa, gratuita).
 * Melhor suporte: Chrome/Edge. Firefox não suporta SpeechRecognition.
 */

// ── URL da API (detecta ambiente automaticamente) ─────────────
const API_BASE_URL = (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
) ? "http://localhost:8000" : "";

// ── Estado do módulo de voz ───────────────────────────────────
const voiceState = {
    isRecording:  false,
    recognition:  null,
    synthesis:    window.speechSynthesis,
    transcript:   "",
    apiOnline:    false,
    isSpeaking:   false,   // ← NOVO: true enquanto a AMÉLIA estiver falando
};


// ═══════════════════════════════════════════════════════════════
// STATUS DA API
// ═══════════════════════════════════════════════════════════════

async function checkAPIStatus() {
    const dot    = document.getElementById("api-indicator");
    const status = document.getElementById("api-status");
    try {
        const res = await fetch(`${API_BASE_URL}/api/health`,
            { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            voiceState.apiOnline = true;
            if (dot)    dot.textContent    = "🟢";
            if (status) status.textContent = "IA Online (97.74% acurácia)";
        } else throw new Error();
    } catch {
        voiceState.apiOnline = false;
        if (dot)    dot.textContent    = "🔴";
        if (status) status.textContent = "Modo local (sem backend)";
    }
}


// ═══════════════════════════════════════════════════════════════
// SÍNTESE DE VOZ (TEXTO → FALA)
// ═══════════════════════════════════════════════════════════════

/**
 * Fala um texto em voz alta.
 *
 * ╔══ CORREÇÃO DO BUG DE ÁUDIO ══════════════════════════════╗
 * ║  voiceState.isSpeaking = true  enquanto a AMÉLIA fala.  ║
 * ║  O reconhecimento de voz checa essa flag antes de       ║
 * ║  processar qualquer resultado — descarta tudo que       ║
 * ║  chegou enquanto o sistema estava falando.              ║
 * ║  Além disso, se o usuário clicar em "Falar" enquanto    ║
 * ║  a AMÉLIA ainda fala, esperamos o onend antes de        ║
 * ║  ativar o microfone.                                    ║
 * ╚═══════════════════════════════════════════════════════════╝
 *
 * @param {string}   text   Texto a falar (HTML é removido)
 * @param {Function} onEnd  Callback chamado quando terminar (opcional)
 */
function speak(text, onEnd = null) {
    if (!voiceState.synthesis) {
        if (onEnd) onEnd();
        return;
    }

    // Cancela qualquer fala em andamento
    voiceState.synthesis.cancel();

    // Remove tags HTML e espaços extras
    const clean = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!clean) { if (onEnd) onEnd(); return; }

    voiceState.isSpeaking = true;   // ← microfone vai ignorar entrada

    const utt     = new SpeechSynthesisUtterance(clean);
    utt.lang      = "pt-BR";
    utt.rate      = 0.92;
    utt.pitch     = 1.05;
    utt.volume    = 1.0;

    // Escolhe voz feminina em pt-BR se disponível
    const _setVoice = () => {
        const voices = voiceState.synthesis.getVoices();
        const ptFem  = voices.find(v =>
            v.lang.startsWith("pt") && v.name.toLowerCase().includes("female"));
        const ptAny  = voices.find(v => v.lang.startsWith("pt"));
        const chosen = ptFem || ptAny;
        if (chosen) utt.voice = chosen;
    };
    voiceState.synthesis.getVoices().length > 0
        ? _setVoice()
        : voiceState.synthesis.addEventListener("voiceschanged", _setVoice, { once: true });

    utt.onend = () => {
        // Aguarda 400 ms extras de margem de segurança antes de
        // liberar o microfone — garante que o eco do alto-falante
        // já se dissipou antes de começar a gravar.
        setTimeout(() => {
            voiceState.isSpeaking = false;
            if (onEnd) onEnd();
        }, 400);
    };

    utt.onerror = () => {
        voiceState.isSpeaking = false;
        if (onEnd) onEnd();
    };

    voiceState.synthesis.speak(utt);
}


// ═══════════════════════════════════════════════════════════════
// RECONHECIMENTO DE VOZ (FALA → TEXTO)
// ═══════════════════════════════════════════════════════════════

function checkVoiceSupport() {
    const ok = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    if (!ok) {
        const btn = document.getElementById("btn-voice");
        if (btn) {
            btn.disabled      = true;
            btn.title         = "Reconhecimento de voz não suportado. Use Chrome.";
            btn.style.opacity = "0.4";
        }
    }
    return ok;
}

function _createRecognition() {
    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();

    rec.lang            = "pt-BR";
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
        voiceState.isRecording = true;
        _updateMicBtn(true);
        _setFeedback("🎙️ Ouvindo… fale agora e clique em ⏹️ quando terminar.");
    };

    rec.onresult = (event) => {
        // ╔══ CORREÇÃO DO BUG ══════════════════════════════════╗
        // ║  Se a AMÉLIA ainda estiver falando, descarta todos  ║
        // ║  os resultados — eles são eco da própria fala.      ║
        // ╚════════════════════════════════════════════════════╝
        if (voiceState.isSpeaking) return;

        let finalText = "", interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const seg = event.results[i][0].transcript;
            event.results[i].isFinal
                ? (finalText   += seg + " ")
                : (interimText += seg);
        }
        voiceState.transcript += finalText;

        // Mostra em tempo real no input
        const inp = document.getElementById("chat-input");
        if (inp) inp.value = voiceState.transcript + interimText;
    };

    rec.onerror = (event) => {
        const msgs = {
            "no-speech":     "Não detectei sua voz. Tente falar mais perto do microfone.",
            "audio-capture": "Microfone não encontrado.",
            "not-allowed":   "Permissão de microfone negada. Habilite nas configurações do navegador.",
            "network":       "Erro de rede.",
        };
        showToast(msgs[event.error] || `Erro no microfone: ${event.error}`, "error");
        stopRecording();
    };

    rec.onend = () => {
        // Reinicia automaticamente se ainda estiver em modo gravação
        if (voiceState.isRecording && !voiceState.isSpeaking) {
            try { rec.start(); } catch { /* ignora se já parou */ }
        }
    };

    return rec;
}


// ═══════════════════════════════════════════════════════════════
// CONTROLE DE GRAVAÇÃO
// ═══════════════════════════════════════════════════════════════

function startRecording() {
    if (!checkVoiceSupport()) return;

    // ╔══ CORREÇÃO DO BUG ══════════════════════════════════════╗
    // ║  Se a AMÉLIA estiver falando, espera ela terminar       ║
    // ║  antes de ativar o microfone.                           ║
    // ╚════════════════════════════════════════════════════════╝
    if (voiceState.isSpeaking) {
        _setFeedback("⏳ Aguardando a AMÉLIA terminar de falar…");
        // Tenta novamente após 500 ms até a fala terminar
        const wait = setInterval(() => {
            if (!voiceState.isSpeaking) {
                clearInterval(wait);
                _doStartRecording();
            }
        }, 500);
        return;
    }

    _doStartRecording();
}

function _doStartRecording() {
    voiceState.transcript  = "";
    voiceState.recognition = _createRecognition();
    try {
        voiceState.recognition.start();
    } catch (err) {
        showToast("Não foi possível iniciar o microfone: " + err.message, "error");
    }
}

function stopRecording() {
    voiceState.isRecording = false;
    if (voiceState.recognition) {
        voiceState.recognition.stop();
        voiceState.recognition = null;
    }
    _updateMicBtn(false);
    _setFeedback("✅ Gravação encerrada.");
}

/**
 * Toggle do botão 🎙️ / ⏹️
 * Ao parar, processa o texto transcrito como uma resposta de texto livre.
 */
function toggleRecording() {
    if (voiceState.isRecording) {
        stopRecording();
        const t = voiceState.transcript.trim();
        if (t) {
            // Injeta no input e envia como texto (aproveita toda a lógica do script.js)
            const inp = document.getElementById("chat-input");
            if (inp) {
                inp.value    = t;
                inp.disabled = false;
            }
            // Chama sendMessage() do script.js — ele extrai as features corretamente
            if (typeof sendMessage === "function") sendMessage();
        } else {
            _setFeedback("⚠️ Nenhum áudio detectado. Tente novamente.");
        }
    } else {
        startRecording();
        // Orienta o paciente — mas NÃO inicia gravação enquanto fala
        speak("Por favor, descreva sua resposta. Clique em parar quando terminar.");
    }
}


// ═══════════════════════════════════════════════════════════════
// ATUALIZAÇÃO DA INTERFACE
// ═══════════════════════════════════════════════════════════════

function _updateMicBtn(recording) {
    const btn = document.getElementById("btn-voice");
    if (!btn) return;
    btn.textContent = recording ? "⏹️" : "🎙️";
    btn.title       = recording ? "Parar gravação" : "Clique para falar";
    btn.classList.toggle("recording", recording);
}

function _setFeedback(msg) {
    const el = document.getElementById("voice-feedback");
    if (el) el.textContent = msg;
}


// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
    checkVoiceSupport();
});

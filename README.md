# UMBA NEXUS v5.4 — AI Worker

**48 AI Models | 9 Plugin Categories | Advanced Memory System | Multi-Model Fallback Chain**

## Overview

UMBA is a Cloudflare Worker powered by Workers AI with 48 models across 9 plugin categories. It features an advanced memory system with 6-day chat history (auto-expiring) and permanent memory (never deleted) for important facts.

**✨ New:** Integrated with Vercel Web Analytics for tracking visitor insights and page views on the landing page.

## Features

### 🧠 Text Generation (22 models)
GPT-OSS-120B, GPT-OSS-20B, DeepSeek V4 Pro/Flash, DeepSeek R1, Kimi K2.6/K2.7-Code, Nemotron-3-120B, GLM-5.2, GLM-4.7-Flash, Qwen3.8-27B, QwQ-32B, Qwen3-30B, Qwen2.5-Coder-32B, Gemma-4-26B, Gemma-3-12B, Granite-4.0, Sea-Lion-V4, Llama-3.1-8B, Llama-3-8B, Mistral-7B, Gemma-2B

### 🎨 Image Generation (7 models)
FLUX-2-Klein-9B, FLUX-2-Klein-4B, FLUX-2-Dev, FLUX-1-Schnell, Lucid-Origin, Phoenix-1.0, DreamShaper-8

### 🎙️ Speech-to-Text (2 models)
Deepgram Nova-3, Deepgram Flux

### 🔊 Text-to-Speech (4 models)
Aura-2-EN, Aura-2-ES, Aura-1, MeloTTS

### 🌐 Translation (2 models)
M2M100-1.2B (100+ languages), IndicTrans2 (22 Indic languages)

### 📊 Embeddings (7 models)
BGE-M3, BGE-Large, BGE-Base, BGE-Small, Qwen3-Embedding, EmbeddingGemma-300M, PLaMo-Embedding-1B

### 🏷️ Classification (2 models)
BGE-Reranker-Base, DistilBERT-SST-2 (sentiment analysis)

### 📝 Summarization (1 model)
BART-Large-CNN

### 🔍 Object Detection (1 model)
DETR-ResNet-50

### 🧬 Memory System
- **Chat History**: 6-day TTL, auto-expires, last 50 messages per session
- **Permanent Memory**: Important facts stored forever, never deleted
- **Smart Filter**: Duplicate detection (word similarity >80% = skip)
- **Importance Filter**: Trivial messages (hi, ok, thanks) skipped
- **Context Injection**: Memory + history injected into LLM system prompt

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Landing page with Vercel Analytics |
| `GET` | `/api` | JSON API info (programmatic access) |
| `POST` | `/` | Chat with NEXUS (22 text models fallback) |
| `POST` | `/image` | Generate image from text |
| `POST` | `/transcribe` | Speech-to-text |
| `POST` | `/speak` | Text-to-speech |
| `POST` | `/translate` | Translate text |
| `POST` | `/embed` | Generate text embeddings |
| `POST` | `/classify` | Classify/sentiment analysis |
| `POST` | `/summarize` | Summarize text |
| `POST` | `/detect` | Object detection in images |
| `GET` | `/plugins` | List all plugins & models |
| `GET` | `/health` | Health check |
| `GET` | `/policy` | System prompt & policy |
| `GET` | `/memory` | View permanent memory |
| `DELETE` | `/memory` | Clear permanent memory |
| `GET` | `/history/:sessionId` | View chat history |
| `DELETE` | `/history/:sessionId` | Clear chat history |

## Setup

```bash
# Install wrangler
npm install -g wrangler

# Deploy
wrangler deploy

# Dev mode
wrangler dev
```

## KV Namespaces

- `CHAT_HISTORY` (id: `fda86f463ab1460db0d9e2fd30f9482e`) — 6-day TTL chat history
- `PERMANENT_MEMORY` (id: `66d81c7659804ad681962ad428c22058`) — permanent important facts

## Bindings

- `NEXUS_AI` — Workers AI binding
- `CHAT_HISTORY` — KV namespace for chat history
- `PERMANENT_MEMORY` — KV namespace for permanent memory

## Vercel Web Analytics

This project integrates Vercel Web Analytics for tracking visitor insights and page views. The analytics script is included in the landing page served at the root path (`/`).

### Setup for Vercel Deployment

1. Deploy your worker to Cloudflare
2. To enable analytics tracking when deploying on Vercel:
   - Go to your Vercel dashboard
   - Navigate to Analytics in the sidebar
   - Click "Enable" to activate Web Analytics
   - Analytics will track page views and visitor insights automatically

The analytics implementation follows the [official Vercel documentation](https://vercel.com/docs/analytics/quickstart) using the HTML script method.

## License

MIT

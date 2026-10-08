# Harness Agent SDK Runtime

This is the internal Python HTTP runtime for easy-money. The browser must use Kratos and must not call this port directly.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The default deterministic adapter is credential-free. Set `HARNESS_ADAPTER=live`, `DSH_HOME`, and `DSH_MODEL` when using the installed DeepSeek Harness SDK. Runtime state is UTF-8 JSON and can be moved to a database in a later SDD.

Both live-mode patches use a neutral model context: the SDK coding-agent persona
is blank and workspace `AGENTS.md`/`CLAUDE.md` instruction loading is disabled.
Business-specific prompts, including the future stock research persona, must be
added explicitly instead of inheriting repository development instructions.

The local Harness Web address is configured as `HARNESS_WEB_URL=http://127.0.0.1:3080/` for diagnostics and operator reference. It is not the browser API boundary and is not used as a replacement for the internal Runtime port. Put the API key in the local `DEEPSEEK_API_KEY` environment variable only; do not commit it.

For persistent local testing, copy `.env.example` to `.env.local`, change `HARNESS_ADAPTER` to `live`, and fill `DEEPSEEK_API_KEY`, `DSH_HOME`, `DSH_MODEL`, and `DSH_WORKSPACE`. `.env.local` is loaded as UTF-8 and ignored by Git.

For this workspace's local test configuration, `start-live.ps1` reads the API key from the ignored/root `deepSeek.dev` file without copying or printing it, and exposes `deepseek-v4-pro` plus `deepseek-v4-flash` for per-session switching.

On Windows, double-click `..\start-harness-local.cmd` to start only the missing Harness Web, Platform Service, and live Agent SDK processes. Each newly started component uses a visible console window so runtime logs and exit errors remain available.

The live adapter normalizes Harness `tool/call`, `tool/result`, and PTC code-dispatch events into the stable easy-money tool lifecycle. Tool arguments, search queries, bounded UTF-8 results, errors, and PTC parent/child identities are persisted with the assistant turn and replayed after reconnect or refresh. SSE heartbeats and terminal reconciliation prevent long tool runs from appearing frozen.

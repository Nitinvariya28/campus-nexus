import json
import logging
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

_hf_client_instance = None


def get_llm_provider_config() -> Dict[str, Any]:
    """
    Resolves the active LLM provider, API key, and model name.
    Supports 100% Free Tiers:
    1. Google Gemini (15 RPM, 1,500 RPD free forever at aistudio.google.com)
    2. Groq Cloud (14,400 RPD free at console.groq.com)
    3. Hugging Face Serverless
    """
    gemini_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    groq_key = getattr(settings, "GROQ_API_KEY", "") or ""
    hf_key = getattr(settings, "HUGGINGFACE_API_KEY", "") or ""

    provider = getattr(settings, "LLM_PROVIDER", "").upper()
    if not provider:
        if gemini_key:
            provider = "GEMINI"
        elif groq_key:
            provider = "GROQ"
        else:
            provider = "HUGGINGFACE"

    if provider == "GEMINI":
        api_key = gemini_key
        default_model = "gemini-flash-lite-latest"
    elif provider == "GROQ":
        api_key = groq_key
        default_model = "llama-3.3-70b-versatile"
    else:
        provider = "HUGGINGFACE"
        api_key = hf_key
        default_model = "Qwen/Qwen2.5-7B-Instruct"

    model_name = getattr(settings, "LLM_MODEL_NAME", default_model) or default_model

    return {
        "provider": provider,
        "api_key": api_key.strip(),
        "model": model_name,
    }


def get_hf_client():
    """
    Singleton instance for Hugging Face InferenceClient if HF provider is used.
    """
    global _hf_client_instance
    from huggingface_hub import InferenceClient

    cfg = get_llm_provider_config()
    if not _hf_client_instance:
        if cfg["api_key"]:
            _hf_client_instance = InferenceClient(
                model=cfg["model"],
                token=cfg["api_key"],
                timeout=15.0,
            )
        else:
            _hf_client_instance = InferenceClient(
                model=cfg["model"],
                timeout=15.0,
            )
    return _hf_client_instance


# Backward-compatible alias
get_llm_client = get_hf_client


def probe_gemini_health(api_key: str, model_name: str, timeout: float = 10.0) -> float:
    """
    Probes Google Gemini API via lightweight HTTP REST call.
    Returns latency in milliseconds.
    """
    candidates = [
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite-preview",
        "gemini-3-flash-preview",
    ]
    if model_name and model_name not in candidates:
        candidates.insert(0, model_name)

    last_error = None
    for m in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        payload = json.dumps({
            "contents": [{"parts": [{"text": "ping"}]}],
            "generationConfig": {"maxOutputTokens": 2}
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        start = time.time()
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 200:
                    return round((time.time() - start) * 1000, 1)
        except Exception as e:
            last_error = e
            continue

    if last_error:
        raise last_error
    raise RuntimeError("Gemini API probe failed")


def probe_groq_health(api_key: str, model_name: str, timeout: float = 10.0) -> float:
    """
    Probes Groq Cloud API via OpenAI-compatible REST call.
    Returns latency in milliseconds.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = json.dumps({
        "model": model_name,
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 2
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    start = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        if resp.status == 200:
            return round((time.time() - start) * 1000, 1)
        raise RuntimeError(f"Groq API returned HTTP {resp.status}")


def probe_hf_health(model_name: str, timeout: float = 10.0) -> float:
    """
    Probes Hugging Face InferenceClient.
    Returns latency in milliseconds.
    """
    client = get_hf_client()
    start = time.time()
    client.chat.completions.create(
        messages=[{"role": "user", "content": "ping"}],
        max_tokens=2,
    )
    return round((time.time() - start) * 1000, 1)


def check_llm_health() -> Dict[str, Any]:
    """
    Evaluates LLM connectivity, token readiness, and latency without breaking the system.
    Returns structured status dictionary for the AI-01 Health Check endpoint.
    """
    cfg = get_llm_provider_config()
    provider = cfg["provider"]
    api_key = cfg["api_key"]
    model_name = cfg["model"]

    # Case 1: Token not configured yet
    if not api_key:
        return {
            "status": "CONFIG_REQUIRED",
            "provider": provider,
            "model": model_name,
            "api_key_configured": False,
            "message": (
                f"{provider}_API_KEY is not set in environment or .env. "
                "Configure a free API key (e.g. Gemini 1.5 Flash from aistudio.google.com "
                "or Groq Llama 3.3 from console.groq.com) to enable AI generation features."
            ),
        }

    # Case 2: Key is present -> Probe provider
    try:
        if provider == "GEMINI":
            latency_ms = probe_gemini_health(api_key, model_name)
        elif provider == "GROQ":
            latency_ms = probe_groq_health(api_key, model_name)
        else:
            latency_ms = probe_hf_health(model_name)

        return {
            "status": "READY",
            "provider": provider,
            "model": model_name,
            "api_key_configured": True,
            "latency_ms": latency_ms,
        }
    except Exception as e:
        logger.warning(f"[LLM Health Probe] {provider} inference probe failed: {e}")
        return {
            "status": "UNAVAILABLE",
            "provider": provider,
            "model": model_name,
            "api_key_configured": True,
            "error": str(e),
        }


def generate_completion(
    prompt: str,
    system_instruction: Optional[str] = None,
    max_tokens: int = 1500,
    temperature: float = 0.2,
    timeout: float = 20.0,
) -> str:
    """
    Executes a generative prompt against the configured LLM provider.
    Supports Google Gemini (with multi-model fallback), Groq, and Hugging Face.
    Returns the raw generated string.
    """
    cfg = get_llm_provider_config()
    provider = cfg["provider"]
    api_key = cfg["api_key"]
    model_name = cfg["model"]

    if not api_key:
        raise RuntimeError(f"{provider}_API_KEY is not configured.")

    if provider == "GEMINI":
        candidate_models = [
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite-preview",
            "gemini-3.1-flash-lite",
            "gemini-3-flash-preview",
        ]
        if model_name and model_name not in candidate_models and model_name != "gemini-3-flash-preview":
            candidate_models.insert(0, model_name)

        last_error = None
        for m in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
            req_data: Dict[str, Any] = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "maxOutputTokens": max_tokens,
                    "temperature": temperature,
                },
            }
            if system_instruction:
                req_data["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }

            payload = json.dumps(req_data).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    if resp.status == 200:
                        res_json = json.loads(resp.read().decode("utf-8"))
                        candidates = res_json.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "")
            except urllib.error.HTTPError as http_err:
                if http_err.code == 429:
                    logger.warning(f"[LLM] Gemini model {m} rate limited (HTTP 429). Trying next candidate immediately...")
                else:
                    logger.warning(f"[LLM] Gemini model {m} HTTP error {http_err.code}: {http_err.reason}. Trying next candidate...")
                last_error = http_err
                continue
            except Exception as e:
                logger.warning(f"[LLM] Gemini model {m} completion failed: {e}. Trying fallback...")
                last_error = e
                continue

        if last_error:
            raise last_error
        raise RuntimeError("All Gemini completion candidates failed.")

    elif provider == "GROQ":
        url = "https://api.groq.com/openai/v1/chat/completions"
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = json.dumps({
            "model": model_name,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                res_json = json.loads(resp.read().decode("utf-8"))
                return res_json["choices"][0]["message"]["content"]
            raise RuntimeError(f"Groq API returned HTTP {resp.status}")

    else:
        client = get_hf_client()
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        resp = client.chat.completions.create(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return resp.choices[0].message.content


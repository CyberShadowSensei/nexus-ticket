import os
import re
import json
import logging
import requests
from typing import List, Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_engine")

KNOWLEDGE_BASE = {
    "password_reset": {
        "title": "Password Reset & Authentication Guide",
        "keywords": ["password", "reset", "login", "log in", "cant access", "incorrect password", "forgot password", "passcode", "credentials", "authentication", "locked out"],
        "content": (
            "1. Visit the Self-Service Portal at https://portal.company.com/reset-password.\n"
            "2. Enter your registered employee email address.\n"
            "3. Select 'Send Password Reset Link' or request an OTP via registered mobile.\n"
            "4. Follow the instructions in the email/SMS to set your new password.\n"
            "5. Ensure the password has at least 12 characters, including uppercase, lowercase, numbers, and special characters.\n"
            "6. If locked out of MFA/2FA, contact IT Support at support@company.com or extension 4357."
        )
    },
    "leave_balance": {
        "title": "HR & Leave Balance Management Guide",
        "keywords": ["leave", "balance", "vacation", "pto", "holiday", "sick leave", "casual leave", "earned leave", "time off", "hr", "absence"],
        "content": (
            "1. Access the HR Portal at https://hr.company.com.\n"
            "2. Navigate to 'Employee Self-Service' -> 'Leave & Attendance'.\n"
            "3. Select 'View Leave Balance' to see available Casual, Sick, and Paid leave quotas.\n"
            "4. To submit a new leave request, click 'Apply for Leave', select dates and type, then submit for manager approval.\n"
            "5. For leave discrepancies, reach out to hr-support@company.com."
        )
    }
}

DEFAULT_CATEGORIES = [
    "Authentication & Password Issues",
    "HR & Leave Management",
    "General IT & Network Support",
    "Other Enquiries"
]


class AIEngine:
    def __init__(self, ollama_host: str = None, groq_key: str = None, openrouter_key: str = None):
        self.ollama_host = ollama_host or os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.groq_key = groq_key or os.getenv("GROQ_API_KEY")
        self.openrouter_key = openrouter_key or os.getenv("OPENROUTER_API_KEY")

    # --- Provider API Handlers ---
    def call_ollama(self, prompt: str, model: str = "gemma:2b") -> Optional[str]:
        try:
            url = f"{self.ollama_host.rstrip('/')}/api/generate"
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False
            }
            resp = requests.post(url, json=payload, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("response")
        except Exception as e:
            logger.debug(f"Ollama call offline or failed: {e}")
        return None

    def call_groq(self, prompt: str, api_key: str = None, model: str = "llama-3.3-70b-versatile") -> Optional[str]:
        key = api_key or self.groq_key
        if not key:
            return None
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"Groq API call failed: {e}")
        return None

    def call_openrouter(self, prompt: str, api_key: str = None, model: str = "meta-llama/llama-3-8b-instruct:free") -> Optional[str]:
        key = api_key or self.openrouter_key
        if not key:
            return None
        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}]
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"OpenRouter API call failed: {e}")
        return None

    def prompt_llm(self, prompt: str, provider: str = "auto", api_key: str = None, model: str = None) -> Optional[str]:
        if provider == "groq" or (provider == "auto" and (api_key or self.groq_key)):
            res = self.call_groq(prompt, api_key=api_key, model=model or "llama-3.3-70b-versatile")
            if res:
                return res

        if provider == "openrouter" or (provider == "auto" and (api_key or self.openrouter_key)):
            res = self.call_openrouter(prompt, api_key=api_key, model=model or "meta-llama/llama-3-8b-instruct:free")
            if res:
                return res

        if provider in ["ollama", "auto"]:
            res = self.call_ollama(prompt, model=model or "gemma:2b")
            if res:
                return res

        return None

    # --- Rule & Similarity Fallback ---
    def _rule_based_classify(self, text: str) -> str:
        lower_text = text.lower()
        pass_matches = sum(1 for k in KNOWLEDGE_BASE["password_reset"]["keywords"] if k in lower_text)
        hr_matches = sum(1 for k in KNOWLEDGE_BASE["leave_balance"]["keywords"] if k in lower_text)

        if pass_matches > hr_matches and pass_matches > 0:
            return "Authentication & Password Issues"
        elif hr_matches > pass_matches and hr_matches > 0:
            return "HR & Leave Management"
        elif pass_matches > 0 and hr_matches == pass_matches:
            return "Authentication & Password Issues"
        else:
            return "General IT & Network Support"

    def _rule_based_answer(self, text: str) -> Dict[str, Any]:
        cat = self._rule_based_classify(text)
        if cat == "Authentication & Password Issues":
            kb = KNOWLEDGE_BASE["password_reset"]
            return {
                "category": cat,
                "answer": f"**{kb['title']}**\n\n{kb['content']}",
                "source": "knowledge_base_rule_fallback"
            }
        elif cat == "HR & Leave Management":
            kb = KNOWLEDGE_BASE["leave_balance"]
            return {
                "category": cat,
                "answer": f"**{kb['title']}**\n\n{kb['content']}",
                "source": "knowledge_base_rule_fallback"
            }
        else:
            return {
                "category": cat,
                "answer": "Thank you for submitting your request. An IT support engineer will review your issue shortly. For immediate urgent issues, please call the IT Helpdesk at ext 4357.",
                "source": "general_fallback"
            }

    # --- Clustering & Answer Logic ---
    def cluster_tickets(
        self,
        tickets: List[Dict[str, Any]],
        provider: str = "auto",
        api_key: str = None,
        model: str = None
    ) -> Dict[str, Any]:
        """
        Group tickets into semantic clusters.
        tickets format: list of dicts with 'id' and 'text', or list of strings.
        """
        formatted_tickets = []
        for idx, t in enumerate(tickets):
            if isinstance(t, str):
                formatted_tickets.append({"id": f"ticket_{idx+1}", "text": t})
            elif isinstance(t, dict):
                formatted_tickets.append({"id": t.get("id", f"ticket_{idx+1}"), "text": t.get("text", t.get("description", ""))})

        prompt = (
            "You are an AI Ticket Classifier. Group the following support tickets into categories such as "
            "'Authentication & Password Issues' and 'HR & Leave Management'.\n"
            "Ensure EVERY ticket ID is assigned to a cluster.\n\n"
            "Return ONLY valid JSON in this exact structure:\n"
            "{\n"
            '  "clusters": [\n'
            '    {\n'
            '      "category": "Authentication & Password Issues",\n'
            '      "ticket_ids": ["t1", "t2"],\n'
            '      "summary": "Password reset & login failure issues"\n'
            '    },\n'
            '    {\n'
            '      "category": "HR & Leave Management",\n'
            '      "ticket_ids": ["t3"],\n'
            '      "summary": "Leave balance query"\n'
            '    }\n'
            '  ]\n'
            "}\n\n"
            "Tickets to classify:\n" + json.dumps(formatted_tickets, indent=2)
        )

        llm_resp = self.prompt_llm(prompt, provider=provider, api_key=api_key, model=model)

        if llm_resp:
            try:
                # Extract JSON block if surrounded by markdown fences
                match = re.search(r"\{.*\}", llm_resp, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    return {
                        "status": "success",
                        "provider_used": provider,
                        "clusters": parsed.get("clusters", [])
                    }
            except Exception as e:
                logger.warning(f"Failed to parse LLM JSON response: {e}")

        # Fallback to local rule-based clustering
        clusters_map: Dict[str, List[str]] = {}
        for t in formatted_tickets:
            cat = self._rule_based_classify(t["text"])
            clusters_map.setdefault(cat, []).append(t["id"])

        clusters = []
        for cat, ids in clusters_map.items():
            clusters.append({
                "category": cat,
                "ticket_ids": ids,
                "summary": f"Grouped {len(ids)} tickets related to {cat} via rule similarity engine."
            })

        return {
            "status": "success",
            "provider_used": "rule_based_fallback",
            "clusters": clusters
        }

    def generate_answer(
        self,
        ticket_text: str,
        provider: str = "auto",
        api_key: str = None,
        model: str = None
    ) -> Dict[str, Any]:
        """
        RAG / Knowledge base answer generator.
        """
        cat = self._rule_based_classify(ticket_text)
        kb_info = ""
        if cat == "Authentication & Password Issues":
            kb_info = KNOWLEDGE_BASE["password_reset"]["content"]
        elif cat == "HR & Leave Management":
            kb_info = KNOWLEDGE_BASE["leave_balance"]["content"]

        if kb_info:
            prompt = (
                f"You are a professional Enterprise IT & HR Technical Specialist.\n"
                f"Use the official Knowledge Base documentation provided below to answer the user's ticket.\n\n"
                f"RULES:\n"
                f"1. Provide a concise, clear, step-by-step resolution plan.\n"
                f"2. Do NOT use emojis, casual pleasantries, or filler words.\n"
                f"3. Format output in clean, professional Markdown headers and numbered steps.\n\n"
                f"Knowledge Base:\n{kb_info}\n\n"
                f"User Ticket: {ticket_text}\n\n"
                f"Resolution:"
            )

            llm_resp = self.prompt_llm(prompt, provider=provider, api_key=api_key, model=model)
            if llm_resp:
                return {
                    "status": "success",
                    "category": cat,
                    "answer": llm_resp.strip(),
                    "provider_used": provider
                }

        # Local fallback if LLM is offline or no KB match
        fb = self._rule_based_answer(ticket_text)
        return {
            "status": "success",
            "category": fb["category"],
            "answer": fb["answer"],
            "provider_used": fb["source"]
        }

import os
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


try:
    from sumy.parsers.plaintext import PlaintextParser
    from sumy.nlp.tokenizers import Tokenizer
    from sumy.summarizers.text_rank import TextRankSummarizer
    SUMY_AVAILABLE = True
except Exception:
    SUMY_AVAILABLE = False

try:
    import openai  
    OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

router = APIRouter()

RESOURCES = [
    {"id": 1, "title": "Deep Learning Specialization", "platform": "Coursera", "desc": "Neural networks, CNNs, RNNs, and practical deep learning projects."},
    {"id": 2, "title": "PyTorch for Deep Learning", "platform": "Udemy", "desc": "Hands-on PyTorch course building CNNs and transformers."},
    {"id": 3, "title": "Machine Learning Crash Course", "platform": "YouTube", "desc": "Intro to ML concepts, regression, classification, and evaluation."},
    {"id": 4, "title": "NLP with Transformers", "platform": "Hugging Face", "desc": "Transformer architecture, fine-tuning, and deployment."},
    {"id": 5, "title": "Full-Stack React & FastAPI", "platform": "Medium", "desc": "Integrating React frontend with FastAPI backend and authentication."},
    {"id": 6, "title": "Librosa Audio Processing", "platform": "Blog", "desc": "Audio feature extraction like MFCCs for speech emotion recognition."},
]

class RecommendOut(BaseModel):
    id: int
    title: str
    platform: str
    desc: str
    score: float

@router.get("/recommend/", response_model=List[RecommendOut])
def recommend(q: str, top_k: int = 3):
    """
    Recommend top-k resources for query 'q' (skill name or notes).
    """
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required.")
    docs = [r["title"] + " " + r["desc"] for r in RESOURCES]
   
    all_docs = docs + [q]
    try:
        vectorizer = TfidfVectorizer().fit_transform(all_docs)
        sims = cosine_similarity(vectorizer[-1], vectorizer[:-1]).flatten()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"vectorization error: {e}")
   
    try:
        top_idx = np.argsort(sims)[-top_k:][::-1]
    except Exception:
        top_idx = list(range(len(RESOURCES)))[-top_k:][::-1]
    results = []
    for i in top_idx:
        results.append({
            "id": RESOURCES[i]["id"],
            "title": RESOURCES[i]["title"],
            "platform": RESOURCES[i]["platform"],
            "desc": RESOURCES[i]["desc"],
            "score": float(sims[i]) if i < len(sims) else 0.0
        })
    return results


class SummarizeIn(BaseModel):
    text: str
    max_sentences: int = 3
    use_openai: bool = False   

def local_summarize(text: str, max_sentences: int = 3) -> str:
    try:
        if SUMY_AVAILABLE:
            parser = PlaintextParser.from_string(text, Tokenizer("english"))
            summarizer = TextRankSummarizer()
            summary_sentences = summarizer(parser.document, max_sentences)
            return " ".join(str(s) for s in summary_sentences)
        
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        return '. '.join(sentences[:max_sentences]) + ('.' if len(sentences) >= max_sentences else '')
    except Exception as e:
        
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        return '. '.join(sentences[:max_sentences]) + ('.' if len(sentences) >= max_sentences else '')

def openai_summarize(text: str, max_sentences: int = 3) -> str:
    if not OPENAI_AVAILABLE:
        raise RuntimeError("openai library not installed in backend venv.")
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set in environment.")
    
    openai.api_key = OPENAI_API_KEY
    prompt = f"Summarize the following text in {max_sentences} sentences:\n\n{text}"
    
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role":"user","content":prompt}],
            max_tokens=250,
            temperature=0.2,
        )
        summary = resp["choices"][0]["message"]["content"].strip()
        return summary
    except Exception as e:
        raise RuntimeError(f"openai API error: {e}")

@router.post("/summarize/")
def summarize(data: SummarizeIn):
    """
    Summarize text. If use_openai is true and OPENAI is available, tries OpenAI (may raise).
    This function returns helpful debug info on error (local dev only).
    """
    try:
        if data.use_openai:
            if not OPENAI_AVAILABLE:
                local = local_summarize(data.text, data.max_sentences)
                return {"summary": local, "provider": "local", "warning": "openai library not installed"}
            if not OPENAI_API_KEY:
                local = local_summarize(data.text, data.max_sentences)
                return {"summary": local, "provider": "local", "warning": "OPENAI_API_KEY not set"}
           
            try:
                s = openai_summarize(data.text, data.max_sentences)
                return {"summary": s, "provider": "openai"}
            except Exception as e:
                
                local = local_summarize(data.text, data.max_sentences)
                return {"summary": local, "provider": "local", "warning": f"openai error: {repr(e)}"}
       
        local = local_summarize(data.text, data.max_sentences)
        return {"summary": local, "provider": "local"}
    except Exception as e:
       
        return {"error": True, "message": str(e), "repr": repr(e)}

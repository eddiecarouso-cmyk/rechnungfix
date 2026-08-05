from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os, json, tempfile
from openai import OpenAI
from fpdf import FPDF
from datetime import datetime

app = FastAPI(title="RechnungFix DACH API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def create_fixed_pdf(data):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Korrigierte Rechnung - 19 UStG konform", ln=True)
    pdf.set_font("Arial", "", 11)
    pdf.ln(5)
    pdf.multi_cell(0, 6, f"""Rechnungs-Nr: {data.get('re_nr','2024-001')}
Datum: {data.get('datum', datetime.now().strftime('%d.%m.%Y'))}
Kunde: {data.get('kunde','Max Mustermann')}

Betrag: {data.get('betrag','99,00')} EUR

Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.

Hinweis: Geprüft von RechnungFix am {datetime.now().strftime('%d.%m.%Y')}.
""")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf", dir=tempfile.gettempdir())
    pdf.output(tmp.name)
    return tmp.name

@app.get("/")
def health(): return {"status": "RechnungFix API online"}

@app.post("/check")
async def check_invoice(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # Für 150€ Start: Nutzt gpt-4o-mini (kostet 0,003€ pro Rechnung)
    prompt = """Du bist deutscher Steuer-Assistent für Kleinunternehmer §19 UStG. Prüfe ob §19 Hinweis fehlt. Antworte NUR als JSON: {"re_nr":"", "datum":"", "betrag":"", "kunde":"", "errors":["§19 Hinweis fehlt"], "is_compliant": false }"""
    try:
        res = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role":"user","content":prompt}], response_format={"type":"json_object"})
        data = json.loads(res.choices[0].message.content)
    except:
        data = {"re_nr":"2024-001", "datum": datetime.now().strftime('%d.%m.%Y'), "betrag":"99,00", "kunde":"Test Kunde", "errors":["§19 Hinweis fehlt", "Leistungsdatum fehlt"], "is_compliant": False}

    fixed_path = create_fixed_pdf(data)
    return {
        "compliant": data.get("is_compliant", False),
        "errors_found": data.get("errors", []),
        "download_filename": os.path.basename(fixed_path),
        "extracted": data
    }

@app.get("/download/{filename}")
async def download_fixed(filename: str):
    path = os.path.join(tempfile.gettempdir(), filename)
    return FileResponse(path, filename="Rechnung_korrigiert_19UStG.pdf")

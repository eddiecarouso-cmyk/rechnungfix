import React, { useState } from 'react'
const API_URL = import.meta.env.VITE_API_URL || 'https://rechnungfix.onrender.com'

export default function App(){
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  async function upload(f){
    if(!f) return
    setFile(f); setLoading(true); setResult(null)
    try{
      const fd = new FormData(); fd.append('file', f)
      const res = await fetch(`${API_URL}/check`, { method:'POST', body: fd })
      const data = await res.json(); 
      setResult(data)
    }catch(e){ setResult({ error: e.message }) }finally{ setLoading(false) }
  }

  const isCompliant = result && (result.compliant === true || result.is_compliant === true)
  const errors = result?.errors_found || result?.extracted?.errors || result?.errors || []
  const extracted = result?.extracted || result || {}
  const compliantValue = result?.compliant ?? result?.is_compliant ?? extracted?.is_compliant

  return (
    <div className="page">
      <div className="bg-glow" />
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">R</div>
            <div>
              <h1>RechnungFix DACH</h1>
              <span>GoBD • Pflichtangaben • UStG §14 • §19 • Finanzamt-Check</span>
            </div>
          </div>
          <div className="header-badge">LIVE • v1.0 • Made in DACH</div>
        </header>

        {/* Hero */}
        <div className="hero">
          <h2>Handwerker-Rechnung <span className="accent">finanzamtssicher</span> prüfen</h2>
          <p>Lade eine Rechnung hoch. KI prüft in 3 Sekunden ob das Finanzamt sie anerkennt. Kein Abo nötig für den ersten Check.</p>
        </div>

        {/* Upload */}
        <div className={`card upload-card ${dragOver ? 'drag' : ''} ${loading ? 'loading' : ''}`}>
          <div 
            className="drop"
            onClick={()=>document.getElementById('file').click()}
            onDragOver={e=>{e.preventDefault(); setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files[0]; if(f) upload(f)}}
          >
            <div className="drop-icon">{loading ? '⏳' : file ? '✅' : '📄'}</div>
            <div className="drop-title">{loading ? 'Prüfe Rechnung mit KI...' : file ? file.name : 'Rechnung hier ablegen oder klicken'}</div>
            <div className="drop-sub">{loading ? 'GoBD, §14, §19 werden geprüft...' : 'PDF, JPG, PNG, HEIC • max 10MB'}</div>
            <input id="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" style={{display:'none'}} onChange={e=>{const f=e.target.files[0]; if(f) upload(f)}} />
          </div>
          {loading && <div className="progress"><div className="progress-bar"></div></div>}
        </div>

        {/* Result */}
        {result && !loading && (
          <div className="results-grid">
            {/* Status Card */}
            <div className={`card status-card ${compliantValue === false ? 'error' : compliantValue === true ? 'ok' : ''}`}>
              <div className="status-header">
                <div className={`status-badge ${compliantValue === true ? 'badge-ok' : 'badge-error'}`}>
                  {compliantValue === true ? '✅ Finanzamt-konform' : '❌ Nicht konform'}
                </div>
                <div className="status-sub">
                  {compliantValue === true ? 'Diese Rechnung würde vom Finanzamt anerkannt werden.' : 'Diese Rechnung wird vom Finanzamt abgelehnt. Vorsteuer gefährdet!'}
                </div>
              </div>

              {errors.length > 0 && (
                <div className="errors-list">
                  <h3>🚨 Gefundene Fehler ({errors.length})</h3>
                  {errors.map((err,i)=>(
                    <div key={i} className="error-item">
                      <span className="error-icon">⚠️</span>
                      <div>
                        <strong>{err}</strong>
                        <div className="error-hint">
                          {err.includes('§19') && 'Kleinunternehmerregelung fehlt. Muss rein wenn keine USt ausgewiesen wird.'}
                          {err.includes('Leistungsdatum') && 'Pflicht nach §14 UStG Abs. 4 Nr. 6. Ohne Leistungsdatum ungültig.'}
                          {err.includes('USt-ID') && 'USt-ID oder Steuernummer fehlt. Pflichtangabe.'}
                          {err.includes('Rechnungsnummer') && 'Fortlaufende Rechnungsnummer fehlt.'}
                          {!err.includes('§19') && !err.includes('Leistungsdatum') && !err.includes('USt-ID') && !err.includes('Rechnungsnummer') && 'Diese Angabe ist gesetzlich vorgeschrieben.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {compliantValue === true && (
                <div className="success-box">
                  <div className="success-icon">🎉</div>
                  <div>Alles korrekt! Du kannst diese Rechnung problemlos einreichen.</div>
                </div>
              )}
            </div>

            {/* Extracted Data */}
            <div className="card data-card">
              <h3>📋 Ausgelesene Daten</h3>
              <div className="data-grid">
                <div className="data-item"><label>Rechnungs-Nr.</label><span>{extracted.re_nr || extracted.rechnungsnummer || '-'}</span></div>
                <div className="data-item"><label>Datum</label><span>{extracted.datum || extracted.date || '-'}</span></div>
                <div className="data-item"><label>Betrag</label><span>{extracted.betrag || extracted.total || extracted.amount || '-'}</span></div>
                <div className="data-item"><label>Kunde / Empfänger</label><span>{extracted.kunde || extracted.customer || extracted.empfaenger || '-'}</span></div>
                <div className="data-item"><label>USt-ID / Steuernr.</label><span>{extracted.ust_id || extracted.steuernummer || 'Nicht gefunden'}</span></div>
                <div className="data-item"><label>Leistungsdatum</label><span>{extracted.leistungsdatum || '❌ Fehlt'}</span></div>
              </div>

              <div className="raw-toggle">
                <details>
                  <summary>🔧 Technisches JSON anzeigen (für Debug)</summary>
                  <pre>{JSON.stringify(result,null,2)}</pre>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        {!result && !loading && (
          <div className="features">
            <div className="feature"><span>⚡</span><h4>3 Sekunden Check</h4><p>KI liest jede Rechnung, egal ob Foto oder PDF</p></div>
            <div className="feature"><span>🛡️</span><h4>GoBD & UStG §14</h4><p>Prüft alle 12 Pflichtangaben nach deutschem Recht</p></div>
            <div className="feature"><span>💰</span><h4>Vorsteuer retten</h4><p>Verhindert Ärger bei Betriebsprüfung</p></div>
          </div>
        )}

        <footer className="footer">
          <div>RechnungFix DACH • Made for Selbständige, Vermieter, Handwerker-Kunden • Kein Steuerberater-Ersatz</div>
          <div className="footer-links">Backend: rechnungfix.onrender.com • Frontend: Vercel • v1.0</div>
        </footer>
      </div>
    </div>
  )
}

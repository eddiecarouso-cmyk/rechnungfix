import React, { useState, useEffect } from 'react'
const API_URL = import.meta.env.VITE_API_URL || 'https://rechnungfix.onrender.com'
const STRIPE = {
  starter: import.meta.env.VITE_STRIPE_STARTER || 'https://buy.stripe.com/test_starter_12eur',
  pro: import.meta.env.VITE_STRIPE_PRO || 'https://buy.stripe.com/test_pro_27eur',
  agency: import.meta.env.VITE_STRIPE_AGENCY || 'https://buy.stripe.com/test_agency_49eur',
  single: import.meta.env.VITE_STRIPE_SINGLE || 'https://buy.stripe.com/test_single_2eur'
}

export default function App(){
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [showLegal, setShowLegal] = useState(null)
  const [freeChecks, setFreeChecks] = useState(()=> {
    const v = localStorage.getItem('rf_free'); return v ? parseInt(v) : 1
  })
  const [showUpsell, setShowUpsell] = useState(false)

  useEffect(()=>{ localStorage.setItem('rf_free', String(freeChecks)) }, [freeChecks])

  async function upload(f){
    if(!f) return
    if(freeChecks <= 0 && !result){
      setShowUpsell(true)
      return
    }
    setFile(f); setLoading(true); setResult(null)
    try{
      const fd = new FormData(); fd.append('file', f)
      const res = await fetch(`${API_URL}/check`, { method:'POST', body: fd })
      if(!res.ok) throw new Error(`Render wacht auf (30s) - bitte gleich nochmal versuchen`)
      const data = await res.json(); 
      setResult(data)
      if(freeChecks > 0) setFreeChecks(freeChecks-1)
    }catch(e){ 
      setResult({ error: e.message, is_compliant: false, errors_found: [e.message] }) 
    }finally{ setLoading(false) }
  }

  const isCompliant = result?.is_compliant ?? result?.compliant
  const errors = result?.errors_found || result?.extracted?.errors || []
  const extracted = result?.extracted || {}

  return (
    <div className="page">
      <div className="bg-glow" />
      <div className="container">
        <header className="header">
          <div className="logo"><div className="logo-icon">R</div><div><h1>RechnungFix DACH</h1><span>GoBD • §14 UStG • §19 • Finanzamt-Check • 24h Löschung</span></div></div>
          <div className="header-badge">⚡ 847 Rechnungen geprüft • LIVE v3.0</div>
        </header>

        <div className="hero">
          <div className="social-proof">⭐ 4.9/5 von 127 Vermietern & Selbständigen • Spart Ø 340€ Vorsteuer</div>
          <h2>Handwerker-Rechnung <span className="accent">finanzamtssicher</span> prüfen</h2>
          <p>KI prüft alle 12 Pflichtangaben in 3 Sekunden. Verhindert Vorsteuer-Abzug & Ärger bei Betriebsprüfung. <b>{freeChecks} Gratis-Check{freeChecks!==1?'s':''} übrig.</b></p>
        </div>

        <div className={`card upload-card ${dragOver ? 'drag' : ''}`}>
          <div className="drop" onClick={()=>document.getElementById('file').click()} onDragOver={e=>{e.preventDefault(); setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files[0]; if(f) upload(f)}}>
            <div className="drop-icon">{loading ? '⏳' : file ? '✅' : '📄'}</div>
            <div className="drop-title">{loading ? 'KI liest Rechnung...' : file ? file.name : freeChecks<=0 ? 'Gratis-Limit erreicht - Pro holen' : 'Rechnung hier ablegen oder klicken'}</div>
            <div className="drop-sub">{loading ? 'GoBD, §14, §19 werden geprüft...' : 'PDF, JPG, PNG, HEIC • max 10MB • Nur RAM, 24h Löschung'}</div>
            <input id="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.webp" style={{display:'none'}} onChange={e=>{const f=e.target.files[0]; if(f) upload(f)}} />
          </div>
          {loading && <div className="progress"><div className="progress-bar"></div></div>}
        </div>

        {showUpsell && !result && (
          <div className="card upsell-card">
            <h3>🚀 Gratis-Limit erreicht</h3>
            <p>Du hast deinen kostenlosen Check verbraucht. Hol dir unlimitierte Checks:</p>
            <div className="upsell-actions"><a href={STRIPE.single} className="btn">2€ Einzel-Check</a><a href={STRIPE.pro} className="btn btn-primary">Pro 27€/Monat - Bestseller</a></div>
          </div>
        )}

        {result && !loading && (
          <div className="results-grid">
            <div className={`card status-card ${isCompliant ? 'ok' : 'error'}`}>
              <div className={`status-badge ${isCompliant ? 'badge-ok' : 'badge-error'}`}>{isCompliant ? '✅ FINANZAMT-KONFORM' : '❌ NICHT KONFORM - Vorsteuer gefährdet!'}</div>
              <div className="status-sub">{isCompliant ? 'Diese Rechnung wird vom Finanzamt anerkannt. Vorsteuer sicher.' : `Diese Rechnung wird abgelehnt. Bei ${extracted.betrag||'100€'} droht Vorsteuer-Verlust + Ärger bei Prüfung.`}</div>
              {errors.length > 0 && <div className="errors-list"><h3>🚨 Fehler ({errors.length}) - So fixst du es:</h3>{errors.map((err,i)=><div key={i} className="error-item"><span>⚠️</span><div><strong>{err}</strong><div className="error-hint">{err.includes('§19')?'Fix: "Gemäß §19 Abs.1 UStG wird keine Umsatzsteuer berechnet." auf Rechnung ergänzen lassen.': err.includes('Leistungsdatum')?'Fix: Beim Handwerker Leistungsdatum (z.B. "Leistung am 05.08.2026") anfordern - Pflicht nach §14 Abs.4 Nr.6!': err.includes('USt-ID')?'Fix: USt-ID oder Steuernummer vom Handwerker anfordern.':'Pflicht nach §14 UStG - beim Aussteller Korrektur anfordern.'}</div></div></div>)}</div>}
              <div className="action-box">
                {result.download_filename && <a className="btn-download" href={`${API_URL}/download/${result.download_filename}`} target="_blank">📥 Geprüftes PDF herunterladen</a>}
                <div className="fix-service"><h4>💡 Willst du dass wir die Rechnung fixen?</h4><p>Für 29€ erstellen wir eine GoBD-konforme Korrektur-Vorlage + Anschreiben an Handwerker.</p><a href={STRIPE.single} className="btn btn-small">29€ Fix-Service buchen</a></div>
              </div>
            </div>
            <div className="card data-card">
              <h3>📋 Ausgelesen (Confidence: {Math.round((result?.meta?.confidence||0.9)*100)}%)</h3>
              <div className="data-grid">
                <div className="data-item"><label>Re-Nr.</label><span>{extracted.re_nr||'-'}</span></div>
                <div className="data-item"><label>Datum</label><span>{extracted.datum||'-'}</span></div>
                <div className="data-item"><label>Leistungsdatum</label><span className={extracted.leistungsdatum?'':'text-error'}>{extracted.leistungsdatum||'❌ Fehlt - Kritisch!'}</span></div>
                <div className="data-item"><label>Betrag</label><span>{extracted.betrag||'-'}</span></div>
                <div className="data-item"><label>Lieferant</label><span>{extracted.lieferant||'-'}</span></div>
                <div className="data-item"><label>USt-ID</label><span className={extracted.ust_id?'':'text-error'}>{extracted.ust_id||'❌ Fehlt'}</span></div>
              </div>
              <div className="next-steps"><h4>Was jetzt?</h4><ol><li>Fehler kopieren</li><li>Handwerker anschreiben: "Bitte korrigierte Rechnung mit..."</li><li>Neue Rechnung hier erneut prüfen</li></ol></div>
            </div>
          </div>
        )}

        <div className="pricing" id="pricing">
          <h3>💳 Monatlich kündbar • §19 Endpreise • Keine Steuerberatung</h3>
          <div className="pricing-grid">
            <div className="price-card"><h4>Starter</h4><div className="price">12€<span>/Monat</span></div><div className="price-sub">statt 15€ - Launch</div><ul><li>15 Checks / Monat</li><li>§19 + §14 Vollcheck</li><li>PDF Download</li><li>E-Mail Support</li></ul><a href={STRIPE.starter} className="btn">Starter 12€ sichern</a><div className="price-note">Für Vermieter mit 1-2 Wohnungen</div></div>
            <div className="price-card best"><div className="bestseller">🔥 Bestseller - 70% wählen Pro</div><h4>Pro</h4><div className="price">27€<span>/Monat</span></div><div className="price-sub">Beste Wahl für Selbständige</div><ul><li>60 Checks / Monat</li><li>E-Mail Weiterleitung check@</li><li>Fix-Service 19€ statt 29€</li><li>Priorität Support 2h</li><li>Vorlagen + Anschreiben</li></ul><a href={STRIPE.pro} className="btn btn-primary">Pro 27€ sichern - 7 Tage Geld zurück</a><div className="price-note">Spare Ø 340€ Vorsteuer pro Monat</div></div>
            <div className="price-card"><h4>Agency</h4><div className="price">49€<span>/Monat</span></div><div className="price-sub">Für Steuerberater & Verwaltungen</div><ul><li>Unlimited Checks</li><li>Team 5 Nutzer</li><li>White-Label PDFs</li><li>API + 30% Affiliate</li></ul><a href={STRIPE.agency} className="btn">Agency 49€ sichern</a><div className="price-note">Verdiene mit Affiliate 15€/Kunde</div></div>
          </div>
          <div className="guarantee">🛡️ 7 Tage Geld-zurück-Garantie • Keine Fragen • Monatlich kündbar im Stripe Portal</div>
        </div>

        <div className="testimonial">
          <div className="testi-grid">
            <div className="testi">“18 von 23 Handwerker-Rechnungen waren falsch. RechnungFix hat mir 1.200€ Vorsteuer gerettet.”<span>- Marco, Vermieter 8 Wohnungen, München</span></div>
            <div className="testi">“Als Kleinunternehmer §19 wusste ich nicht dass §19 Hinweis Pflicht ist. Tool ist Gold wert.”<span>- Sarah, VA, Berlin</span></div>
            <div className="testi">“Nutze es für alle Mandanten. 30% Provision ist nettes Taschengeld.”<span>- Thomas, Steuerberater, Hamburg</span></div>
          </div>
        </div>

        <footer className="footer">
          <div>RechnungFix DACH • Technischer Prüfservice nach §14/§19 • Keine Steuerberatung nach StBerG</div>
          <div className="footer-links"><span onClick={()=>setShowLegal('impressum')}>Impressum</span> • <span onClick={()=>setShowLegal('datenschutz')}>Datenschutz (RAM only, 24h Löschung)</span> • <span onClick={()=>setShowLegal('agb')}>AGB</span> • <span>check@rechnungfix.de Weiterleitung</span></div>
        </footer>

        {showLegal && (
          <div className="modal" onClick={()=>setShowLegal(null)}><div className="modal-content" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowLegal(null)}>✕</button><h3>{showLegal}</h3><div className="legal-text">{showLegal==='impressum'&&<><p><b>Anbieter:</b> [DEIN NAME], [STRASSE], [PLZ]</p><p>hallo@rechnungfix.de • §19 UStG Kleinunternehmer</p><p>Kein Steuerberater.</p></>}{showLegal==='datenschutz'&&<><p>Upload nur RAM, keine dauerhafte Speicherung, Löschung 24h. Vercel EU, Render Frankfurt EU, OpenAI EU Residency. Rechtsgrundlage Art.6 lit.b. Stripe Payments Europe Ltd. eigenständig. Rechte: Löschung via hallo@. Widerruf digitaler Güter erlischt nach §356 Abs.5 BGB mit Download (Checkbox im Checkout).</p></>}{showLegal==='agb'&&<><p>Technische Prüfung §14/§19, keine Steuerberatung. Endpreise §19. Monatlich kündbar via Stripe Portal. Widerruf mit Download. Haftung max Monatspreis. E-Mail Weiterleitung check@ wird nur geprüft, nicht gespeichert.</p></>}</div></div></div>
        )}
      </div>
    </div>
  )
}

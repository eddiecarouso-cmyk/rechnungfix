
import React, { useState } from 'react'
const API_URL = import.meta.env.VITE_API_URL || 'https://rechnungfix.onrender.com'
export default function App(){
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  async function upload(f){
    if(!f) return
    setFile(f); setLoading(true); setResult(null)
    try{
      const fd = new FormData(); fd.append('file', f)
      const res = await fetch(`${API_URL}/check`, { method:'POST', body: fd })
      const data = await res.json(); setResult(data)
    }catch(e){ setResult({ error: e.message }) }finally{ setLoading(false) }
  }
  return (
    <div className="container">
      <h1>RechnungFix DACH</h1><p>Handwerker-Rechnung prüfen: GoBD, Pflichtangaben, UStG §14</p>
      <div className="card">
        <div className="drop" onClick={()=>document.getElementById('file').click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) upload(f)}}>
          <div>📄</div><div>{file ? file.name : 'Datei hier ablegen oder klicken'}</div>
          <input id="file" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={e=>{const f=e.target.files[0]; if(f) upload(f)}} />
        </div>
        {loading && <div style={{marginTop:16}}>Prüfe Rechnung...</div>}
      </div>
      {result && <div className="card"><pre>{JSON.stringify(result,null,2)}</pre></div>}
    </div>
  )
}

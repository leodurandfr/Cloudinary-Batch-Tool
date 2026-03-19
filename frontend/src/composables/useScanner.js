import { ref, nextTick } from 'vue'

const scanUrls = ref('')
const scanRunning = ref(false)
const scanStatus = ref('')
const scanPercent = ref(0)
const scanLog = ref([])
const scanResult = ref(null)
const scanDone = ref(false)
const scanLogEl = ref(null)

function clearScan() {
  scanLog.value = []
  scanResult.value = null
  scanDone.value = false
  scanPercent.value = 0
  scanStatus.value = ''
}

function appendLog(text, phase = 'info') {
  scanLog.value.push({ text, phase })
  nextTick(() => {
    if (scanLogEl.value) scanLogEl.value.scrollTop = scanLogEl.value.scrollHeight
  })
}

async function startScan() {
  const urls = scanUrls.value.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'))
  if (!urls.length) return

  scanRunning.value = true
  scanResult.value = null
  scanDone.value = false
  scanLog.value = []
  scanPercent.value = 0
  scanStatus.value = 'Initialisation...'

  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      appendLog(`Erreur: ${err.error || res.statusText}`, 'error')
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const msg = JSON.parse(line)

          if (msg.phase === 'init') {
            appendLog(`Scan de ${msg.total_plps} PLP(s)...`, 'info')
          } else if (msg.phase === 'browser' || msg.phase === 'info') {
            appendLog(msg.step, 'info')
          } else if (msg.phase === 'plp') {
            appendLog(`PLP ${msg.index + 1}/${msg.total}: ${msg.category} — ${msg.url}`, 'plp')
            scanStatus.value = `PLP ${msg.index + 1}/${msg.total} (${msg.category})`
            scanPercent.value = Math.round((msg.index / msg.total) * 30)
          } else if (msg.phase === 'plp_done') {
            appendLog(`  → ${msg.pdp_count} produits trouvés (${msg.category})`, 'plp_done')
            scanPercent.value = Math.round(((msg.index + 1) / msg.total) * 30)
          } else if (msg.phase === 'plp_error') {
            appendLog(`Erreur PLP ${msg.url}: ${msg.error}`, 'plp_error')
          } else if (msg.phase === 'pdp') {
            scanStatus.value = `PDP ${msg.pdp_index + 1}/${msg.pdp_total}`
            scanPercent.value = 30 + Math.round((msg.pdp_index / Math.max(msg.pdp_total, 1)) * 65)
          } else if (msg.phase === 'pdp_done') {
            if (msg.images_found > 0) {
              appendLog(`  PDP: ${msg.images_found} image(s) — ${msg.url.split('/').slice(-3, -1).join('/')}`, 'pdp_done')
            }
          } else if (msg.phase === 'pdp_error') {
            appendLog(`Erreur PDP: ${msg.error}`, 'pdp_error')
          } else if (msg.phase === 'behavior') {
            // Suppress verbose behavior logs
          } else if (msg.done) {
            const parts = [`${msg.new_count} nouvelles`]
            if (msg.existing_count) parts.push(`${msg.existing_count} existantes`)
            if (msg.duplicate_count) parts.push(`${msg.duplicate_count} doublons`)
            appendLog(`Scan terminé — ${msg.total} images total (${parts.join(', ')})`, 'done')
            scanPercent.value = 100
            scanResult.value = msg
            scanDone.value = true
          } else if (msg.error) {
            appendLog(`Erreur: ${msg.error}`, 'error')
          }
        } catch {}
      }
    }
  } catch (e) {
    appendLog(`Erreur réseau: ${e.message}`, 'error')
  } finally {
    scanRunning.value = false
  }
}

async function checkScanStatus() {
  try {
    const res = await fetch('/api/scan/status')
    const status = await res.json()
    if (status.running) {
      scanRunning.value = true
      scanStatus.value = 'Scan en cours sur le serveur...'
    }
  } catch {}
}

export function useScanner() {
  return {
    scanUrls,
    scanRunning,
    scanStatus,
    scanPercent,
    scanLog,
    scanResult,
    scanDone,
    scanLogEl,
    startScan,
    clearScan,
    checkScanStatus
  }
}

// Data loaded dynamically from data.json
let data = {}

const STORAGE_KEY = 'notes_data_v1'

let useFirestore = false
let firestoreDb = null

// Load data dynamically from data.json
function loadDataFromJSON(){
  return fetch('data.json')
    .then(res=>{
      if(!res.ok) throw new Error('Failed to load data.json')
      return res.json()
    })
    .then(json=>{
      // Merge loaded data with existing data
      Object.keys(json).forEach(k=>{ data[k] = json[k] })
      regenerateCategoryUI()
      return data
    })
    .catch(err=>{
      console.warn('Failed loading data.json, using defaults or localStorage', err)
      return null
    })
}

// Dynamically generate category buttons based on data
function regenerateCategoryUI(){
  const categoriesList = document.querySelector('.categories')
  if(!categoriesList) return
  
  categoriesList.innerHTML = ''
  const categories = Object.keys(data)
  
  // Set first category as active if none selected yet
  if(!activeCategory || !data[activeCategory]){
    activeCategory = categories[0] || 'General'
  }
  
  categories.forEach(cat=>{
    const li = document.createElement('li')
    const btn = document.createElement('button')
    btn.className = 'cat-btn'
    if(cat === activeCategory) btn.classList.add('active')
    btn.dataset.cat = cat
    
    const count = document.createElement('span')
    count.className = 'count'
    count.textContent = (data[cat] && data[cat].length) ? data[cat].length : 0
    
    btn.appendChild(document.createTextNode(cat + ' '))
    btn.appendChild(count)
    
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'))
      btn.classList.add('active')
      activeCategory = cat
      renderList(cat)
      showNote(0)
      populateCategorySelect()
    })
    
    li.appendChild(btn)
    categoriesList.appendChild(li)
  })
}

function setSyncStatus(status){
  const el = document.getElementById('sync-status')
  if(!el) return
  el.className = 'sync-status ' + status
  const dot = el.querySelector('.dot')
  const label = el.querySelector('.label')
  if(!dot || !label) return
  if(status === 'connected'){
    dot.className = 'dot connected'
    label.textContent = 'Realtime: connected'
  } else if(status === 'connecting'){
    dot.className = 'dot connecting'
    label.textContent = 'Realtime: connecting'
  } else if(status === 'disconnected'){
    dot.className = 'dot disconnected'
    label.textContent = 'Realtime: disconnected'
  } else {
    dot.className = 'dot disabled'
    label.textContent = 'Realtime: disabled'
  }
}

function initFirestore(){
  try{
    if(window.FIREBASE_CONFIG && typeof firebase !== 'undefined'){
      console.log('initFirestore: FIREBASE_CONFIG present, initializing')
      setSyncStatus('connecting')
      // initialize app if not already
      if(!firebase.apps || !firebase.apps.length){
        firebase.initializeApp(window.FIREBASE_CONFIG)
      }
      firestoreDb = firebase.firestore()
      useFirestore = true
      const docRef = firestoreDb.collection('notes').doc('data')
      // real-time listener
      docRef.onSnapshot(snap=>{
        console.log('Firestore snapshot received', snap.exists)
        setSyncStatus('connected')
        const val = snap.exists ? snap.data().payload : null
        if(val && typeof val === 'object'){
          Object.keys(val).forEach(k=>{ data[k] = val[k] })
          // persist locally as well
          try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }catch(e){}
          renderList(activeCategory)
          updateCounts()
          showNote(activeIndex)
        }
      }, err=>{
        console.warn('Firestore listener failed', err)
        setSyncStatus('disconnected')
      })
    }
  }catch(e){
    console.warn('Failed to init Firestore', e)
  }
}

function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    if(!raw) return
    const parsed = JSON.parse(raw)
    if(parsed && typeof parsed === 'object'){
      Object.keys(parsed).forEach(k=>{ data[k] = parsed[k] })
    }
  }catch(e){
    console.warn('Failed loading saved notes', e)
  }
}

// Try to load data from server; fallback to localStorage
function fetchRemoteData(){
  fetch('/api/notes').then(res=>{
    if(!res.ok) throw new Error('Network response not ok')
    return res.json()
  }).then(remote=>{
    if(remote && typeof remote === 'object'){
      Object.keys(remote).forEach(k=>{ data[k] = remote[k] })
      renderList(activeCategory)
      updateCounts()
      showNote(activeIndex)
    }
  }).catch(err=>{
    // ignore - keep local data
    console.warn('Remote load failed, using local data', err)
    loadData()
  })
}

async function saveData(){
  // If Firestore is available, prefer to save there first so other clients get updates
  if(useFirestore && firestoreDb){
    try{
      await saveToFirestore()
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }catch(e){}
      return
    }catch(e){
      console.warn('saveData: Firestore save failed, falling back', e)
      // continue to fallback below
    }
  }

  // Fallback: save locally and to simple server endpoint
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }catch(e){
    console.warn('Failed saving notes locally', e)
  }

  try{
    fetch('/api/notes', {
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    }).then(res=>{
      if(!res.ok) console.warn('Remote save returned non-ok', res.status)
      return res.json().catch(()=>null)
    }).catch(err=>{
      console.warn('Failed saving remote notes', err)
    })
  }catch(e){
    console.warn('saveData: fallback fetch failed', e)
  }
}

// Save to Firestore when enabled (best-effort)
function saveToFirestore(){
  return new Promise((resolve, reject)=>{
    if(!useFirestore || !firestoreDb) return reject(new Error('Firestore not available'))
    try{
      console.log('saveToFirestore: saving payload to Firestore')
      const docRef = firestoreDb.collection('notes').doc('data')
      docRef.set({payload: data}).then(()=>resolve()).catch(err=>{
        console.warn('Failed writing to Firestore', err)
        setSyncStatus('disconnected')
        reject(err)
      })
    }catch(e){
      console.warn('Firestore save error', e)
      setSyncStatus('disconnected')
      reject(e)
    }
  })
}

let activeCategory = null  // Will be set dynamically based on data.json
let activeIndex = 0

function initSidebar(){
  document.querySelectorAll('.cat-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'))
      btn.classList.add('active')
      const cat = btn.dataset.cat
      activeCategory = cat
      renderList(cat)
      showNote(0)
      populateCategorySelect()
    })
  })
}

function updateCounts(){
  document.querySelectorAll('.cat-btn').forEach(btn=>{
    const cat = btn.dataset.cat
    const span = btn.querySelector('.count')
    if(span){
      span.textContent = (data[cat] && data[cat].length) ? data[cat].length : 0
    }
  })
}

function renderList(category){
  const listEl = document.getElementById('notes-list')
  listEl.innerHTML = ''
  const list = data[category] || []
  list.forEach((item, idx)=>{
    const li = document.createElement('div')
    li.className = 'list-item'
    li.innerHTML = `<div class="meta"><h4>${item.q}</h4><p>${item.a.substring(0,120)}...</p></div>
      <div class="item-actions">
        <button class="btn small modify-btn">Modify</button>
        <button class="btn secondary small delete-btn">Delete</button>
      </div>`
    // clicking meta selects note
    li.querySelector('.meta').addEventListener('click', ()=>{ showNote(idx); highlightListItem(idx) })
    // modify -> edit
    li.querySelector('.modify-btn').addEventListener('click', (e)=>{ e.stopPropagation(); enterEditMode(idx, false); })
    // delete -> remove note
    li.querySelector('.delete-btn').addEventListener('click', (e)=>{
      e.stopPropagation()
      if(confirm('Delete this note?')){
        data[category].splice(idx,1)
        // adjust activeIndex
        if(activeIndex===idx) activeIndex = Math.max(0, idx-1)
        renderList(category)
        showNote(activeIndex)
        saveData()
      }
    })
    listEl.appendChild(li)
  })
  highlightListItem(activeIndex)
  updateCounts()
}

function highlightListItem(idx){
  document.querySelectorAll('.list-item').forEach((el,i)=>{
    el.style.outline = i===idx ? '2px solid rgba(11,92,255,0.12)' : 'none'
  })
}

function showNote(idx){
  const list = data[activeCategory] || []
  const note = list[idx]
  activeIndex = idx
  const title = document.getElementById('note-title')
  const content = document.getElementById('content')
  if(note){
    title.textContent = note.q
    // Render note content safely, preserving line breaks and embedded image tokens
    renderContentToElement(note.a, content)
  } else {
    title.textContent = 'Select a note'
    content.textContent = 'Pick a note from the middle column to view the answer.'
  }
}

// Render text to an element, converting [[IMG:dataURL]] tokens to image elements
function renderContentToElement(text, container){
  container.innerHTML = ''
  if(!text){ container.textContent = ''; return }
  const tokenRe = /\[\[IMG:([^\]]+)\]\]/g
  let lastIndex = 0
  let m
  while((m = tokenRe.exec(text)) !== null){
    const before = text.substring(lastIndex, m.index)
    appendTextWithLineBreaks(container, before)
    const dataUrl = m[1]
    try{
      const img = document.createElement('img')
      img.src = dataUrl
      img.className = 'note-embedded-img'
      container.appendChild(img)
    }catch(e){
      // ignore broken image
    }
    lastIndex = tokenRe.lastIndex
  }
  const rest = text.substring(lastIndex)
  appendTextWithLineBreaks(container, rest)
}

function appendTextWithLineBreaks(container, text){
  if(!text) return
  const lines = text.split('\n')
  lines.forEach((line, i)=>{
    container.appendChild(document.createTextNode(line))
    if(i < lines.length - 1) container.appendChild(document.createElement('br'))
  })
}

// Convert a File/Blob to a Data URL
function fileToDataUrl(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader()
    r.onload = ()=>resolve(r.result)
    r.onerror = (e)=>reject(e)
    r.readAsDataURL(file)
  })
}

function populateCategorySelect(){
  const sel = document.getElementById('category-select')
  sel.innerHTML = ''
  Object.keys(data).forEach(k=>{
    const opt = document.createElement('option')
    opt.value = k; opt.textContent = k
    if(k===activeCategory) opt.selected = true
    sel.appendChild(opt)
  })
  sel.addEventListener('change', ()=>{
    activeCategory = sel.value
    document.querySelectorAll('.cat-btn').forEach(b=>{
      b.classList.toggle('active', b.dataset.cat===activeCategory)
    })
    renderList(activeCategory)
    showNote(0)
  })
}

// Search filter
document.addEventListener('DOMContentLoaded', async ()=>{
  // Load data from data.json first
  await loadDataFromJSON()
  
  loadData()
  // ensure auth ready: if Firebase auth exists, wait for auth state check
  try{
    if(window.FIREBASE_CONFIG && typeof firebase !== 'undefined' && firebase.auth){
      firebase.initializeApp && firebase.initializeApp(window.FIREBASE_CONFIG)
      // when auth ready, enforce redirect to login if not signed in
      firebase.auth().onAuthStateChanged(user=>{
        if(!user){
          // not signed in -> send to login
          if(!location.pathname.endsWith('login.html')) location.replace('/login.html')
        } else {
          // signed in -> set user name and continue
          const nameEl = document.getElementById('user-name')
          if(nameEl) nameEl.textContent = user.displayName || user.email || 'User'
          initFirestore()
        }
      })
    } else {
      initFirestore()
    }
  }catch(e){
    console.warn('Auth/init check failed', e)
    initFirestore()
  }
  // if Firestore not configured, fall back to server
  if(!useFirestore) fetchRemoteData()
  initThemeToggle()
  // Category buttons are now created dynamically by regenerateCategoryUI()
  populateCategorySelect()
  renderList(activeCategory)
  showNote(0)
  const search = document.getElementById('search')
  search.addEventListener('input', ()=>{
    const q = search.value.toLowerCase()
    document.querySelectorAll('.list-item').forEach(li=>{
      const text = li.innerText.toLowerCase()
      li.style.display = text.includes(q) ? '' : 'none'
    })
  })
  document.getElementById('add-note').addEventListener('click', ()=>{
    const newNote = {q:'New note - edit me', a:'Answer goes here.'}
    data[activeCategory].unshift(newNote)
    renderList(activeCategory)
    // Enter edit mode for the newly created note
    activeIndex = 0
    enterEditMode(0, true)
    saveData()
    saveToFirestore()
  })
  const editBtn = document.getElementById('edit-note-btn')
  if(editBtn){
    editBtn.addEventListener('click', ()=>{
      // only allow editing when a note exists
      if(data[activeCategory] && data[activeCategory][activeIndex]) enterEditMode(activeIndex, false)
    })
  }
  const modifyBtn = document.getElementById('modify-note-btn')
  if(modifyBtn){
    modifyBtn.addEventListener('click', ()=>{
      if(data[activeCategory] && data[activeCategory][activeIndex]) enterEditMode(activeIndex, false)
    })
  }
  const deleteBtn = document.getElementById('delete-note-btn')
  if(deleteBtn){
    deleteBtn.addEventListener('click', ()=>{
      if(!data[activeCategory] || !data[activeCategory][activeIndex]) return
      if(confirm('Delete this note?')){
        data[activeCategory].splice(activeIndex,1)
        // update list and view
        renderList(activeCategory)
        activeIndex = Math.max(0, activeIndex-1)
        showNote(activeIndex)
        saveData()
      }
    })
  }
})

function enterEditMode(idx, isNew=false){
  const list = data[activeCategory] || []
  const note = list[idx]
  const titleEl = document.getElementById('note-title')
  const contentEl = document.getElementById('content')
  // Create editable inputs
  titleEl.innerHTML = `<input id="edit-title" value="${note ? escapeHtml(note.q) : ''}" style="width:100%;padding:8px;border-radius:6px;border:1px solid rgba(15,23,36,0.06);font-size:18px">`
  contentEl.innerHTML = `<textarea id="edit-body" style="width:100%;height:220px;padding:10px;border-radius:6px;border:1px solid rgba(15,23,36,0.06);">${note ? escapeHtml(note.a) : ''}</textarea>
    <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
      <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer"><input id="attach-image" type="file" accept="image/*" style="display:none">Attach Image</label>
      <button id="save-note" class="btn">Save</button>
      <button id="cancel-note" class="btn secondary">Cancel</button>
    </div>
    <div id="edit-image-preview" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"></div>`

  document.getElementById('save-note').addEventListener('click', ()=>{
    const newQ = document.getElementById('edit-title').value.trim() || 'Untitled'
    const newA = document.getElementById('edit-body').value.trim() || ''
    if(!data[activeCategory]) data[activeCategory] = []
    data[activeCategory][idx] = {q:newQ,a:newA}
    renderList(activeCategory)
    showNote(idx)
    saveData()
    saveToFirestore()
  })

  // Attach image handler: inserts token [[IMG:dataUrl]] into textarea and shows preview
  const attachInput = document.getElementById('attach-image')
  const editBody = document.getElementById('edit-body')
  const preview = document.getElementById('edit-image-preview')
  function refreshPreview(){
    preview.innerHTML = ''
    const tokenRe = /\[\[IMG:([^\]]+)\]\]/g
    let m
    while((m = tokenRe.exec(editBody.value)) !== null){
      const img = document.createElement('img')
      img.src = m[1]
      img.style.maxWidth = '120px'
      img.style.maxHeight = '90px'
      img.style.objectFit = 'cover'
      img.style.borderRadius = '6px'
      preview.appendChild(img)
    }
  }
  if(attachInput){
    attachInput.addEventListener('change', (ev)=>{
      const f = ev.target.files && ev.target.files[0]
      if(!f) return
      const reader = new FileReader()
      reader.onload = function(e){
        const dataUrl = e.target.result
        // insert token at cursor position
        const start = editBody.selectionStart || editBody.value.length
        const before = editBody.value.substring(0, start)
        const after = editBody.value.substring(start)
        editBody.value = before + "\n[[IMG:" + dataUrl + "]]\n" + after
        refreshPreview()
      }
      reader.readAsDataURL(f)
      // reset input so same file can be attached again if needed
      attachInput.value = ''
    })
    // refresh preview on load
    refreshPreview()
  }

  // Paste handler: allow pasting images from clipboard into the textarea
  if(editBody){
    editBody.addEventListener('paste', async (ev)=>{
      try{
        const items = (ev.clipboardData && ev.clipboardData.items) || []
        for(let i=0;i<items.length;i++){
          const it = items[i]
          if(it.type && it.type.indexOf('image') === 0){
            ev.preventDefault()
            const file = it.getAsFile()
            if(file){
              const dataUrl = await fileToDataUrl(file)
              const start = editBody.selectionStart || editBody.value.length
              const before = editBody.value.substring(0, start)
              const after = editBody.value.substring(start)
              editBody.value = before + "\n[[IMG:" + dataUrl + "]]\n" + after
              refreshPreview()
            }
            return
          }
        }
        // fallback: if files present (some browsers)
        const files = (ev.clipboardData && ev.clipboardData.files) || []
        if(files.length){
          ev.preventDefault()
          const f = files[0]
          if(f && f.type && f.type.indexOf('image')===0){
            const dataUrl = await fileToDataUrl(f)
            const start = editBody.selectionStart || editBody.value.length
            const before = editBody.value.substring(0, start)
            const after = editBody.value.substring(start)
            editBody.value = before + "\n[[IMG:" + dataUrl + "]]\n" + after
            refreshPreview()
          }
        }
      }catch(e){
        console.warn('paste image failed', e)
      }
    })

    // Drag & drop support: drop image files onto the content area
    contentEl.addEventListener('dragover', (e)=>{ e.preventDefault() })
    contentEl.addEventListener('drop', async (e)=>{
      e.preventDefault()
      try{
        const f = (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0])
        if(f && f.type && f.type.indexOf('image')===0){
          const dataUrl = await fileToDataUrl(f)
          const start = editBody.selectionStart || editBody.value.length
          const before = editBody.value.substring(0, start)
          const after = editBody.value.substring(start)
          editBody.value = before + "\n[[IMG:" + dataUrl + "]]\n" + after
          refreshPreview()
        }
      }catch(err){
        console.warn('drop image failed', err)
      }
    })
  }

  document.getElementById('cancel-note').addEventListener('click', ()=>{
    // If it was a new note and user cancels, remove it
    if(isNew){
      data[activeCategory].splice(idx,1)
      renderList(activeCategory)
      showNote(0)
      saveData()
      saveToFirestore()
    } else {
      showNote(idx)
    }
  })
}

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// Theme toggle: persist and apply dark mode
function applyTheme(isDark){
  const root = document.documentElement
  if(isDark) root.classList.add('dark')
  else root.classList.remove('dark')
  const btns = document.querySelectorAll('.theme-toggle')
  btns.forEach(b=>{
    b.textContent = isDark ? '☀️' : '🌙'
    b.setAttribute('aria-pressed', isDark ? 'true' : 'false')
  })
}

function initThemeToggle(){
  const saved = localStorage.getItem('theme')
  const isDark = saved ? saved === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  applyTheme(isDark)
  document.querySelectorAll('.theme-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const nowDark = !document.documentElement.classList.contains('dark')
      applyTheme(nowDark)
      localStorage.setItem('theme', nowDark ? 'dark' : 'light')
    })
  })
}

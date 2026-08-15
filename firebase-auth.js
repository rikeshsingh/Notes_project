// Firebase Authentication helpers
(function(){
  function $(id){return document.getElementById(id)}
  if(!window.FIREBASE_CONFIG || typeof firebase === 'undefined'){
    console.warn('firebase-auth: FIREBASE_CONFIG not present or firebase missing')
    return
  }
  if(!firebase.apps || !firebase.apps.length){
    firebase.initializeApp(window.FIREBASE_CONFIG)
  }
  const auth = firebase.auth()
  const db = firebase.firestore()

  // Update user metadata: last login, locale, and (optionally) geolocation/ip
  function updateUserMetadata(user){
    if(!user) return Promise.resolve()
    const docRef = db.collection('users').doc(user.uid)
    const info = { lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(), locale: (navigator.language || null) }
    return new Promise((resolve)=>{
      // Try browser geolocation first (prompt may appear). If it fails, fall back to IP lookup.
      if(navigator && navigator.geolocation){
        navigator.geolocation.getCurrentPosition(async (pos)=>{
          info.geo = {lat: pos.coords.latitude, lng: pos.coords.longitude}
          docRef.set(info, {merge:true}).then(()=>resolve()).catch(()=>resolve())
        }, async ()=>{
          try{
            const resp = await fetch('https://ipapi.co/json/')
            const j = await resp.json()
            info.ip = j.ip
            info.city = j.city
            info.region = j.region
            info.country = j.country_name
          }catch(e){}
          docRef.set(info, {merge:true}).then(()=>resolve()).catch(()=>resolve())
        }, {timeout:5000})
      } else {
        // No geolocation available, try IP lookup
        fetch('https://ipapi.co/json/').then(r=>r.json()).then(j=>{
          info.ip = j.ip
          info.city = j.city
          info.region = j.region
          info.country = j.country_name
        }).catch(()=>{}).finally(()=>{
          docRef.set(info, {merge:true}).then(()=>resolve()).catch(()=>resolve())
        })
      }
    })
  }

  // Sign up
  const btnSignup = $('btn-signup')
  const btnSignin = $('btn-signin')
  const btnGoogle = $('btn-google')
  const msg = $('auth-msg')

  function showMsg(m){ if(msg) msg.textContent = m }

  if(btnSignup){
    btnSignup.addEventListener('click', ()=>{
      const email = $('email').value.trim()
      const pass = $('password').value
      const displayName = $('displayName').value.trim()
      if(!email || !pass){ showMsg('Enter email and password'); return }
      showMsg('Creating account...')
      auth.createUserWithEmailAndPassword(email, pass).then(cred=>{
        return cred.user.updateProfile({displayName: displayName || ''}).then(()=>cred.user)
      }).then(user=>{
        // create profile in Firestore
        return db.collection('users').doc(user.uid).set({
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(()=> updateUserMetadata(user))
      }).then(()=>{
        showMsg('Account created. Redirecting...')
        window.location.href = '/index.html'
      }).catch(err=>{
        showMsg(err.message || String(err))
      })
    })
  }

  if(btnSignin){
    btnSignin.addEventListener('click', ()=>{
      const email = $('email').value.trim()
      const pass = $('password').value
      if(!email || !pass){ showMsg('Enter email and password'); return }
      showMsg('Signing in...')
      auth.signInWithEmailAndPassword(email, pass).then((cred)=>{
        const user = cred.user || auth.currentUser
        return updateUserMetadata(user)
      }).then(()=>{
        showMsg('Signed in. Redirecting...')
        window.location.href = '/index.html'
      }).catch(err=> showMsg(err.message || String(err)))
    })
  }

  if(btnGoogle){
    btnGoogle.addEventListener('click', ()=>{
      const provider = new firebase.auth.GoogleAuthProvider()
      auth.signInWithPopup(provider).then(result=>{
        const u = result.user
        // ensure user doc
        return db.collection('users').doc(u.uid).set({
          uid:u.uid, displayName: u.displayName||'', email:u.email||'', createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true}).then(()=> updateUserMetadata(u))
      }).then(()=> window.location.href = '/index.html').catch(err=> showMsg(err.message||String(err)))
    })
  }

  // If user already signed in, redirect to app
  auth.onAuthStateChanged(u=>{
    const signoutBtn = document.getElementById('btn-signout')
    if(u){
      // already signed in
      if(window.location.pathname === '/' || window.location.pathname.endsWith('login.html')){
        window.location.href = '/index.html'
        return
      }
      // show sign out button if present
      if(signoutBtn){ signoutBtn.style.display = 'inline-block' }
    } else {
      // not signed in -> send to login
      if(!location.pathname.endsWith('login.html')) location.replace('/login.html')
      if(signoutBtn) signoutBtn.style.display = 'none'
    }
  })

  // bind sign-out action if button exists (works on index.html)
  const signoutBtnGlobal = document.getElementById('btn-signout')
  if(signoutBtnGlobal){
    signoutBtnGlobal.addEventListener('click', ()=>{
      showMsg('Signing out...')
      auth.signOut().then(()=>{
        window.location.href = '/login.html'
      }).catch(err=>{
        showMsg(err.message || String(err))
      })
    })
  }
})();

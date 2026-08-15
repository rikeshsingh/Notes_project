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
        })
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
      auth.signInWithEmailAndPassword(email, pass).then(()=>{
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
        }, {merge:true})
      }).then(()=> window.location.href = '/index.html').catch(err=> showMsg(err.message||String(err)))
    })
  }

  // If user already signed in, redirect to app
  auth.onAuthStateChanged(u=>{
    if(u){
      // already signed in
      if(window.location.pathname === '/' || window.location.pathname.endsWith('login.html')){
        window.location.href = '/index.html'
      }
    }
  })
})();

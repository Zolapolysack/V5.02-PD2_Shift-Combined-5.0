(function(){
  const out = document.getElementById('out');
  const btnRun = document.getElementById('run');
  const btnClear = document.getElementById('clear');
  const btnReset = document.getElementById('reset');

  function log(msg, cls){
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.textContent = msg;
    out.appendChild(line);
  }

  function reset(){
    try{
      sessionStorage.removeItem('neuroAuth');
      // Clear attempts for the users we test
      ['Zolapolysack_PD2','Zolapolysack_PD'].forEach(u => {
        localStorage.removeItem(`neuroAuthAttempts:${u}`);
      });
      log('Reset session & attempts', 'warn');
    }catch(e){ log('Reset error: ' + e, 'fail'); }
  }

  async function run(){
    if (!window.FormAuth){ log('FormAuth not loaded', 'fail'); return; }

    // 1) Valid login: PD2
    let res = await FormAuth.authenticate('Zolapolysack_PD2','ZP9965');
    if (res && res.ok){ log('[OK] PD2 valid login passed', 'ok'); FormAuth.loginSession(res.user); }
    else { log('[FAIL] PD2 valid login failed', 'fail'); }

    // 2) Invalid login: wrong password
    res = await FormAuth.authenticate('Zolapolysack_PD2','WRONG');
    if (res && res.ok){ log('[FAIL] Invalid login erroneously passed', 'fail'); }
    else { log('[OK] Invalid login correctly rejected', 'ok'); }

    // 3) Username PD with any of allowed passwords
    const allowed = ['ZP1033','ZP1045','ZP1048'];
    for (const p of allowed){
      res = await FormAuth.authenticate('Zolapolysack_PD', p);
      if (res && res.ok) log(`[OK] PD valid password accepted (${p})`, 'ok');
      else log(`[FAIL] PD valid password rejected (${p})`, 'fail');
    }

    // 4) Lockout test (make 5 bad attempts)
    reset();
    let locked = false;
    for (let i=1;i<=5;i++){
      res = await FormAuth.authenticate('Zolapolysack_PD', 'BAD'+i);
      if (res && res.locked){ locked = true; break; }
    }
    if (!locked){
      // After 5, the next should report locked
      res = await FormAuth.authenticate('Zolapolysack_PD', 'BADX');
      locked = !!(res && res.locked);
    }
    if (locked){ log('[OK] Lockout engaged after repeated failures', 'ok'); }
    else { log('[WARN] Lockout not observed (check thresholds)', 'warn'); }
  }

  btnRun.addEventListener('click', run);
  btnClear.addEventListener('click', () => out.textContent = '');
  btnReset.addEventListener('click', reset);
})();

// Client-side auth module (quick-gate).
// Stores SHA-256 hashes of username:password:pepper and verifies using Web Crypto API.
// WARNING: This is a client-side protection only. Do NOT store secrets or sensitive data here.
(function(global){
    'use strict';

    const PEPPER = 'S3cPepp3r!2025'; // embedded pepper (user accepted client-side approach)
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes
    const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

    // Precomputed hashes for allowed credentials (hex SHA-256 of `${username}:${password}:${PEPPER}`)
    // Accounts provided by the user:
    // Zolapolysack_PD2 : ZP9965
    // Zolapolysack_PD  : ZP1033, ZP1045, ZP1048 (single username accepts multiple passwords)
    const STORED = [
        { user: 'Zolapolysack_PD2', hash: 'a8e81ac539d89123f49f056260c835ffa93c20c29371d334cde08a47aa7ccac1' },
        { user: 'Zolapolysack_PD', hash: 'd724a989d62176d32de93cbae2389bf5b3a485bd7a3b3d8d69d3451a0b3b76c0' },
        { user: 'Zolapolysack_PD', hash: 'f7c5300e88dc569bc50ae1c97e9f5a4ad22e92fb849e98e99b1d16cc16a81b68' },
        { user: 'Zolapolysack_PD', hash: '3c3f7d3d72abc59362c747a1ee8d801b698634bdbe2df550ed3653353a39a864' }
    ];

    function bufToHex(buffer){
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    }

    function cryptoAvailable(){
        return (global.crypto && global.crypto.subtle && typeof global.crypto.subtle.digest === 'function');
    }

    async function sha256Hex(text){
        if (!cryptoAvailable()) throw new Error('Web Crypto API not available');
        const enc = new TextEncoder();
        const data = enc.encode(text);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return bufToHex(hash);
    }

    function attemptsKey(user){ return `neuroAuthAttempts:${user}`; }
    function readAttempts(user){
        try{
            const raw = localStorage.getItem(attemptsKey(user));
            return raw ? JSON.parse(raw) : { count: 0, until: 0 };
        }catch(e){ return { count: 0, until: 0 }; }
    }
    function writeAttempts(user, obj){
        try{ localStorage.setItem(attemptsKey(user), JSON.stringify(obj)); }catch(e){}
    }
    function clearAttempts(user){
        try{ localStorage.removeItem(attemptsKey(user)); }catch(e){}
    }

    async function authenticate(username, password){
        if (typeof username !== 'string' || typeof password !== 'string') return { ok: false };
        const u = username.trim();
        // Check lockout
        const a = readAttempts(u);
        const now = Date.now();
        if (a.until && now < a.until){
            return { ok: false, locked: true, retryAt: a.until };
        }
        const candidate = await sha256Hex(`${u}:${password}:${PEPPER}`);
        // Check any stored entry that matches username and hash
        for (let i=0;i<STORED.length;i++){
            if (STORED[i].user === u && STORED[i].hash === candidate) {
                clearAttempts(u);
                return { ok: true, user: u };
            }
        }
        // Failed attempt
        const nextCount = (a && typeof a.count==='number') ? a.count + 1 : 1;
        const obj = { count: nextCount, until: 0 };
        if (nextCount >= MAX_ATTEMPTS){ obj.until = now + LOCKOUT_MS; obj.count = 0; }
        writeAttempts(u, obj);
        return { ok: false };
    }

    function loginSession(user){
        try{
            const payload = { user: user, ts: Date.now(), exp: Date.now() + SESSION_TTL_MS };
            sessionStorage.setItem('neuroAuth', JSON.stringify(payload));
            return true;
        }catch(e){ return false; }
    }

    function getSession(){
        try{
            const v = sessionStorage.getItem('neuroAuth');
            if (!v) return null;
            const obj = JSON.parse(v);
            if (obj && obj.exp && Date.now() > obj.exp){
                try{ sessionStorage.removeItem('neuroAuth'); }catch(e){}
                return null;
            }
            return obj;
        }catch(e){ return null; }
    }

    function logout(){
        try{ sessionStorage.removeItem('neuroAuth'); }catch(e){}
    }

    global.FormAuth = {
        authenticate,
        loginSession,
        getSession,
        logout
    };

})(window);

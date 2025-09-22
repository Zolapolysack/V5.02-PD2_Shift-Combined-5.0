/* Validators: usable in browser (window.FormValidators) and Node (module.exports)
   Provides: validateUsername(value) and validatePassword(value)
   Return shape: { valid: boolean, message?: string }
*/
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.FormValidators = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    function validateUsername(value) {
        const s = String(value || '').trim();
        if (!s) return { valid: false, message: 'Username is required' };
        // Additional username rules could be added here (chars, length)
        return { valid: true };
    }

    function validatePassword(value) {
        const p = String(value || '');
        if (!p) return { valid: false, message: 'Password is required' };
        if (p.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
        return { valid: true };
    }

    return { validateUsername, validatePassword };
});

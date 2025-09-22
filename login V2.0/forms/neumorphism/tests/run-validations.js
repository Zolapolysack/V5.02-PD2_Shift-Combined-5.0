// Simple Node test runner for validators
const path = require('path');
const validators = require(path.join('..','validators.js'));

function assert(cond, msg){ if(!cond) throw new Error(msg || 'Assertion failed'); }

function testValidateUsername(){
    console.log('testValidateUsername...');
    assert(validators.validateUsername('').valid === false, 'empty username should be invalid');
    assert(validators.validateUsername('   ').valid === false, 'spaces only invalid');
    assert(validators.validateUsername('alice').valid === true, 'alice valid');
    console.log('  OK');
}

function testValidatePassword(){
    console.log('testValidatePassword...');
    assert(validators.validatePassword('').valid === false, 'empty password invalid');
    assert(validators.validatePassword('123').valid === false, 'short password invalid');
    assert(validators.validatePassword('123456').valid === true, '6 chars valid');
    console.log('  OK');
}

function run(){
    try{
        testValidateUsername();
        testValidatePassword();
        console.log('\nAll tests passed');
        process.exit(0);
    }catch(e){
        console.error('Test failed:', e.message);
        process.exit(1);
    }
}

run();

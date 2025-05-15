export function saveTest(test) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    tests.push(test);
    localStorage.setItem('tests', JSON.stringify(tests));
}

export function getTests() {
    return JSON.parse(localStorage.getItem('tests') || '[]');
}

export function getTestById(id) {
    return getTests().find(t => t.id === id);
}

export function saveSession(session) {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('sessions', JSON.stringify(sessions));
}

export function getSessionsByTestId(testId) {
    return JSON.parse(localStorage.getItem('sessions') || '[]').filter(s => s.testId === testId);
}

export function getSessionById(id) {
    return JSON.parse(localStorage.getItem('sessions') || '[]').find(s => s.id === id);
}

export function updateTest(updatedTest){
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const idx = tests.findIndex(t => t.id === updateTest.id);
        if (idx !== -1) {
            tests[idx] = updatedTest;
            localStorage.setItem('tests', JSON.stringify(tests));
        }
}
function waitForElement(id, callback) {
    const element = document.getElementById(id);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElement(id, callback), 50);
    }
}

// Usage:
waitForElement("BackButton", (btn) => {
    btn.remove();
});
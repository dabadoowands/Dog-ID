const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadInner = document.getElementById('uploadInner');
const previewImg = document.getElementById('previewImg');
const analyzeBtn = document.getElementById('analyzeBtn');
const hero = document.getElementById('hero');
const loadingState = document.getElementById('loadingState');
const loadingText = document.getElementById('loadingText');
const results = document.getElementById('results');
const errorState = document.getElementById('errorState');
const installBtn = document.getElementById('installBtn');

let selectedFile = null;

const loadingMessages = [
  'Looking closely…',
  'Comparing coat and build…',
  'Checking breed markers…',
  'Putting the profile together…'
];

uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.hidden = false;
    uploadInner.hidden = true;
    analyzeBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

analyzeBtn.addEventListener('click', analyzeDog);

async function analyzeDog() {
  if (!selectedFile) return;

  hero.hidden = true;
  loadingState.hidden = false;
  errorState.hidden = true;
  let msgIndex = 0;
  const msgInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[msgIndex];
  }, 1800);

  try {
    const base64 = await fileToBase64(selectedFile);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64.split(',')[1],
        mediaType: selectedFile.type
      })
    });

    if (!res.ok) throw new Error('Analysis failed');
    const data = await res.json();

    clearInterval(msgInterval);
    renderResults(data);
  } catch (err) {
    clearInterval(msgInterval);
    loadingState.hidden = true;
    errorState.hidden = false;
    console.error(err);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderResults(data) {
  document.getElementById('breedName').textContent = data.breed || 'Mixed breed';
  document.getElementById('breedConfidence').textContent = data.confidence || '';
  document.getElementById('characteristics').textContent = data.characteristics || '';
  document.getElementById('grooming').textContent = data.grooming || '';
  document.getElementById('exercise').textContent = data.exercise || '';
  document.getElementById('lifespan').textContent = data.lifespan || '';
  document.getElementById('training').textContent = data.training || '';

  loadingState.hidden = true;
  results.hidden = false;
}

document.getElementById('resetBtn').addEventListener('click', resetApp);
document.getElementById('errorResetBtn').addEventListener('click', resetApp);

function resetApp() {
  selectedFile = null;
  fileInput.value = '';
  previewImg.hidden = true;
  uploadInner.hidden = false;
  analyzeBtn.disabled = true;
  results.hidden = true;
  errorState.hidden = true;
  hero.hidden = false;
}

// Upsell button: wire this to your real checkout (Stripe Payment Link is the
// zero-cost way to start — see README). Swap this URL for your own link.
document.getElementById('upsellBtn').addEventListener('click', () => {
  const stripeLink = 'https://buy.stripe.com/REPLACE_WITH_YOUR_LINK';
  window.open(stripeLink, '_blank');
});

// ---- PWA: install prompt (Android/desktop Chrome) ----
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
});

// ---- PWA: register service worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}

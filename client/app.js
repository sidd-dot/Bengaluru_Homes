// ---- Config: point to your running Flask server ----
const API_BASE = "http://127.0.0.1:5000";

// ---- Helpers ----
const qs  = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

function showToast(msg, timeout=2600){
  const el = qs('#toast');
  el.textContent = msg;
  el.hidden = false;
  setTimeout(()=> el.hidden = true, timeout);
}

function setLoading(isLoading){
  qs('#btnSpinner').hidden = !isLoading;
  qs('#estimateBtn').disabled = isLoading;
  qs('#estimateBtn .btn__label').textContent = isLoading ? "Estimating…" : "Estimate Price";
}

function animateNumber(el, target, unit=" Lakh", duration=900){
  const start = 0;
  const startTime = performance.now();
  function tick(now){
    const p = Math.min(1, (now - startTime)/duration);
    const val = (start + (target - start)*p).toFixed(2);
    el.textContent = val + unit;
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ---- API calls ----
async function fetchLocations(){
  const res = await fetch(`${API_BASE}/get_location_names`);
  if(!res.ok) throw new Error("Failed to load locations");
  return res.json();
}

async function predictPrice(payload){
  const form = new URLSearchParams();
  form.set("total_sqft", payload.sqft);
  form.set("bhk", payload.bhk);
  form.set("bath", payload.bath);
  form.set("location", payload.location);

  const res = await fetch(`${API_BASE}/predict_home_price`, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: form.toString()
  });
  if(!res.ok) throw new Error("Prediction failed");
  return res.json();
}

// ---- UI wiring ----
function populateLocations(list){
  const select = qs('#location');
  select.innerHTML = `<option value="" selected disabled>Choose a location…</option>`;
  list.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    select.appendChild(opt);
  });
  // Update hero stat
  qs('#statLocations').textContent = list.length.toString();
}

function getSelected(name){
  const checked = qs(`input[name="${name}"]:checked`);
  return checked ? parseInt(checked.value, 10) : null;
}

function setupEstimator(){
  const form = qs('#estimateForm');
  const resultCard = qs('#resultCard');
  const resultValue = qs('#resultValue');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const sqft = parseFloat(qs('#sqft').value);
    const bhk = getSelected('bhk');
    const bath = getSelected('bath');
    const location = qs('#location').value;

    if(!(sqft && sqft >= 100)){ showToast("Enter a valid area (≥ 100 sqft)"); return; }
    if(!bhk){ showToast("Select BHK"); return; }
    if(!bath){ showToast("Select bathrooms"); return; }
    if(!location){ showToast("Choose a location"); return; }

    try{
      setLoading(true);
      const data = await predictPrice({sqft, bhk, bath, location});
      resultCard.hidden = false;
      animateNumber(resultValue, Number(data.estimated_price));
      showToast("Estimate ready ✓");
    }catch(err){
      console.error(err);
      showToast("Could not fetch estimate. Is the Flask API running?");
    }finally{
      setLoading(false);
    }
  });
}

function smoothNav(){
  qsa('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href').slice(1);
      const target = qs(`#${id}`);
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });
}

function setYear(){
  qs('#year').textContent = new Date().getFullYear();
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async ()=>{
  setYear();
  smoothNav();
  setupEstimator();
  try{
    const data = await fetchLocations();
    if(data && data.locations) populateLocations(data.locations);
  }catch(err){
    console.error(err);
    showToast("Could not load locations. Start Flask API.");
  }
});

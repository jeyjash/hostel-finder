import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZBGj6mUpOzDQgZSv4Bfj5gKbsJBqtRR0",
  authDomain: "hostel-finder-ab6d3.firebaseapp.com",
  projectId: "hostel-finder-ab6d3",
  storageBucket: "hostel-finder-ab6d3.firebasestorage.app",
  messagingSenderId: "20903634583",
  appId: "1:20903634583:web:2f4ad932abf9da0653ebd2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 👉 ADD THIS LINE
let allHostels = [];
let userLocation = null;


document.addEventListener("keydown", (e) => {
  if (e.key === "?") {
    const pass = prompt("Admin password:");
    if (pass === "yoursecret001") {
      document.getElementById("adminBtn").style.display = "block";
    }
  }
});

// script.js
// Clean, self-contained, and safe. Put this in script.js

// --------------------------
// 1) Campus coordinates (single source of truth)
// --------------------------
const campuses = {
  MUBAS: { lat: -15.802, lng: 35.035 },
  CHANCO: { lat: -15.388, lng: 35.318 }
};

// --------------------------
// 2) Sample hostel data (extend this list)
// --------------------------
async function loadHostels() {
  try {
    const snapshot = await getDocs(collection(db, "hostels"));

    allHostels = snapshot.docs.map(doc => {
  const data = doc.data();

  console.log("FIREBASE DATA:", data); // 🔥 THIS IS WHAT WE NEED

  return {
    id: doc.id,
    ...data
  };
});

console.log("Loaded hostels:", allHostels);

    displayHostels(allHostels);

  } catch (error) {
    console.error("Error loading hostels:", error);
  }
}

// --------------------------
// 3) Utility - safe HTML escape for inserted text
// --------------------------


// Utility: distance
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}


function escapeHtml(str) {


  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
   



// --------------------------
// 4) Render hostels into #hostel-list
// --------------------------
function displayHostels(list = allHostels) {
  const container = document.getElementById("hostel-list");
  if (!container) return; // defensive
  container.innerHTML = "";

if (!list || list.length === 0) {
  container.innerHTML = "<p>No hostels available.</p>";
  return;
}

  list.forEach((hostel, index) => {

const campus = campuses[
  hostel.school?.toString().trim().toUpperCase()
] || null;

console.log("School from hostel:", hostel.school);
console.log("Campus found:",campuses[hostel.school?.toUpperCase()]);


let distance = "Unknown";

const lat = hostel.lat ?? hostel.latitude;
const lng = hostel.lng ?? hostel.longitude;

console.log("LAT:", hostel.lat, "LNG:", hostel.lng);

if (campus && lat != null && lng != null) {
  distance = getDistance(
    lat,
    lng,
    campus.lat,
    campus.lng
  ) + " km";
}
console.log("Distance:", distance);



    // build iframe src: if campus available, show route; otherwise just pin the hostel
const mapLat = hostel.lat ?? hostel.latitude;
const mapLng = hostel.lng ?? hostel.longitude;

const mapSrc = (campus && mapLat != null && mapLng != null)
  ? `https://www.google.com/maps?saddr=${encodeURIComponent(mapLat + "," + mapLng)}&daddr=${encodeURIComponent(campus.lat + "," + campus.lng)}&z=15&output=embed`
  : `https://www.google.com/maps?q=${encodeURIComponent(mapLat + "," + mapLng)}&z=15&output=embed`;


const roomValue = hostel.room || hostel.roomType;

let studentsPerRoom;

if (typeof roomValue === "number") {
  studentsPerRoom = roomValue;
} else {
  const normalized = roomValue?.toString().trim().toLowerCase();

  if (normalized === "single") studentsPerRoom = 1;
  else if (normalized === "double") studentsPerRoom = 2;
  else if (normalized === "triple") studentsPerRoom = 3;
  else if (normalized === "quad") studentsPerRoom = 4;
  else studentsPerRoom = roomValue; // fallback
}


const bedTypeRaw = hostel.bedType;

let bedType;

if (bedTypeRaw) {
  bedType = bedTypeRaw.toString().trim();
} else {
  bedType = "Not specified";
}


    const cardHtml = `
      <div class="card">
        <div class="card-content">

          <div class="details">
           <h2 class="blur-text">${escapeHtml(hostel.name)}</h2>   
                    <p><strong>School:</strong> ${escapeHtml(hostel.school || hostel.campus)}</p>
                    <p><strong>Price:</strong> ${escapeHtml(hostel.price)} MWK</p>
                    <p>
  <strong>Students per room:</strong> 
  ${escapeHtml(studentsPerRoom)}
</p>
                    <p><strong>Bed type:</strong> ${escapeHtml(bedType)}</p>
                   <p><strong>Distance from campus:</strong> ${distance}</p>
          


<p id="contact-${index}" class="hidden">
  📞 <a href="tel:${hostel.contact || hostel.phone || hostel.phoneNumber}">
    ${escapeHtml(hostel.contact || hostel.phone || hostel.phoneNumber)}
  </a>
</p>

            
            <button type="button" onclick="unlockHostel(${index})">Unlock (5,000 MWK)</button>

          </div>

          <div id="map-${index}" class="map-box hidden">
            <iframe src="${mapSrc}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>

        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", cardHtml);
  });
}

// --------------------------
// 🔐 CODE SYSTEM (FAKE BACKEND)
// --------------------------

// Generate 6-digit code

async function createCode() {
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();

  await addDoc(collection(db, "codes"), {
    code: newCode,
    used: false
  });

  alert("NEW CODE: " + newCode);
}

// Save new code (for YOU to give users)


async function unlockHostel(index) {
  const userCode = prompt("Enter your code:");

  if (!userCode) return;

  const q = query(
    collection(db, "codes"),
    where("code", "==", userCode)
  );

console.log("User entered:", userCode);

  const snapshot = await getDocs(q);

console.log("Code search result:", snapshot);


  if (snapshot.empty) {
    alert("Invalid code");
    return;
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  if (data.used) {
    alert("Code already used");
    return;
  }

  // ✅ NOW it's safe to unlock EVERYTHING

  // remove blur
  document.querySelectorAll(".blur-text")[index].style.filter = "none";

  // show contact + map
 document.getElementById(`contact-${index}`).classList.remove("hidden");
 document.getElementById(`map-${index}`).classList.remove("hidden");


  // mark as used
  await updateDoc(doc(db, "codes", docSnap.id), {
    used: true
  });

  alert("Unlocked successfully");
}



// --------------------------
// 6) Filter / search logic
// --------------------------
function filterHostels() {
  const searchInput = document.getElementById("searchInput");
  const schoolFilter = document.getElementById("schoolFilter");

  const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const schoolValue = schoolFilter ? schoolFilter.value : "ALL";

  const filtered = allHostels.filter(h => {
    const matchesSearch =
      !searchValue ||
      (h.name && h.name.toLowerCase().includes(searchValue)) ||
      (h.type && h.type.toLowerCase().includes(searchValue)) ||
      (h.room && h.room.toLowerCase().includes(searchValue));

const matchesSchool =
  !schoolValue ||
  schoolValue === "ALL" ||
  (h.school?.toUpperCase() === schoolValue);
    return matchesSearch && matchesSchool;
  });

  displayHostels(filtered);
}


function requestAccess() {
  const phone = "265987329583"; // correct format

  const message = encodeURIComponent(
    "Hi, I want access to a hostel listing. I am ready to pay."
  );

window.open(`https://wa.me/${phone}?text=${message}`, "_blank");

}




// --------------------------
// 7) Bootstrapping: wait for DOM and wire events
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  // initial render
navigator.geolocation.getCurrentPosition(
  (position) => {
    userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    loadHostels();
  },
  () => {
    console.warn("Location denied");
    loadHostels(); // fallback
  }
);
  // safe wiring of controls (if they exist)
  const searchInput = document.getElementById("searchInput");
  const schoolFilter = document.getElementById("schoolFilter");

  if (searchInput) searchInput.addEventListener("input", filterHostels);
  if (schoolFilter) schoolFilter.addEventListener("change", filterHostels);
})

window.unlockHostel = unlockHostel;
window.createCode = createCode;
window.requestAccess = requestAccess;

;
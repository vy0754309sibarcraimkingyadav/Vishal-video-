// ======================================================
// VISHAL VIDEO - SCRIPT.JS
// Login + Register + Firebase Firestore
// Videos + Search + Category + Admin
// Like + Comment + Subscribe
// ======================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyDsMmWiCBDn88G3MQplOLeq0aEP3Rc2jr4",
  authDomain: "xxxx-eb1b1.firebaseapp.com",
  projectId: "xxxx-eb1b1",
  storageBucket: "xxxx-eb1b1.firebasestorage.app",
  messagingSenderId: "23932641603",
  appId: "1:23932641603:web:bcb00b4a5682c4ccd28ff6",
  measurementId: "G-LJ40FRLZR4"
};


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ======================================================
// ADMIN
// ======================================================

const OWNER_EMAIL = "yogendrasingh102223@gmail.com";

let currentUser = null;
let isAdmin = false;
let videos = [];
let editingVideoId = null;


// ======================================================
// ELEMENTS
// ======================================================

const homePage = document.getElementById("homePage");
const accountPage = document.getElementById("accountPage");
const adminPage = document.getElementById("adminPage");

const homeBtn = document.getElementById("homeBtn");
const accountBtn = document.getElementById("accountBtn");
const adminBtn = document.getElementById("adminBtn");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const loginSubmit = document.getElementById("loginSubmit");
const registerSubmit = document.getElementById("registerSubmit");
const logoutBtn = document.getElementById("logoutBtn");

const authMessage = document.getElementById("authMessage");

const videoContainer = document.getElementById("videoContainer");
const searchInput = document.getElementById("searchInput");

const videoTitle = document.getElementById("videoTitle");
const videoDescription = document.getElementById("videoDescription");
const videoCategory = document.getElementById("videoCategory");
const thumbnailUrl = document.getElementById("thumbnailUrl");
const videoUrl = document.getElementById("videoUrl");

const saveVideoBtn = document.getElementById("saveVideoBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const adminMessage = document.getElementById("adminMessage");
const adminVideoList = document.getElementById("adminVideoList");

const videoModal = document.getElementById("videoModal");
const videoPlayer = document.getElementById("videoPlayer");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const closeModal = document.getElementById("closeModal");


// ======================================================
// PAGE NAVIGATION
// ======================================================

function showPage(page) {

  homePage.classList.add("hidden");
  accountPage.classList.add("hidden");
  adminPage.classList.add("hidden");

  page.classList.remove("hidden");
}


homeBtn.addEventListener("click", () => {
  showPage(homePage);
});


accountBtn.addEventListener("click", () => {
  showPage(accountPage);
});


adminBtn.addEventListener("click", () => {

  if (!isAdmin) {
    alert("Admin access नहीं है।");
    return;
  }

  showPage(adminPage);
  renderAdminVideos();
});


// ======================================================
// REGISTER
// ======================================================

registerSubmit.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    authMessage.textContent = "Email और password भरें।";
    return;
  }

  if (password.length < 6) {
    authMessage.textContent =
      "Password कम से कम 6 characters का होना चाहिए।";
    return;
  }

  try {

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    authMessage.textContent =
      "Account सफलतापूर्वक बन गया।";

  } catch (error) {

    authMessage.textContent =
      error.message;

  }

});


// ======================================================
// LOGIN
// ======================================================

loginSubmit.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    authMessage.textContent =
      "Email और password भरें।";
    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    authMessage.textContent =
      "Login सफल हुआ।";

  } catch (error) {

    authMessage.textContent =
      "Login failed: " + error.message;

  }

});


// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener("click", async () => {

  try {

    await signOut(auth);

    authMessage.textContent =
      "Logout हो गया।";

    showPage(homePage);

  } catch (error) {

    console.error(error);

  }

});


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (user) {

    accountBtn.textContent =
      user.email;

    logoutBtn.classList.remove("hidden");

    isAdmin =
      user.email.toLowerCase() ===
      OWNER_EMAIL.toLowerCase();

    if (isAdmin) {

      adminBtn.classList.remove("hidden");

    } else {

      adminBtn.classList.add("hidden");

    }

  } else {

    accountBtn.textContent =
      "Login";

    logoutBtn.classList.add("hidden");
    adminBtn.classList.add("hidden");

    isAdmin = false;

  }

  await loadVideos();

});


// ======================================================
// LOAD VIDEOS
// ======================================================

async function loadVideos() {

  videoContainer.innerHTML =
    `<div class="loading">Videos loading...</div>`;

  try {

    const q = query(
      collection(db, "videos"),
      orderBy("createdAt", "desc")
    );

    const snapshot =
      await getDocs(q);

    videos = [];

    snapshot.forEach((item) => {

      videos.push({
        id: item.id,
        ...item.data()
      });

    });

    renderVideos(videos);

    if (isAdmin) {
      renderAdminVideos();
    }

  } catch (error) {

    console.error(error);

    videoContainer.innerHTML =
      `<div class="loading">
        Videos load नहीं हो पाईं।
      </div>`;

  }

}


// ======================================================
// RENDER VIDEOS
// ======================================================

function renderVideos(list) {

  videoContainer.innerHTML = "";

  if (!list.length) {

    videoContainer.innerHTML =
      `<div class="loading">
        अभी कोई video उपलब्ध नहीं है।
      </div>`;

    return;

  }


  list.forEach((video) => {

    const card =
      document.createElement("div");

    card.className = "videoCard";


    const image =
      video.thumbnailUrl
        ? `<img src="${escapeHTML(video.thumbnailUrl)}" alt="">`
        : `<div class="videoPlaceholder">🎬</div>`;


    card.innerHTML = `

      ${image}

      <div class="videoCardContent">

        <h3>
          ${escapeHTML(video.title || "Untitled")}
        </h3>

        <p>
          ${escapeHTML(video.description || "")}
        </p>

        <span class="category">
          ${escapeHTML(video.category || "Other")}
        </span>

      </div>
    `;


    card.addEventListener("click", () => {

      openVideo(video);

    });


    videoContainer.appendChild(card);

  });

}


// ======================================================
// OPEN VIDEO
// ======================================================

function openVideo(video) {

  videoModal.classList.remove("hidden");

  videoPlayer.src =
    video.videoUrl || "";

  modalTitle.textContent =
    video.title || "";

  modalDescription.textContent =
    video.description || "";

}


// ======================================================
// CLOSE VIDEO
// ======================================================

closeModal.addEventListener("click", closeVideo);


videoModal.addEventListener("click", (event) => {

  if (event.target === videoModal) {
    closeVideo();
  }

});


function closeVideo() {

  videoPlayer.pause();

  videoPlayer.src = "";

  videoModal.classList.add("hidden");

}


// ======================================================
// SEARCH
// ======================================================

searchInput.addEventListener("input", () => {

  const text =
    searchInput.value
      .trim()
      .toLowerCase();


  const filtered =
    videos.filter((video) => {

      return (

        (video.title || "")
          .toLowerCase()
          .includes(text)

        ||

        (video.description || "")
          .toLowerCase()
          .includes(text)

      );

    });


  renderVideos(filtered);

});


// ======================================================
// CATEGORY
// ======================================================

document
  .querySelectorAll("[data-category]")
  .forEach((button) => {

    button.addEventListener("click", () => {

      const category =
        button.dataset.category;


      if (category === "all") {

        renderVideos(videos);
        return;

      }


      const filtered =
        videos.filter(
          (video) =>
            video.category === category
        );


      renderVideos(filtered);

    });

  });


// ======================================================
// ADD VIDEO
// ======================================================

saveVideoBtn.addEventListener(
  "click",
  async () => {

    if (!isAdmin) {

      adminMessage.textContent =
        "केवल Admin video जोड़ सकता है।";

      return;

    }


    const title =
      videoTitle.value.trim();

    const description =
      videoDescription.value.trim();

    const category =
      videoCategory.value;

    const thumbnail =
      thumbnailUrl.value.trim();

    const url =
      videoUrl.value.trim();


    if (!title || !url) {

      adminMessage.textContent =
        "Video का नाम और Video URL जरूरी है।";

      return;

    }


    try {

      saveVideoBtn.disabled = true;


      if (editingVideoId) {

        await updateDoc(
          doc(
            db,
            "videos",
            editingVideoId
          ),
          {
            title,
            description,
            category,
            thumbnailUrl: thumbnail,
            videoUrl: url,
            updatedAt: serverTimestamp()
          }
        );


        adminMessage.textContent =
          "Video update हो गई।";

      } else {

        await addDoc(
          collection(db, "videos"),
          {
            title,
            description,
            category,
            thumbnailUrl: thumbnail,
            videoUrl: url,
            likes: 0,
            comments: 0,
            subscribers: 0,
            createdAt: serverTimestamp()
          }
        );


        adminMessage.textContent =
          "Video successfully add हो गई।";

      }


      clearVideoForm();

      await loadVideos();

    } catch (error) {

      console.error(error);

      adminMessage.textContent =
        "Error: " + error.message;

    } finally {

      saveVideoBtn.disabled = false;

    }

  }
);


// ======================================================
// ADMIN VIDEO LIST
// ======================================================

function renderAdminVideos() {

  if (!isAdmin) return;

  adminVideoList.innerHTML = "";


  if (!videos.length) {

    adminVideoList.textContent =
      "अभी कोई video नहीं है।";

    return;

  }


  videos.forEach((video) => {

    const item =
      document.createElement("div");

    item.className =
      "adminVideoItem";


    item.innerHTML = `

      <strong>
        ${escapeHTML(video.title || "")}
      </strong>

      <div>

        <button class="editBtn">
          Edit
        </button>

        <button class="deleteBtn">
          Delete
        </button>

      </div>

    `;


    item
      .querySelector(".editBtn")
      .addEventListener(
        "click",
        () => editVideo(video)
      );


    item
      .querySelector(".deleteBtn")
      .addEventListener(
        "click",
        () => deleteVideo(video.id)
      );


    adminVideoList.appendChild(item);

  });

}


// ======================================================
// EDIT VIDEO
// ======================================================

function editVideo(video) {

  editingVideoId =
    video.id;

  videoTitle.value =
    video.title || "";

  videoDescription.value =
    video.description || "";

  videoCategory.value =
    video.category || "other";

  thumbnailUrl.value =
    video.thumbnailUrl || "";

  videoUrl.value =
    video.videoUrl || "";


  saveVideoBtn.textContent =
    "Update Video";

  cancelEditBtn.classList.remove(
    "hidden"
  );

  document
    .getElementById("formTitle")
    .textContent =
      "Video Edit करें";

}


// ======================================================
// CANCEL EDIT
// ======================================================

cancelEditBtn.addEventListener(
  "click",
  clearVideoForm
);


function clearVideoForm() {

  editingVideoId = null;

  videoTitle.value = "";
  videoDescription.value = "";
  videoCategory.value = "entertainment";
  thumbnailUrl.value = "";
  videoUrl.value = "";

  saveVideoBtn.textContent =
    "Add Video";

  cancelEditBtn.classList.add(
    "hidden"
  );

  document
    .getElementById("formTitle")
    .textContent =
      "नई Video जोड़ें";

}


// ======================================================
// DELETE VIDEO
// ======================================================

async function deleteVideo(id) {

  if (!isAdmin) return;


  const yes =
    confirm(
      "क्या आप इस video को delete करना चाहते हैं?"
    );


  if (!yes) return;


  try {

    await deleteDoc(
      doc(
        db,
        "videos",
        id
      )
    );


    await loadVideos();

  } catch (error) {

    console.error(error);

    alert(
      "Video delete नहीं हुई।"
    );

  }

}


// ======================================================
// BASIC HTML ESCAPE
// ======================================================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ======================================================
// START
// ======================================================

showPage(homePage);
loadVideos();

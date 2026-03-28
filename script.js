let profile = JSON.parse(localStorage.getItem("profile")) || {};
let stories = JSON.parse(localStorage.getItem("stories")) || [];

// LOAD ON START
window.onload = function () {
  if (Object.keys(profile).length > 0) {
    document.getElementById("setup").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadHistory();
  }
};

// SAVE PROFILE
function saveProfile() {
  profile = {
    gender: document.getElementById("gender").value,
    ethnicity: document.getElementById("ethnicity").value,
    career: document.getElementById("career").value
  };

  localStorage.setItem("profile", JSON.stringify(profile));

  document.getElementById("setup").style.display = "none";
  document.getElementById("app").style.display = "block";
}

// GENERATE STORY (USING BACKEND)
async function generateStory() {

  const prompt = `
You are writing a bedtime story for kids.

RULES:
- Use very simple words
- Make it fun, exciting, and emotional
- Use a DIFFERENT intro each time
- Do NOT use real copyrighted characters
- Keep it ONE short paragraph

Person:
- Gender: ${profile.gender || "not specified"}
- Ethnicity: ${profile.ethnicity || "not specified"}
- Career interest: ${profile.career || "not specified"}

FORMAT EXACTLY:

Story: (1 short paragraph)

Lesson: (1 simple sentence)

Action: (1 simple sentence)
`;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    console.log("API RESPONSE:", data); // helpful for debugging

    if (!res.ok) {
      throw new Error(data.error?.message || "API error");
    }

    const story = data.choices[0].message.content;

    // SHOW STORY
    document.getElementById("story").innerText = story;

    // SAVE STORY
    stories.push(story);
    localStorage.setItem("stories", JSON.stringify(stories));

    loadHistory();

  } catch (error) {
    console.error(error);
    document.getElementById("story").innerText =
      "Error generating story. Check your setup.";
  }
}

// LOAD HISTORY
function loadHistory() {
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";

  stories.forEach((story, index) => {
    historyDiv.innerHTML += `
      <div style="margin:10px; padding:10px; background:#fff; border-radius:10px;">
        <b>Story ${index + 1}</b>
        <p>${story}</p>
      </div>
    `;
  });
}

// OPEN PROFILE
function openProfile() {
  document.getElementById("profile").style.display = "block";

  document.getElementById("editGender").value = profile.gender || "";
  document.getElementById("editEthnicity").value = profile.ethnicity || "";
  document.getElementById("editCareer").value = profile.career || "";
}

// CLOSE PROFILE
function closeProfile() {
  document.getElementById("profile").style.display = "none";
}

// UPDATE PROFILE
function updateProfile() {
  profile.gender = document.getElementById("editGender").value;
  profile.ethnicity = document.getElementById("editEthnicity").value;
  profile.career = document.getElementById("editCareer").value;

  localStorage.setItem("profile", JSON.stringify(profile));

  closeProfile();
}
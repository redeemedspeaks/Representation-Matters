function saveProfile() {
  const race = document.getElementById("race").value;
  const gender = document.getElementById("gender").value;
  const career = document.getElementById("career").value;

  localStorage.setItem("profile", JSON.stringify({ race, gender, career }));

  document.getElementById("setup").style.display = "none";
  document.getElementById("app").style.display = "block";
}

// 🔑 create unique key per category combo
function getCategoryKey(profile) {
  return `shown_${(profile.race || "any")}_${(profile.gender || "any")}_${(profile.career || "any")}`;
}

async function generateStory() {
  const profile = JSON.parse(localStorage.getItem("profile") || "{}");

  const key = getCategoryKey(profile);

  let shownPeople = JSON.parse(localStorage.getItem(key) || "[]");
  let lastStyle = localStorage.getItem("lastStyle");

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        race: profile.race,
        gender: profile.gender,
        career: profile.career,
        shownPeople,
        lastStyle
      })
    });

    const data = await res.json();

    document.getElementById("story").innerText =
      data.story || "No story returned.";

    // ✅ Save per-category (THIS IS THE KEY FEATURE)
    if (data.person) {
      shownPeople.push(data.person);
      localStorage.setItem(key, JSON.stringify(shownPeople));
    }

    if (data.style) {
      localStorage.setItem("lastStyle", data.style);
    }

  } catch (err) {
    console.error(err);
    document.getElementById("story").innerText =
      "Something went wrong. Try again.";
  }
}

function saveProfile() {
  const race = document.getElementById("race").value;
  const gender = document.getElementById("gender").value;
  const career = document.getElementById("career").value;

  localStorage.setItem("profile", JSON.stringify({ race, gender, career }));

  document.getElementById("setup").style.display = "none";
  document.getElementById("app").style.display = "block";
}

async function generateStory() {
  const profile = JSON.parse(localStorage.getItem("profile") || "{}");

  let shownPeople = JSON.parse(localStorage.getItem("shownPeople") || "[]");
  let lastStyle = localStorage.getItem("lastStyle");

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

  document.getElementById("story").innerText = data.story;

  if (data.person) {
    shownPeople.push(data.person);
    localStorage.setItem("shownPeople", JSON.stringify(shownPeople));
  }

  if (data.style) {
    localStorage.setItem("lastStyle", data.style);
  }

  saveStory(data.story);
}

function saveStory(story) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.push(story);

  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  document.getElementById("history").innerHTML = history
    .map(s => `<p>${s}</p>`)
    .join("");
}

renderHistory();
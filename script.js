function getUsedPeople() {
  return JSON.parse(localStorage.getItem("usedPeople")) || [];
}
function setUsedPeople(list) {
  localStorage.setItem("usedPeople", JSON.stringify(list));
}
async function generateStory() {
  const race = document.getElementById("race").value.trim();
  const gender = document.getElementById("gender").value.trim();
  const career = document.getElementById("career").value.trim();
  const output = document.getElementById("output");

  if (!race && !gender && !career) {
    output.innerHTML = "Please fill in at least one field (e.g. Race: Black, Career: Filmmaker)";
    return;
  }
  output.innerHTML = "Loading... 🌙";
  let usedPeople = getUsedPeople();
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ race, gender, career, usedPeople })
    });
    if (!res.ok) {
      let errText;
      try { errText = await res.text(); } catch (e) { errText = "unknown"; }
      throw new Error(`API error: ${errText}`);
    }
    const data = await res.json();
    if (data.error) {
      output.innerHTML = data.error;
      return;
    }
    output.innerHTML = (data.story || "").replace(/\n/g, '<br>');
    // Extract name for anti-repeat (basic: match "First Last")
    const match = (data.story || "").match(/[A-Z][a-z]+ [A-Z][a-z]+/);
    if (match) {
      const name = match[0];
      if (!usedPeople.includes(name)) {
        usedPeople.push(name);
        setUsedPeople(usedPeople);
      }
    }
  } catch (err) {
    console.error(err);
    output.innerHTML = "Something went wrong:<br>" + err.message;
  }
}

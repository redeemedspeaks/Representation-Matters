async function generateStory() {
  const input = document.getElementById("input").value.trim();
  const output = document.getElementById("output");

  if (!input) {
    output.textContent = "Try: Black female inventor";
    return;
  }

  output.textContent = "Loading... 🌙";

  // Load used people from browser memory
  let usedPeople = JSON.parse(localStorage.getItem("usedPeople")) || [];

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...parseInput(input),
        usedPeople
      })
    });

    if (!res.ok) {
      throw new Error("API error");
    }

    const data = await res.json();

    if (data.error) {
      output.textContent = data.error;
      return;
    }

    const story = data.story;
    output.textContent = story;

    // Try to extract a name (first "First Last" match)
    const match = story.match(/[A-Z][a-z]+ [A-Z][a-z]+/);

    if (match) {
      const name = match[0];

      if (!usedPeople.includes(name)) {
        usedPeople.push(name);
        localStorage.setItem("usedPeople", JSON.stringify(usedPeople));
      }
    }

  } catch (err) {
    console.error(err);
    output.textContent = "Something went wrong. Try again.";
  }
}

/**
 * Flexible parser
 */
function parseInput(text) {
  const lower = text.toLowerCase();

  let race = "";
  let gender = "";
  let career = text;

  if (lower.includes("black")) race = "black";
  else if (lower.includes("latino") || lower.includes("hispanic")) race = "latino";
  else if (lower.includes("white")) race = "white";
  else if (lower.includes("asian")) race = "asian";

  if (lower.includes("male") || lower.includes("man")) gender = "male";
  else if (lower.includes("female") || lower.includes("woman")) gender = "female";

  return { race, gender, career };
}

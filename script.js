async function generateStory() {
  const input = document.getElementById("input").value.trim();
  const output = document.getElementById("output");

  if (!input) {
    output.textContent = "Try: Black female inventor";
    return;
  }

  output.textContent = "Loading... 🌙";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(parseInput(input))
    });

    if (!res.ok) {
      throw new Error("API error");
    }

    const data = await res.json();

    if (data.error) {
      output.textContent = data.error;
      return;
    }

    output.textContent = data.story;

  } catch (err) {
    console.error(err);
    output.textContent = "Something went wrong. Try again.";
  }
}

/**
 * Flexible parser (keeps your "type anything" feature)
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

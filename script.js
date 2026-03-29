async function generateStory() {
  const input = document.getElementById("input").value.trim();
  const output = document.getElementById("output");

  if (!input) {
    output.textContent = "Enter something like: black male actor";
    return;
  }

  output.textContent = "Loading...";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        race: extractRace(input),
        gender: extractGender(input),
        career: extractCareer(input)
      })
    });

    const data = await res.json();

    if (data.error) {
      output.textContent = data.error;
    } else {
      output.textContent = data.story;
    }

  } catch (err) {
    output.textContent = "Something went wrong.";
  }
}

/**
 * Simple parsing helpers
 */
function extractRace(text) {
  const lower = text.toLowerCase();

  if (lower.includes("black")) return "black";
  if (lower.includes("latino") || lower.includes("hispanic")) return "latino";
  if (lower.includes("white")) return "white";
  if (lower.includes("asian")) return "asian";

  return "";
}

function extractGender(text) {
  const lower = text.toLowerCase();

  if (lower.includes("male")) return "male";
  if (lower.includes("female")) return "female";

  return "";
}

function extractCareer(text) {
  const lower = text.toLowerCase();

  if (lower.includes("actor")) return "actor";
  if (lower.includes("youtuber")) return "youtuber";
  if (lower.includes("singer")) return "singer";
  if (lower.includes("athlete")) return "athlete";

  return text; // fallback
}

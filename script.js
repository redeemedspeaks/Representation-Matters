async function generateStory() {
  const input = document.getElementById("input").value.trim();
  const output = document.getElementById("output");

  if (!input) {
    output.textContent = "Please enter something like: black female actor";
    return;
  }

  output.textContent = "Loading...";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: input })
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

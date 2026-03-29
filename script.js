async function generateStory() {
  const input = document.getElementById("input").value;
  const output = document.getElementById("output");

  if (!input) return;

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

    output.textContent = data.story;

  } catch (err) {
    output.textContent = "Something went wrong.";
  }
}
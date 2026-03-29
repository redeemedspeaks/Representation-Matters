async function generateStory() {
  const race = document.getElementById("race").value;
  const gender = document.getElementById("gender").value;
  const career = document.getElementById("career").value;

  const output = document.getElementById("output");

  output.innerHTML = "Generating...";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        race,
        gender,
        career,
        sessionId: "user-session-1"
      })
    });

    const text = await res.text();

    console.log("RAW RESPONSE:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      output.innerHTML = "Invalid response from server.";
      return;
    }

    if (!res.ok) {
      output.innerHTML = data.error || "Error occurred";
      return;
    }

    output.innerHTML = `
      <h2>${data.title}</h2>
      <p>${data.story}</p>
    `;

  } catch (err) {
    console.error(err);
    output.innerHTML = "Network error.";
  }
}

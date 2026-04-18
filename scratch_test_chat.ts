async function testChat() {
  try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello!" }]
      })
    });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", json.choices?.[0]?.message?.content);
  } catch (err) {
    console.error(err);
  }
}
testChat();

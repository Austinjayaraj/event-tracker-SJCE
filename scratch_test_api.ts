async function fetchLocally() {
  try {
    const res = await fetch("http://localhost:5000/api/unstop-hackathons");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body length:", text.length, "Content:", text.slice(0, 100));
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON Array Length:", json.length);
    } catch {}
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fetchLocally();

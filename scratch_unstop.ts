async function fetchUnstop() {
  const res = await fetch("https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&page=1&per_page=1", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.data.data[0], null, 2));
}
fetchUnstop();

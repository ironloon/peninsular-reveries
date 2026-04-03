const taglines = [
  'This page wandered off to find hidden letters.',
  'Even the best spellers get lost sometimes.',
  'Nothing here but vowels and empty space.',
  "The page you're looking for is in another puzzle.",
]

const el = document.getElementById('tagline')
if (el) {
  el.textContent = taglines[Math.floor(Math.random() * taglines.length)]
}

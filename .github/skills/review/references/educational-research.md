# Educational Research Reference

Use this reference when a game has learning objectives, age-appropriate content, or difficulty progression. Ground the design in published research rather than intuition.

## Primary Sources

### Common Core State Standards (CCSS, 2010)
Grade-by-grade math content expectations adopted by most U.S. states.
- **K–2**: Addition and subtraction concepts and skills; understanding quantities and whole numbers.
- **Grades 3–5**: Multiplication and division of whole numbers; introduction to fractions.
- Use CCSS to establish number ranges per difficulty level (e.g., "addition within 10" for Kindergarten, "within 20" for Grade 1).
- Source: http://www.corestandards.org/Math/

### NCTM Principles and Standards for School Mathematics (2000)
Broad standards from the National Council of Teachers of Mathematics.
- **Pre-K–2**: Count with understanding; develop sense of whole numbers; connect number words to quantities.
- **Grades 3–5**: Develop fluency with basic number combinations for multiplication and division; understand meanings of operations.
- Source: https://www.nctm.org/standards/

### NCTM Curriculum Focal Points (2006)
More focused than NCTM 2000 — identifies the most important mathematical topics per grade through Grade 8.
- **Kindergarten**: Whole numbers to represent quantities.
- **Grade 1**: Addition and subtraction within 20.
- **Grade 2**: Base-ten understanding; multi-digit addition.
- **Grade 3**: Multiplication and division concepts.
- Source: https://www.nctm.org/focalpoints/

### National Mathematics Advisory Panel — "Foundations for Success" (2008)
U.S. Department of Education report on preparing students for algebra.
- Key finding: **fluency with basic arithmetic is the critical gateway to algebra**.
- Endorsed automatic recall of addition/subtraction facts through 18 and multiplication/division facts.
- Recommended focused, coherent progressions over broad coverage.
- Source: https://www2.ed.gov/about/bdscomm/list/mathpanel/report/final-report.pdf

### Clements & Sarama Learning Trajectories (2004, 2009)
Research-based developmental progressions for early mathematics.
- Counting develops: rote sequence → one-to-one correspondence → cardinality → counting on → skip counting.
- Typical milestones:
  - Ages 3–5: Cardinality understanding.
  - Kindergarten: Counting to 10; number sense with small quantities.
  - Grade 1: Addition within 10; mental strategies for sums.
- Source: Clements, D. H., & Sarama, J. (2004). *Learning trajectories in mathematics education*. Mathematical Thinking and Learning, 6(2), 81–89.

---

## Guidelines for Implementation

### Citing research in code
When defining difficulty-level constants, add a comment citing the source:
```ts
// Level 1: addition within 10 — CCSS K.OA, NCTM Focal Points Grade 1
const LEVEL_1_MAX = 10;

// Level 2: addition within 20 — CCSS 1.OA, NMAP fluency target
const LEVEL_2_MAX = 20;
```

### Adding a new educational area
Before defining difficulty ranges for a new topic, confirm the grade-level alignment using **at least two** of the sources above. Document the sources and grade levels in the code and in this file if the topic is new.

### Number range language
Prefer **"within N"** (matching standards language), e.g.:
- "addition within 10" not "numbers up to 10"
- "multiplication facts within 100" not "times tables to 10"

### Progression granularity
- **Level 1** must be accessible to the youngest intended audience with no prior instruction assumed.
- Each level step should correspond to roughly one grade level of progression per the cited standards.
- Avoid difficulty jumps that span more than one grade level within a single level step.
- **Level 3** should reach the grade-level standard for the target age group.

### Age grounding
| Level | Rough target age | Example anchor standard |
|-------|-----------------|------------------------|
| 1     | Age 5–6 (K)     | CCSS K.OA — add within 5 |
| 2     | Age 6–7 (Gr 1)  | CCSS 1.OA — add/subtract within 20 |
| 3     | Age 7–8 (Gr 2)  | CCSS 2.OA — fluency within 20; 2.NBT multi-digit |
| 4     | Age 8–9 (Gr 3)  | CCSS 3.OA — multiplication/division within 100 |

These are anchors, not hard requirements. Adjust if the game's audience is narrower.

---

## Reading / Phonics Research

### National Reading Panel (2000)
U.S. Department of Health and Human Services report identifying five pillars of effective reading instruction:
1. **Phonemic awareness** — understanding that spoken words are made of individual sounds
2. **Phonics** — mapping sounds to written letters
3. **Fluency** — reading with speed, accuracy, and expression
4. **Vocabulary** — knowing word meanings
5. **Comprehension** — understanding what is read

Research finding: systematic phonics instruction produces stronger decoding outcomes than whole-language approaches.
Source: https://www.nichd.nih.gov/sites/default/files/publications/pubs/nrp/Documents/report.pdf

### Common Core State Standards — Foundational Reading (CCSS.ELA-LITERACY.RF)
Grade-by-grade reading foundational skills, directly governing decodable-word progression.
- **K.RF.3**: Know and apply grade-level phonics — short vowels in CVC words, common consonant digraphs
- **1.RF.3**: Decode regularly spelled one-syllable words; know long-vowel patterns (CVCe, vowel teams)
- **2.RF.3**: Decode regularly spelled two-syllable words; recognize common prefixes/suffixes
- **3.RF.3**: Read multi-syllable words; recognize and read grade-appropriate irregularly spelled words
Source: http://www.corestandards.org/ELA-Literacy/RF/

### Dolch Sight Words
220 high-frequency function words organized by grade level (Edward Dolch, 1948). These words account for 50–75% of words encountered in children's reading material and are typically memorized on sight because many resist phonetic decoding.
- **Pre-Primer**: ~40 words — the, a, and, to, I, you, it, he …
- **Primer**: ~52 words — all, am, are, at, ate, be, black …
- **Grade 1**: ~41 words — after, again, an, ask, by, could …
- **Grade 2**: ~46 words — always, around, because, been, bring …
- **Grade 3**: ~41 words — about, better, bring, carry, clean …

### Fry Instant Words
The 1,000 most frequent words in English text, organized in bands of 100 (Edward Fry, 1957, revised 1980). The first 300 cover approximately 65% of all written material.
- Bands 1–100: highest-frequency function words
- Bands 101–200: expansion of function and common content words
- Bands 201–300: increasing content-word presence

---

## Phonemic Complexity Progression

Use these tiers to assign decodable words to the appropriate difficulty level in word games.

| Tier | Pattern | Examples | Grade Alignment |
|------|---------|----------|----------------|
| 1 | CVC (short vowel) | cat, sun, dog, bug | K–Grade 1 |
| 1 | High-frequency sight words | the, and, you, for | K–Grade 1 |
| 2 | CCVC / CVCC (initial/final blends) | frog, star, jump, sand | K–Grade 1 |
| 2 | Digraphs (sh, ch, th, wh, ph) | ship, chat, thin, whale | K–Grade 1 |
| 3 | CVCe (silent-e long vowel) | cake, bike, home, cute | Grade 1–2 |
| 3 | Vowel teams (ee, oa, ai, ea, oo) | tree, boat, rain, bead, moon | Grade 1–2 |
| 4 | R-controlled vowels (ar, er, ir, or, ur) | star, tiger, bird, storm, burn | Grade 2–3 |
| 4 | Simple 2-syllable words | cabin, happy, jelly, magic | Grade 2–3 |
| 5 | Complex multi-syllable words | garden, planet, castle, rocket | Grade 3+ |
| 5 | Complex consonant clusters + fluent vocab | crisp, ghost, glare, grace | Grade 3+ |

### Word List Sources
- **Dolch Sight Words**: 220 words organized by grade (Pre-Primer through Grade 3) — high-frequency functional words
- **Fry Instant Words**: 1,000 most frequent words in English text, organized in bands of 100
- **CCSS K.RF / 1.RF / 2.RF / 3.RF**: Defines expected decodable patterns by grade
- **National Reading Panel (2000)**: Five pillars — phonemic awareness, phonics, fluency, vocabulary, comprehension

### Age-Appropriate Content Guidelines (Word Games)
- Use concrete, imageable nouns (words a child can picture): cat, sun, tree, cake
- Avoid abstract concepts for early tiers (love, hope, anger — not appropriate for Tier 1–2)
- Avoid homographs that could confuse (bark = tree vs. dog sound)
- Use universal vocabulary: words children encounter regardless of cultural background
- No violent, scary, or body-related terms that create discomfort

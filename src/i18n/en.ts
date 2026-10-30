/**
 * EN — source of truth for every client-facing string.
 *
 * Rich copy uses a tiny token set: [[em]]…[[/em]], [[b]]…[[/b]], [[br]].
 * Placeholders use {name}; plural forms live next to each other as .one/.few/.many.
 *
 * Non-copy data (ids, prices, colors, frequencies, diffs) lives in
 * src/content/data.ts so the dictionaries stay language-only.
 */

export const en = {
  meta: {
    title: "HUNCH — AI-native web studio",
    description:
      "HUNCH is a small creative web studio for AI-native products. We design and build LLM interfaces, RAG and agent workflows, evals and guardrails, prototypes and production front ends.",
    ogTitle: "HUNCH — AI-native products, built by hand",
    ogDescription:
      "A creative web studio for LLM products: interface, intelligence, data, reliability. A fictional studio, built as an interactive issue.",
  },

  common: {
    skip: "Skip to the plates",
    close: "Close",
    reset: "Reset",
    copy: "Copy",
    copied: "Copied ✓",
    remove: "Remove",
    of: "of",
    plate: "Plate",
    weeks: "wk",
    bar: "bar",
  },

  plates: {
    signal: { label: "The Signal", short: "The Signal", note: "a studio for AI-native products" },
    bin: { label: "The Bin", short: "The Bin", note: "prototypes we killed" },
    patch: { label: "The Patch Bay", short: "The Patch Bay", note: "what we build" },
    fugue: { label: "The Fugue", short: "The Fugue", note: "how the work moves" },
    ledger: { label: "The Ledger", short: "The Ledger", note: "three ways to start" },
    seance: { label: "The Séance", short: "The Séance", note: "what clients say" },
    bench: { label: "The Bench", short: "The Bench", note: "the site is the demo" },
    signoff: { label: "Sign-Off", short: "Sign-Off", note: "tell us what you’re making" },
  },

  chrome: {
    boot: {
      printing: "PRINTING · ISSUE 03",
      warming: "Warming the ink",
      inks: "3 inks / bone stock",
      press: "Press Nº 03 · Two desks · One kettle",
      soundOff: "Sound off. Cursor on.",
      skip: "Skip the ceremony ↗",
    },
    dock: {
      plates: "Plates",
      plateAria: "Plate {no}: {label}",
      previous: "Previous plate",
      next: "Next plate",
      settings: "Settings",
      settingsAria: "Settings: sound, music and language",
      settingsTitle: "Sound, music and language",
      panelHead: "Settings / audio & language",
      sound: "Sound",
      music: "Music",
      language: "Language",
      english: "English",
      russian: "Русский",
      panelNote: "Interface sounds · HUNCH FM",
      ink: "INK",
      inkAria: "Toggle ink trail",
      inkTitle: "Leave a trail of ink with the cursor",
      rot: "ROT",
      fm: "FM 87.6",
      plateNo: "PL.",
      of: "/ 07",
    },
    rails: {
      left: "Software by feel — issue 03",
      right: "Live from the studio",
    },
    next: {
      label: "Next / {no}",
      aria: "Next: {no} {label}",
    },
    cursor: {
      openLine: "OPEN A LINE",
      evidence: "EVIDENCE",
      dragFilm: "DRAG THE FILM",
      readAutopsy: "READ THE AUTOPSY",
      flipBack: "FLIP BACK",
      cutCable: "CUT THE CABLE",
      dragNeedle: "DRAG THE NEEDLE",
      turnDial: "TURN THE DIAL",
      misprint: "MISPRINT",
      turnPage: "TURN THE PAGE",
      dragPoke: "DRAG / POKE",
      stampIt: "STAMP IT",
      unstamp: "UNSTAMP",
      playMovement: "PLAY THIS MOVEMENT",
      clearSolo: "CLEAR SOLO",
      removePatch: "REMOVE PATCH",
      openCase: "OPEN THE CASE",
      closeCase: "CLOSE THE CASE",
    },
  },

  signal: {
    masthead: {
      tagline: "AI-native products, built by hand",
      issue: "Issue 03 — The Feeling Issue — Winter",
      location: "Rotterdam / 51.92°N",
      strip1: "[[b]]Two desks[[/b]] · One kettle · No decks",
      strip2: "Est. 2023 · Independent since lunch",
      studioTime: "Studio time",
      cet: "CET",
    },
    eyebrow: {
      plate: "Plate 00",
      section: "The Signal",
      live: "Live",
    },
    titleTop: "SOFTWARE",
    titleBy: "by",
    titleBottom: "FEEL",
    micro: "Accepting one AI product build for March · Two desks · Zero decks",
    start: "Start a project",
    contents: {
      aria: "Contents",
      label: "Contents",
      note: "Eight plates / read in any order",
    },
    lede: "HUNCH is a two-person web studio for AI-native products. We start with the feeling in the room, then build the smallest thing that proves it — usually in six to ten weeks.",
    body: "Most software is assembled. Ours is tuned. We design the interface, the LLM layer and the seams between them: fewer screens, clearer states, copy that sounds human. [[b]]If a feature doesn’t change how the product feels, we don’t ship it.[[/b]]",
    footnote: "Not a platform. A studio. You can tell by how long people stay.",
    cta1: "Start a project",
    cta2: "See what we kill",
    stamp: "Open for one good hunch",
    readouts: [
      {
        label: "Current obsession",
        value: "the sound of a door",
        small: "recorded on a Tuesday, 04:12",
      },
      { label: "Next intake", value: "March — 2 slots", small: "one prototype, one build" },
      {
        label: "Average first loop",
        value: "72 hours",
        small: "brief to something you can click",
      },
      { label: "Kettle", value: "on", small: "since 08:12, no complaints" },
    ],
    tickerTag: "NOW IN THE STUDIO",
    ticker: [
      "an LLM assistant that cites its sources",
      "a RAG search that admits when it doesn’t know",
      "an eval suite that fits on one page",
      "a checkout that ends in one thumb",
      "a prototype that survives a Monday",
      "a design system for a moving product",
      "a guardrail that reads like a person",
      "a bug that only happens on Tuesdays",
    ],
    marginalia: "The brief is usually wrong",
    organism: {
      hudTl: "FIG. 00 / THE HUNCH",
      hudMesh: "MESH Nº 114 · AZ",
      hudStock: "3 INKS / BONE STOCK",
      hudMove: "MOVE THE POINTER",
      caption:
        "A specimen, not an ornament. It doesn’t know what it is. [[em]]Drag it. Poke it.[[/em]]",
    },
  },

  bin: {
    eyebrow: { plate: "Plate 01", section: "The Bin", evidence: "Evidence" },
    titleLine1: "Half our work",
    titleLine2: "is [[em]]deleted.[[/em]]",
    lede: "A studio that only shows the finished thing is lying to you. Below: six versions we built, tested and killed. Flip one over and read the autopsy.",
    aside: "The bin is the most honest page on this site. It is also the only one with a lamp.",
    stamp: "No survivors",
    footnote: "Specimens 001–006 / kept at room temperature / do not feed",
    table: "Light table / 6 specimens / one lamp",
    hint: "Drag ↔ or click a card to flip",
    prev: "Previous specimen",
    next: "Next specimen",
    card: {
      tape: "Do not revive",
      no: "BIN Nº",
      open: "Open the autopsy",
      autopsy: "Autopsy /",
      survived: "What survived",
      back: "Return to the bin",
      end: "End of drawer",
      endCopy: "There are more. They’re in the actual drawer, under the kettle.",
      bar: "Specimen 001 — 006",
      aria: "{title}, {version}. Flip to read the autopsy.",
    },
    items: {
      orb: {
        title: "The Orb",
        status: "Killed",
        life: "after 11 days",
        brief:
          "A homepage that was one continuous 3D orb. You scrolled by rotating it. Everyone said “wow”. Nobody could find the pricing.",
        autopsy:
          "We fell in love with the interaction and forgot the job. A homepage has a job. Ours had a hobby. We kept the orb — you’re looking at its descendant — and gave it a caption, a scroll bar, and a door.",
        survived: "the organism; the idea that a site can have a body",
        mark: "KILLED",
      },
      pricing: {
        title: "Ambient Pricing",
        status: "Killed",
        life: "by legal",
        brief:
          "Prices that moved with demand, weather and Mercury. Beautiful spreadsheet. Unreadable invoice. Users described it as “a vibe” and “a threat”.",
        autopsy:
          "Feel is not the same as fairness. Pricing is a promise, not an atmosphere. We now write prices in one font, one size, and never animate them. The weather feed still runs in the studio, for morale.",
        survived: "the ticket metaphor; a price you can hold",
        mark: "KILLED",
      },
      cursor: {
        title: "Cursor: The Character",
        status: "Haunting",
        life: "still in the drawer",
        brief:
          "Our cursor had a backstory, a gait and a small hat. After forty minutes it got tired. So did the users.",
        autopsy:
          "Charm has a budget. We spent it on the cursor and had none left for the buttons. The hat is in the drawer. The gait survived as the lag on this site’s registration mark — slower than you’d expect, on purpose.",
        survived: "the registration-mark cursor you’re using right now",
        mark: "HAUNTING",
      },
      onboarding: {
        title: "The Nine-Minute Onboarding",
        status: "Killed",
        life: "by the clock",
        brief:
          "A guided breathing exercise before account creation. Retention: up. Signups: down 91%. Support tickets: “is this a test?”",
        autopsy:
          "We optimised the feeling after onboarding, not the feeling of onboarding. People don’t want to be calmed into a product; they want to be let in. The first run is now nine seconds and one good question.",
        survived: "a single opening question; everything else waits",
        mark: "KILLED",
      },
      sound: {
        title: "Navigation by Sound Only",
        status: "Retired",
        life: "one user cried",
        brief:
          "Five tones, one per section. You learned the site by ear. Genuinely faster. Also unusable on a train, in an office, or near a baby.",
        autopsy:
          "A modality is not an interface. We still hide one tone in the site — try the fugue’s sound toggle — but we stopped making ears mandatory. The user who cried sent us a postcard.",
        survived: "the optional tone in The Fugue; a postcard on the wall",
        mark: "ONE TEAR",
      },
      footer: {
        title: "The Infinite Footer",
        status: "Running",
        life: "somewhere, still",
        brief:
          "A footer that generated a new row every time you reached the bottom. It was “endless brand”. It was also 4,000 words about our values.",
        autopsy:
          "We mistook stamina for substance. Nobody has that much attention. We cut it to a colophon, a barcode and one good sentence. This card is the last row. You’re welcome.",
        survived: "the colophon; the barcode; this sentence",
        mark: "STILL ON",
      },
    },
  },

  patch: {
    eyebrow: { plate: "Plate 02", section: "The Patch Bay", caps: "Capabilities" },
    title1: "Everything is",
    title2: "a [[em]]cable.[[/em]]",
    lede: "A product is a connection between a need and a system. Pull a cable and read the spec. If the patch is wrong, the spec is wrong — that’s the point.",
    stamp: "Need in / system out",
    footnote: "We do this on a call, with worse handwriting. 4 in · 4 out · 16 possible paths.",
    presets: "Presets",
    clear: "Pull everything",
    cables: "{count}/16 cables",
    board: {
      need: "Need / in",
      system: "System / out",
      flowTop: "need → system",
      watermark: "patch",
      flowBottom: "no. 02 / live",
      armedNeed: "{label} armed — now pick a system",
      armedSystem: "{label} armed — now pick a need",
      connected: "Connected.",
      select: "Select to patch.",
      needAria: "Need: {label}. {state}",
      systemAria: "System: {label}. {state}",
    },
    receipt: {
      head: "Output / spec sheet",
      form: "Form PB-02",
      empty: "No cables. The board is quiet.",
      emptyHint: "Drag from a need to a system, or click one socket then the other.",
      patch: "Patch /",
      load: "Feeling is load-bearing",
      noteQuote: "All systems are optional. [[em]]All feelings are load-bearing.[[/em]]",
      noteFoot:
        "The spec is generated from the cable, not from a deck. It is also how we quote. If a line doesn’t make you feel something, cut the cable.",
      take: "Take it to the bench",
      copy: "Copy the spec",
      keys: "Keyboard: tab to a socket, enter to arm it, enter on the other side to patch.",
    },
    needs: {
      return: { label: "A Reason to Return", sub: "retention" },
      path: { label: "A Shorter Path", sub: "friction" },
      pulse: { label: "A Pulse", sub: "emotion" },
      life: { label: "A Second Life", sub: "reuse" },
    },
    systems: {
      interface: { label: "Interface", sub: "screens · states · words" },
      intelligence: { label: "Intelligence", sub: "LLM · RAG · agents" },
      data: { label: "Data", sub: "retrieval · memory · truth" },
      reliability: { label: "Reliability", sub: "evals · guardrails · cost" },
    },
    specs: {
      "return:interface":
        "a saved state that remembers the last useful thing — not a notification.",
      "return:intelligence":
        "an assistant that gets better with every visit because it remembers the project, not the user.",
      "return:data": "a small, honest memory: what changed, what mattered, what to bring back.",
      "return:reliability":
        "an eval that measures returning users, not clicks; a reason you can defend.",
      "path:interface": "one screen that names the next action, and a back button that never lies.",
      "path:intelligence":
        "a prompt layer that asks one good question instead of five forms.",
      "path:data": "retrieval that answers from your data, and says when it can’t.",
      "path:reliability": "a latency and cost budget the product can actually meet.",
      "pulse:interface": "a surface with a temperature: paper, ink, one loud thing at a time.",
      "pulse:intelligence":
        "an assistant with a voice and boundaries — useful, not performative.",
      "pulse:data": "a citation, a source, a trace: proof that the feeling is not a guess.",
      "pulse:reliability":
        "guardrails that read like a person and fail like a person, not a robot.",
      "life:interface": "a second surface for the same product: admin, archive, after-hours.",
      "life:intelligence": "agents that keep working after the demo: scoped, observable, reversible.",
      "life:data": "one source of truth, many costumes: content that outlives the campaign.",
      "life:reliability":
        "an eval suite that grows with the product and catches regressions before users do.",
    },
    presetsList: {
      house: "The House",
      rescue: "The Rescue",
      showpiece: "The Showpiece",
    },
    specText: {
      empty: "HUNCH / patch sheet / no cables connected.",
      header: "HUNCH / patch sheet",
      footer: "All systems optional. All feelings load-bearing.",
    },
  },

  fugue: {
    eyebrow: { plate: "Plate 03", section: "The Fugue", how: "How it’s made" },
    title1: "Five movements,",
    title2: "[[em]]overlapping.[[/em]]",
    lede: "A build doesn’t move in a straight line. Neither does a fugue. Drag the needle: several things are always happening at once — listening, looping, lashing, lifting, staying. One subject, [[b]]F–A–C–B♭–A–G[[/b]], enters five times: stretched, looped, cut backwards, harmonised, then slowed until the last note gives up.",
    meta: {
      duration: "Duration / 25.6 sec",
      tempo: "Tempo / ♩ = 75, 8 bars",
      key: "Key / F major, one borrowed E♭",
      form: "Form / five entries",
    },
    labelsHead: "Movement",
    rulerLabel: "weeks",
    labelsFoot: "tap a movement to hear it",
    timelineAria: "Score needle, in weeks",
    timelineValue: "week {week} of {total}",
    playhead: "t + {week} wk",
    stages: {
      listen: {
        name: "Listen",
        weeks: "WK 0—2",
        voice: "Felt piano · the subject stretched · discovery",
        statement: "We sit with the problem until it stops being polite.",
        detail:
          "Two calls, one long walk, a shared document nobody performs in. We listen for the sentence you keep repeating when you think no one is scoring it. That sentence is the brief.",
        deliverable: "A one-page brief, success metrics, and a list of what not to build.",
      },
      loop: {
        name: "Loop",
        weeks: "WK 0—3",
        voice: "Muted plucks · the subject on repeat · prototype",
        statement: "A version exists before the deck does.",
        detail:
          "Seventy-two hours from brief to a thing in your hands. Ugly on purpose. Clickable. We test it with three people who aren’t you, then with you. The loop is the argument.",
        deliverable: "A working prototype. Real copy. A list of what to kill.",
      },
      lash: {
        name: "Lash",
        weeks: "WK 3—7",
        voice: "Saw bass and ticks · the subject backwards · hardening",
        statement: "We tie the thing to reality until it holds.",
        detail:
          "Real data, real edge cases, real load. Design and build happen in the same room, in the same file. The LLM layer gets the same treatment: retrieval, prompts, evals, guardrails, latency and cost.",
        deliverable:
          "A product, not a prototype. Staging access. An eval dashboard. No surprises in the last week.",
      },
      lift: {
        name: "Lift",
        weeks: "WK 5—7",
        voice: "Bells and an open fifth · the subject harmonised · launch",
        statement: "Ship it, then watch faces.",
        detail:
          "We launch with a soft room, not a countdown. Then we sit and watch five people use it. What they don’t notice is the design. What they linger on is the work. We write the next fix list by ear.",
        deliverable:
          "A launch. A short film of the first session. A fix list written by ears, not tickets.",
      },
      lull: {
        name: "Lull",
        weeks: "WK 7—∞",
        voice: "Warm pad · the subject retrograded · care",
        statement: "We stay, quietly, for a month of Tuesdays.",
        detail:
          "No dashboard, no monthly review theatre. One standing hour a week and a line that is always open. Small corrections while they are still small. Then we leave you a tidy repo and permission to move on.",
        deliverable: "A standing date. A tidy repo. Permission to move on.",
      },
    },
    controls: {
      play: "Play the fugue",
      stop: "Stop",
      playTitle: "Play the whole piece: five voices entering where their weeks begin",
      soundOn: "Sound on",
      soundOff: "Sound off",
      reset: "Reset",
    },
    status: {
      auditionAll: "Auditioning — all five movements, overlapping",
      auditionOne: "Auditioning — {name}",
      nowSounding: "Now sounding — {count} of 5 movements",
      roomQuiet: "The room is quiet.",
      moveNeedle: "Move the needle into a phrase.",
    },
    youGet: "You get /",
    foot: {
      quote: "You can’t schedule taste. [[em]]You can leave room for it.[[/em]]",
      footnote:
        "The score is honest: nothing starts after the previous thing ends. We overlap because attention does. Sound is optional; the feeling isn’t.",
      stamp: "By ear",
    },
  },

  ledger: {
    eyebrow: { plate: "Plate 04", section: "The Ledger", ways: "Ways in" },
    title1: "Three ways",
    title2: "[[em]]in.[[/em]]",
    lede: "We sell time, not packages. No feature grids, no “contact us for pricing”. Three ways to have us — same hands, same hours, same refusal to call it a solution.",
    meta: {
      prices: "Prices in EUR / excl. VAT",
      deposit: "Deposit 50% / balance on ship",
      seats: "Seats are metaphorical",
      models: "Model usage billed at cost",
    },
    desk: {
      open: "Box office / open 09:00—18:00 CET",
      book: "Ticket book Nº 04 / three stubs",
      hint: "Click a ticket to stamp it",
    },
    tickets: {
      sprint: {
        mode: "Steerage",
        name: "The Sprint",
        duration: "2 weeks",
        priceNote: "flat · excl. VAT",
        brief:
          "One surface, one loop, one ship. For the product that is almost right and knows it.",
        includes: [
          "Discovery call + a one-page brief",
          "One 72-hour loop, ugly on purpose",
          "One shipped surface, polished by ear",
          "Two weeks of aftercare, no ticket theatre",
        ],
        bestFor: "a product with a feeling that’s slightly off.",
        note: "Standing room. Fast. No seatbelts.",
      },
      build: {
        mode: "Cabin",
        name: "The Build",
        duration: "6—10 weeks",
        priceNote: "fixed scope · excl. VAT",
        brief:
          "A whole product, from hunch to launch. For the blank page with a budget and a date.",
        includes: [
          "Everything in the sprint, plus:",
          "Full interface: screens, states, words",
          "LLM layer: retrieval, prompts, evals, guardrails",
          "Build: data, logic, plumbing",
          "A motion and sound pass",
          "Launch week + a thirty-day lull",
        ],
        bestFor: "a hunch, a blank page, and a date.",
        note: "Window seat. Meals included. We bring the maps.",
      },
      date: {
        mode: "Bridge",
        name: "The Standing Date",
        duration: "monthly · 3 mo min",
        priceNote: "per month · excl. VAT",
        brief:
          "A studio on a leash. For the team that wants taste on tap without a hiring round.",
        includes: [
          "Two days a week with us",
          "A line that is always open",
          "One loop per month, on anything",
          "First refusal on the big things",
        ],
        bestFor: "you want taste on tap without the payroll.",
        note: "The bridge. You can see where we’re going. We can see where you are.",
      },
    },
    ticket: {
      seat: "Seat {seat}",
      bestForLabel: "Best for /",
      transferable: "Transferable · non-refundable",
      admitted: "Admitted",
      vertical: "Hunch · Admit one",
      aria: "{mode}, {name}, {duration}, {price}. Select this ticket.",
    },
    summary: {
      label: "Selected ticket",
      empty: "None. The box office is open.",
      emptyMeta: "Pick a stub above — the stamp is real, the seat is a metaphor.",
      take: "Take this ticket",
    },
    foot: {
      terms:
        "Tickets are transferable. Deposits are 50%. Refunds are not. Invoices are boring on purpose.",
      footnote:
        "Payment plans exist. So does barter, occasionally, if it’s interesting. We have never used the word “synergy” in a deliverable.",
      stamp: "Prices are real",
    },
  },

  seance: {
    eyebrow: { plate: "Plate 05", section: "The Séance", transmissions: "Transmissions" },
    title1: "Six frequencies,",
    title2: "[[em]]some static.[[/em]]",
    lede: "Turn the dial. Six field notes from fictional teams we’ve worked with — lightly edited, never polished into a case study. The static is real. The names are not.",
    onAir: "On air",
    receiver: "Receiver Nº 05 / HUNCH FM / Stereo",
    dial: {
      aria: "Client channel",
      label: "drag / scroll arrows",
      value: "{freq} FM, {station}",
      prev: "Previous channel",
      next: "Next channel",
      scan: "Scan ▶",
      stop: "■ Stop",
    },
    readout: {
      signal: "Signal {strength}%",
      station: "Station {no}",
      mhz: "MHz",
    },
    head: { model: "Hunch receiver / model 05", fm: "FM · Stereo" },
    transmission: {
      locked: "Signal locked",
      sideA: "Side A",
      sideB: "Side B",
      edited: "Transcript lightly edited for length",
      frequency: "Frequency {freq}",
      channels: "Channels",
    },
    channels: {
      scheduler: {
        station: "The Scheduler",
        quote:
          "We asked for a dashboard. They gave us a drawer that slides out when you need it. Nobody has opened the old dashboard since.",
        who: "M.",
        role: "founder / a scheduling tool",
      },
      freight: {
        station: "The Freight Co.",
        quote:
          "The invoice said “one (1) loop, plus feelings.” I signed it without reading the rest. The thing shipped on a Thursday. I still remember the Thursday.",
        who: "J.",
        role: "COO / a freight company that will remain anonymous",
      },
      club: {
        station: "The Members’ Club",
        quote:
          "Onboarding used to be a form. Now it’s four questions and a sound. Signups went sideways. In the good direction. We had to stop checking the dashboard hourly.",
        who: "R.",
        role: "head of product / a members’ club",
      },
      museum: {
        station: "The Museum",
        quote:
          "They found a bug in our font. We didn’t know fonts could have bugs. They fixed our font. The guard noticed before we did.",
        who: "A.",
        role: "creative director / a museum",
      },
      bakery: {
        station: "The Bakery",
        quote:
          "I still don’t know how the checkout works. Neither do they, I think. It works anyway. The waiting list is now the website.",
        who: "T.",
        role: "owner / a bakery with a waiting list",
      },
      support: {
        station: "The Support Desk",
        quote:
          "The assistant answers the first line. It cites the help centre, says when it doesn’t know, and hands over to a human. Tickets dropped by 38%. Nobody misses the old chatbot.",
        who: "S.",
        role: "founder / a support platform",
      },
    },
    foot: {
      side: "Some clients are quiet on purpose. [[em]]We keep their names in the drawer with the cursor’s hat.[[/em]]",
      footnote:
        "Quotes are fictional. The problems are not. No logos were harmed. If you’re one of the six: hello, you can hear us again.",
      stamp: "Side B",
    },
  },

  bench: {
    eyebrow: { plate: "Plate 06", section: "The Bench", try: "Try it" },
    title1: "The site is",
    title2: "the [[em]]pitch.[[/em]]",
    lede: "Move the faders. The page changes — warmth, grain, tempo. This is the same interface we use on a kickoff call, minus the candles.",
    live: "Live demo",
    meta: "Tuner Mk. 06 / local only / no tracking",
    tuner: {
      title: "The tuner / Mk. 06",
      live: "Live on this page",
      index: "Vibe index",
      desc: "“{warm}, {grain}, {pace} room” — as read by the room",
      warm: ["cool", "warm", "violet-hour"],
      grain: ["clean", "papery", "dusty"],
      pace: ["still", "humming", "restless"],
      reset: "Reset to house",
      detune: "Detune ↓",
      note:
        "Detune is what we do when a client says “make it pop”. It is also what we do when we’re bored. The house setting is where we start every project.",
      plaque: "calibrated by hand",
    },
    faders: {
      warmth: { label: "Warmth", endA: "cold, clinical", endB: "warm, human" },
      grain: { label: "Grain", endA: "clean glass", endB: "dusty paper" },
      tempo: { label: "Tempo", endA: "still", endB: "restless" },
    },
    console: {
      head: "Transmission / form 7—B",
      sub: "No CRM · one inbox · one human",
      received: "Received",
      doneLine:
        "Session code {code}. One of us will answer from {email}, usually around 09:00 CET. Expect a question, not a deck.",
      draft: "Draft /",
      openMail: "Open in mail app",
      copyMail: "Copy {email}",
      writeAnother: "Write another",
      local:
        "This console is local. Nothing was sent from your browser — the mail app button carries the draft.",
      form: {
        name: "Your name",
        namePlaceholder: "first name is plenty",
        email: "Signal / email",
        emailPlaceholder: "you@somewhere",
        about: "03 / I’m here about",
        message: "What are we making?",
        messagePlaceholder:
          "A sentence is enough. The hunch, the snag, the feeling you want in the room.",
      },
      modes: {
        build: { label: "A hunch", sub: "something new" },
        sprint: { label: "A rescue", sub: "something slightly off" },
        date: { label: "A standing date", sub: "taste on tap" },
        unsure: { label: "Not sure yet", sub: "that’s fine" },
      },
      attach: "Attached / patch sheet",
      attachRemove: "Remove attached patch",
      errors: {
        name: "We need something to call you. A first name is plenty.",
        email: "That signal looks broken. Try an address with an @ in it.",
        message: "Give us one sentence. Even a bad one. Especially a bad one.",
      },
      submit: "Transmit",
      sending: "Transmitting",
      fine: "No sequence. No deck. One of us reads this, usually around 09:00 CET. If you’re in a hurry, say so in the first line.",
      foot: "HUNCH / studio 03 / window 7—B",
    },
    draft: {
      subject: "A hunch — {mode} — {name}",
      body: "Session request / {mode}\n\nName: {name}\nSignal: {email}\n\n{patch}{message}\n\n— sent from hunch.studio, by hand",
      patch: "Attached patch:\n{patch}\n\n",
      noName: "no name yet",
    },
    foot: {
      quote:
        "The best demo we have is the thing you’re already touching. [[em]]This is it.[[/em]]",
      footnote:
        "The tuner writes to this page, not to us. The console is local. The feeling is the product. The rest is a conversation.",
      cta: "Go to the sign-off",
    },
  },

  signoff: {
    eyebrow: { plate: "Plate 07", section: "Sign-off", end: "End of issue" },
    issue: "Issue 03 · 500 copies · of which one is online",
    subword: "AI-native products, built by hand",
    place: "Rotterdam / est. 2023",
    last: "That’s the issue. [[em]]The studio is still open.[[/em]]",
    mail: "Tell us what you’re making",
    copy: "Copy the address",
    copied: "Address copied ✓",
    back: "Back to the cover",
    closeMeta1: "Two desks · one kettle · no decks",
    closeMeta2: "Rotterdam / 51.92°N 4.48°E",
    colophon: {
      studio: "Studio",
      studioName: "HUNCH Studio",
      studioPlace: "Rotterdam, NL",
      studioNote:
        "Two desks, one kettle. Open Tue—Thu, 09:00—18:00 CET. Closed in August, like a proper studio.",
      contact: "Contact",
      contactNote: "+31 6 0000 0000 (please don’t). Signal: ask. We answer around 09:00 CET.",
      credits: "Credits",
      creditsBody:
        "Set in Bricolage Grotesque, Instrument Serif and JetBrains Mono. Russian set in Onest and Playfair Display. Built in a browser, by hand, on a laptop, on a train. No templates were harmed.",
      model1: "Made on DeepSeek V4.1 Flash 1017",
      model2: "maya-deepseek/deepseek-v4.1-flash · Maya-S · reasoning max",
      model3: "1,272,527 tokens read · 818,340 written · 89.6M reused",
      legal: "Legal",
      legalBody:
        "© 2026 HUNCH Studio. VAT NL000000000B01. “Synergy” used under protest. Some feelings reserved.",
      fiction:
        "HUNCH is a fictional studio. This issue is a concept demo; the work, clients and prices are invented.",
    },
    seal: {
      ring: "HUNCH STUDIO · SOFTWARE BY FEEL · ROTTERDAM · EST 2023 ·",
      label: "The seal is not legally binding",
    },
    barcode: {
      label: "HUNCH / issue 03 / 2026",
      mid: "Printed on the internet · not for resale",
      num: "5 900 123 987 003",
    },
    end: {
      hand: "Made by hand, [[em]]mostly.[[/em]]",
      tiny: "Row 4,001 — this is where the footer ends. You’re welcome.",
      top: "↑ Back to the cover",
    },
  },
};

export type Content = typeof en;

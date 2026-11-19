/* ==========================================================================
   ALMANAC — content
   Every factual statement in the app lives here so it can be checked and
   corrected in one place. Numbers are from the sources listed at the bottom.
   "Winter / Spring / Summer / Autumn" are a metaphor; the scientific name is
   always shown next to them.
   ========================================================================== */
(function (root) {
  "use strict";

  const PHASES = {
    winter: {
      name: "Winter", sci: "Menstrual phase", color: "#4C5BA8",
      days: "Cycle day 1 to about day 5. Bleeding typically lasts 2 to 7 days.",
      line: "Estrogen and progesterone are at their lowest, and the uterine lining is shedding.",
      what: [
        "Day 1 of your cycle is the first day of real bleeding. At the end of the last cycle, falling progesterone and estrogen tell the uterus to shed its lining.",
        "Period blood is a mix of blood, tissue and mucus from the lining. Regularly losing more than about 80 ml in a period counts as heavy, but few people measure it, so the warning signs further down are more practical.",
        "A new group of follicles is already being recruited in the ovaries, so the next follicular phase overlaps with your period."
      ],
      hormones: "Estrogen and progesterone: low. FSH starts to rise, recruiting follicles.",
      common: "Cramps (caused by prostaglandins that make the uterus contract), tiredness, headaches, lower back ache and looser stools are common. Common, not universal.",
      help: [
        "Heat on the lower belly can ease cramps. Studies suggest it works about as well as over-the-counter painkillers for some people.",
        "Anti-inflammatory painkillers like ibuprofen work best when started at the first sign of cramps, if they're safe for you.",
        "If your periods are heavy, iron-rich foods matter: heavy periods are a common cause of iron deficiency."
      ]
    },
    spring: {
      name: "Spring", sci: "Follicular phase", color: "#3E8F6B",
      days: "Starts on cycle day 1 (so it overlaps your period) and runs until ovulation. Its length varies a lot, from about 10 to 30 days.",
      line: "FSH is growing follicles in your ovaries, and rising estrogen is rebuilding the uterine lining.",
      what: [
        "FSH from the pituitary gland stimulates a group of follicles. Usually one becomes dominant and keeps maturing while the others fade.",
        "Estrogen from the growing follicle thickens the uterine lining and makes cervical mucus clearer and more slippery as ovulation gets closer.",
        "This is the phase that changes most from person to person and cycle to cycle. Most of the difference between a short and a long cycle comes from here, not from the phases after ovulation."
      ],
      hormones: "FSH early, then falling. Estrogen climbing steadily to a peak just before ovulation.",
      common: "Many people report more energy and a better mood as estrogen rises. Research on mood across the cycle is mixed, and plenty of people notice no pattern at all. Your own log will show whether you do.",
      help: [
        "Regular movement and enough sleep support energy and mood across the whole cycle.",
        "If you're trying to conceive or avoid pregnancy, note that the fertile window opens in this phase, about 5 days before ovulation."
      ]
    },
    summer: {
      name: "Summer", sci: "Ovulation", color: "#C98410",
      days: "Ovulation is a moment, not a phase. We draw the estimate plus or minus a day because it can't be pinned down from the calendar alone.",
      line: "A surge of LH triggers the release of an egg. This is the peak of your fertile window.",
      what: [
        "Rising estrogen triggers a surge of luteinizing hormone (LH). Ovulation follows roughly 24 to 36 hours after the surge begins.",
        "The egg survives only about 12 to 24 hours. Sperm can survive up to 5 days, so the fertile window is 6 days: the 5 days before ovulation, plus ovulation day.",
        "Estrogen peaks just before ovulation, and cervical mucus becomes clear, stretchy and slippery, a bit like raw egg white."
      ],
      hormones: "LH surges. Estrogen peaks, then dips. Progesterone starts to rise.",
      common: "Some people notice a brief one-sided twinge low in the belly (mittelschmerz), more clear cervical mucus, or light spotting. Many notice nothing at all.",
      help: [
        "LH test strips detect the surge, which makes them a good way to predict ovulation. A sustained temperature rise can suggest ovulation occurred afterwards, but does not prove the exact day.",
        "The calendar can't pinpoint ovulation. Mucus, LH tests and temperature provide additional clues, but none guarantees the exact day."
      ]
    },
    autumn: {
      name: "Autumn", sci: "Luteal phase", color: "#B5532B",
      days: "From ovulation until your next period. Usually 12 to 14 days, and fairly steady for each person (range roughly 10 to 16).",
      line: "The follicle has become the corpus luteum, and progesterone is rising to hold the lining in place.",
      what: [
        "After the egg is released, the empty follicle becomes the corpus luteum. It makes progesterone, which peaks about a week after ovulation, plus some estrogen.",
        "If the egg isn't fertilized, the corpus luteum breaks down about two weeks after ovulation. Hormones fall, the lining sheds, and that is day 1 of your next cycle.",
        "Progesterone raises your resting body temperature by roughly 0.2–0.5 °C, which is why temperature tracking can suggest that ovulation occurred."
      ],
      hormones: "Progesterone peaks about a week after ovulation, then falls if there's no pregnancy. Estrogen has a smaller second rise.",
      common: "Premenstrual symptoms are common: breast tenderness, bloating, tiredness, cravings, irritability or low mood, and disturbed sleep in the days before bleeding. As many as 3 in 4 people notice some. Around 3–8% have PMDD, a severe form that is treatable.",
      help: [
        "Regular aerobic exercise, enough sleep, and cutting back on alcohol and caffeine are commonly recommended for premenstrual symptoms.",
        "If symptoms disrupt work, study or relationships, talk to a clinician. Effective treatments exist, so you don't need to just push through."
      ]
    },
    bleed: { name: "Bleed", sci: "Withdrawal or period bleed", color: "#4C5BA8", line: "Bleeding days. If you use hormonal contraception, many methods change or stop ovulation, so phases and fertile windows aren't shown." },
    steady: { name: "Steady", sci: "Between bleeds", color: "#3E8F6B", line: "Hormonal methods change how your cycle works, so Almanac tracks your bleeding and symptoms and leaves out phase and fertility estimates." }
  };

  const MYTHS = [
    ["Every cycle is 28 days.", "A normal adult cycle is anywhere from 21 to 35 days. In a study of over 600,000 logged cycles, the average was 29.3 days and only 13% were exactly 28."],
    ["Ovulation happens on day 14.", "Ovulation happens roughly 14 days before your next period, so it moves with your cycle length. In a 35-day cycle that's around day 22, and in a 24-day cycle around day 11. Even then it's an estimate."],
    ["You can't get pregnant during your period.", "It's less likely, but possible, especially with shorter cycles. Sperm survive up to 5 days, so sex near the end of a period can overlap with an early ovulation."],
    ["A tracker or calendar works as birth control.", "Calendar-based estimates are among the least reliable ways to avoid pregnancy, because ovulation shifts from cycle to cycle. Almanac's fertile-window dates are estimates, not contraception."],
    ["A late period means you're pregnant.", "It can, and a pregnancy test is the way to check. But stress, illness, travel, weight change, breastfeeding, PCOS, thyroid problems and perimenopause can all delay a period."],
    ["Painful periods are just normal.", "Mild to moderate cramps are common. Pain that stops you studying, working or sleeping isn't something you have to tolerate. It can be treated, and sometimes points to conditions like endometriosis or fibroids."]
  ];

  const SEE_DOCTOR = [
    "You haven't had a first period by age 15.",
    "Your period has stopped for 3 months or more and you're not pregnant.",
    "Your cycles are regularly shorter than 21 days or longer than 35 days (longer than 45 if you're a teenager).",
    "Your period lasts longer than 7 days.",
    "You soak through a pad or tampon every hour for several hours, need to double up protection, change it overnight, or pass clots bigger than a coin.",
    "You bleed between periods or after sex, or your cycle suddenly changes from what's normal for you.",
    "Cramps or pelvic pain that disrupt daily life, or that are getting worse."
  ];
  const URGENT = [
    "Soaking through a pad or tampon every hour for 2 or more hours, especially with dizziness, fainting or a racing heart.",
    "Severe one-sided pelvic pain, particularly with a positive pregnancy test, dizziness or shoulder-tip pain."
  ];

  /* flag id -> card text. `d` is the data the engine attached. */
  const FLAGS = {
    "cycle-out-1": d => ({ t: "Your last cycle was " + d.len + " days", b: "Typical adult cycles run " + d.range.min + "–" + d.range.max + " days. A one-off outside that range happens (stress, illness, travel, new medication). If it keeps happening, mention it to a clinician." }),
    "cycle-out-3": d => ({ t: "Your last three cycles were outside the usual range", b: "Cycles of " + d.lens.join(", ") + " days are outside the typical " + d.range.min + "–" + d.range.max + ". Three in a row is worth raising with a clinician. It's often treatable and very common." }),
    "variation": d => ({ t: "Your cycle length varies by " + d.span + " days", b: "A gap of more than about a week between your shortest and longest cycles is considered irregular. If this is new for you, it's worth mentioning to a clinician. Predictions will be wider until things settle." }),
    "period-long": d => ({ t: "A recent period lasted " + d.len + " days", b: "Periods longer than 7 days are considered prolonged. Worth mentioning to a clinician, especially if the flow was heavy." }),
    "no-period": d => ({ t: "It's been " + d.days + " days since your last period started", b: "If you could be pregnant, take a test. Otherwise, going 3 months or more without a period is worth discussing with a clinician." }),
    "heavy": () => ({ t: "You logged signs of very heavy bleeding", b: "Soaking a pad or tampon every hour for several hours, or passing large clots, can mean heavy menstrual bleeding, which is treatable and can lead to anemia. Contact a clinician. If you feel faint or dizzy, get urgent care." }),
    "pain": () => ({ t: "You've logged severe pain several times", b: "Pain that disrupts your day isn't something to push through. Conditions like endometriosis are often missed for years, so it's worth raising. The doctor summary in this app can help." }),
    "spotting": () => ({ t: "Spotting between periods", b: "Light spotting between periods happens, sometimes around ovulation. If it's new, frequent or heavy, mention it to a clinician." })
  };

  const SYMPTOMS = [
    ["cramps", "Cramps", "😖"], ["headache", "Headache", "🤕"], ["bloating", "Bloating", "🎈"], ["breast", "Breast tenderness", "💗"],
    ["backache", "Back ache", "🦴"], ["nausea", "Nausea", "🤢"], ["fatigue", "Tired", "😴"], ["insomnia", "Poor sleep", "🌙"],
    ["cravings", "Cravings", "🍫"], ["acne", "Breakouts", "🔴"], ["irritable", "Irritable", "😠"], ["anxious", "Anxious", "😰"], ["lowmood", "Low mood", "🌧️"]
  ];
  const ALERT_SYMPTOMS = [["clots", "Clots bigger than a coin", "🩸"], ["soaking", "Soaking a pad or tampon every hour", "⚠️"]];
  const FLOW = [["0", "None"], ["1", "Spotting"], ["2", "Light"], ["3", "Medium"], ["4", "Heavy"]];
  const MOOD = [["1", "😞", "Very low"], ["2", "😕", "Low"], ["3", "😐", "Okay"], ["4", "🙂", "Good"], ["5", "😄", "Great"]];
  const ENERGY = [["1", "Very low"], ["2", "Low"], ["3", "Okay"], ["4", "Good"], ["5", "High"]];
  const PAIN = [["0", "None"], ["1", "Mild"], ["2", "Moderate"], ["3", "Severe"]];
  const MUCUS = [["dry", "Dry"], ["sticky", "Sticky"], ["creamy", "Creamy"], ["watery", "Watery"], ["eggwhite", "Egg-white"]];

  const HOW = [
    ["Day 1", "Your cycle starts on the first day of real bleeding (light flow or more). Spotting alone doesn't start a new cycle. Bleeding days up to two days apart count as one period."],
    ["Your next period", "With 3 or more logged cycles, Almanac averages your last six and builds an 80% prediction range from how much your cycles vary. In simulation, that range contained the real next period about 8 times in 10. With fewer than 3 cycles it says so and shows a wider, rougher range."],
    ["Ovulation", "By default, about 14 days before your next period is predicted to start. The average luteal phase is 12–14 days depending on the study, so 14 is the midpoint. When you log an LH test or temperatures, the estimate switches to your real evidence, and Almanac learns your personal luteal length."],
    ["Temperature", "A sustained rise can suggest ovulation occurred, using the \"3 over 6\" rule: three days in a row higher than the previous six, the third at least 0.2 °C above them."],
    ["Fertile window", "The 5 days before ovulation plus ovulation day. When your cycles vary a lot, the window gets a lighter extension to show the uncertainty, and the app tells you that a calendar can't pinpoint it."],
    ["The hills", "The two hills on the Today screen are schematic estrogen (front) and progesterone (back) curves, stretched to your cycle. They show typical shapes, not your measured levels."],
    ["Outlook and wheel", "The 7-day outlook, the cycle wheel and the cycle strips all use the same estimates as the calendar, so they always agree with each other. The wheel is drawn to scale for your own cycle length."],
    ["Your patterns", "Mood, energy and pain are averaged for each phase using only days you logged. Almanac only says something when both phases have at least 4 logged days and the difference is meaningful."]
  ];

  const SOURCES = [
    "American College of Obstetricians and Gynecologists (ACOG), patient education and Committee Opinion 651, Menstruation in Girls and Adolescents: Using the Menstrual Cycle as a Vital Sign (cycle and period ranges, adolescent ranges, warning signs). acog.org",
    "Mayo Clinic, Heavy menstrual bleeding and Menstrual cycle: what's normal. mayoclinic.org",
    "NHS and Office on Women's Health, Periods and the menstrual cycle. nhs.uk, womenshealth.gov",
    "Bull JR et al. (2019). Real-world menstrual cycle characteristics of more than 600,000 menstrual cycles. npj Digital Medicine 2:83. (Average cycle 29.3 days; 13% of cycles were 28 days; luteal phase 12.4 days on average, 95% range 7–17.)",
    "Lenton EA, Landgren BM, Sexton L (1984). Normal variation in the length of the luteal phase of the menstrual cycle. BJOG 91:685–689.",
    "Wilcox AJ, Weinberg CR, Baird DD (1995). Timing of sexual intercourse in relation to ovulation. New England Journal of Medicine 333:1517–1521.",
    "Stricker R et al. (2006). Establishment of detailed reference values for LH, FSH, estradiol and progesterone during different phases of the menstrual cycle. Clinical Chemistry and Laboratory Medicine 44:883–887.",
    "Munro MG et al., FIGO (2018). The two FIGO systems for normal and abnormal uterine bleeding symptoms and classification of causes. International Journal of Gynecology & Obstetrics.",
    "American Society for Reproductive Medicine (ASRM), Ovulation detection factsheet (LH surge, temperature rise).",
    "Sensiplan symptothermal method (the \"3 over 6\" temperature rule)."
  ];

  // Wilcox et al. 1995: the fertile window spans 6 days and ends on the day of ovulation. Chance of conception from sex
  // on the day: about 10% five days before ovulation, rising to about 33% on ovulation day itself.
  const FERTILE_FACT = "In a landmark study of 221 women (Wilcox et al., 1995), the fertile window spanned 6 days and ended on the day of ovulation. The chance of conceiving from sex five days before ovulation was about 10%, rising to about 33% on ovulation day itself.";


  const ANATOMY = {
    winter: "The uterine lining is shedding and hormones are at their lowest.",
    spring: "A follicle in the ovary is growing while the lining rebuilds.",
    summer: "The mature follicle releases its egg. The lining is thick.",
    autumn: "The empty follicle becomes the corpus luteum, and the lining is at its thickest."
  };

  const MUCUS_INFO = [
    ["dry", "Dry", "Little or nothing noticeable. May be less fertile; not a reliable way to exclude pregnancy.", 1],
    ["sticky", "Sticky", "Tacky, crumbly or paste-like. May be less fertile; not a reliable way to exclude pregnancy.", 2],
    ["creamy", "Creamy", "Like lotion, white or cloudy. Fertility is rising.", 3],
    ["watery", "Watery", "Wet, clear and thin. High fertility.", 4],
    ["eggwhite", "Egg-white", "Clear, slippery and stretchy. Peak fertility, and ovulation is close.", 5]
  ];

  const GUIDES = [
    { id: "temp", ico: "thermo", title: "Tracking your temperature", fig: "bbt",
      intro: "A basal body temperature (BBT) chart shows whether you ovulated, and roughly when, after it has happened.",
      steps: [
        "Use the same thermometer at the same time every morning, before you sit up, drink or talk.",
        "Aim for at least 3 hours of unbroken sleep beforehand.",
        "Log it in Almanac's day sheet under Fertility signs (°C or °F).",
        "After ovulation, progesterone lifts your temperature by roughly 0.2–0.5 °C (0.4–1 °F), and it stays up until your next period.",
        "Almanac looks for three days in a row above the previous six, with the third at least 0.2 °C higher. This is the \"3 over 6\" rule."],
      notes: [
        "Fever, alcohol, poor sleep, travel and shift work can throw readings off. Skip those days.",
        "Temperature confirms ovulation after the fact, so it can't tell you when you're about to ovulate."] },
    { id: "lh", ico: "strip", title: "Using ovulation (LH) tests", fig: "lh",
      intro: "These urine tests detect the LH surge that happens roughly 24 to 36 hours before ovulation.",
      steps: [
        "Start testing a few days before you expect to ovulate. Almanac's fertile-window estimate shows roughly when. Follow your kit's instructions, because brands differ.",
        "A positive result means the surge has started. Ovulation usually follows within about a day or two.",
        "Log a positive in Almanac and it uses it as evidence for this cycle."],
      notes: [
        "Conditions such as PCOS, and the transition to menopause, can cause high LH levels and confusing results.",
        "LH tests predict ovulation. They don't prove it happened. Temperature does that."] },
    { id: "mucus", ico: "mucus", title: "Reading cervical mucus", fig: "mucus",
      intro: "Cervical mucus changes as estrogen rises and falls. It's your body's own fertility signal, and it costs nothing to watch.",
      steps: [
        "Notice what you see or feel through the day, or check with clean fingers or toilet paper.",
        "Log the most fertile type you noticed that day.",
        "Look at the pattern across days: it typically goes dry, then sticky, creamy, watery, then egg-white around ovulation, then back to thick or dry."],
      notes: [
        "Semen, lubricant, infections, breastfeeding and some medicines can change what you see.",
        "Wet or egg-white mucus means estrogen is high and you're likely in or near your fertile window."] },
    { id: "products", ico: "shield", title: "Period products and safety", fig: null,
      intro: "Every product works. The safety points below are the ones worth knowing.",
      steps: [
        "Tampons: change at least every 4 to 8 hours, and never leave one in for more than 8 hours. Use the lowest absorbency that handles your flow.",
        "If you'll sleep more than 8 hours, put in a fresh tampon just before bed and change it as soon as you wake, or use a pad overnight.",
        "Menstrual cups: most can be worn for up to about 12 hours. Follow the maker's cleaning instructions.",
        "Pads and period underwear aren't linked to toxic shock syndrome."],
      notes: [
        "Toxic shock syndrome (TSS) is rare but serious. If you suddenly get a high fever with a sunburn-like rash, dizziness or fainting, vomiting or diarrhea, or confusion, remove the tampon or cup and get urgent medical care."] },
    { id: "pms", ico: "heart", title: "PMS and PMDD", fig: null,
      intro: "Premenstrual syndrome (PMS) is a pattern of physical and emotional symptoms in the one to two weeks before a period that eases within a few days of bleeding starting.",
      steps: [
        "Common PMS symptoms: bloating, breast tenderness, tiredness, cravings, headaches, irritability or low mood.",
        "Premenstrual dysphoric disorder (PMDD) is a severe form, affecting around 3–8% of people. Intense irritability, anger, anxiety or depression disrupt work, study or relationships. It's recognized and treatable (therapy, medication and hormonal options).",
        "Logging mood daily for two or more cycles shows whether your low days cluster just before your period. That's valuable information for a clinician."],
      notes: [
        "If you ever feel unsafe, or have thoughts of harming yourself, contact your local emergency number or a crisis line right away."] },
    { id: "bc", ico: "pill", title: "Contraception and your bleeding", fig: null,
      intro: "Hormonal methods change how your cycle works, so they change what bleeding means.",
      steps: [
        "On the combined pill, patch or ring, the bleed in the hormone-free break is a withdrawal bleed, not a natural period.",
        "Hormonal IUDs, implants and injections often make bleeding lighter or irregular, or stop it. Irregular spotting is common in the first months.",
        "Many hormonal methods change or stop ovulation. That's why Almanac hides phases and fertile windows in that mode.",
        "Copper IUDs have no hormones and can make periods heavier or more painful for some people."],
      notes: ["Almanac can't tell you whether a method is working. For that, talk to a clinician."] }
  ];

  const LIFE = [
    ["First periods", "Most people get their first period (menarche) between about 10 and 15, at an average of around 12. Cycles are often irregular for the first few years and can run up to 45 days."],
    ["Pregnancy", "Periods stop. If you could be pregnant, a test is most reliable from the first day of a missed period."],
    ["After birth and breastfeeding", "Periods may stay away for months, particularly with frequent breastfeeding. You can ovulate, and so become pregnant, before your first period returns."],
    ["Perimenopause", "The years leading up to menopause, usually starting in the 40s. Cycles lengthen, shorten or skip, and flow can change. Pregnancy is still possible."],
    ["Menopause", "Menopause is confirmed after 12 months in a row without a period, at an average age of about 51. Any bleeding after that should be checked by a clinician."]
  ];

  const GLOSSARY = [
    ["Amenorrhea", "No periods. Usually defined as 3 months or more without one, when you're not pregnant."],
    ["Basal body temperature (BBT)", "Your lowest resting temperature, taken first thing in the morning. It rises slightly after ovulation."],
    ["Cervical mucus", "Fluid from the cervix that changes through the cycle. Clear, stretchy mucus signals high fertility."],
    ["Corpus luteum", "The temporary structure left behind after the follicle releases its egg. It makes progesterone."],
    ["Dysmenorrhea", "Painful periods."],
    ["Endometrium", "The lining of the uterus, which thickens each cycle and sheds as your period."],
    ["Estrogen", "A hormone made by growing follicles. It thickens the lining, peaks just before ovulation, and makes cervical mucus clearer."],
    ["Fertile window", "The 6 days that can lead to pregnancy: the 5 days before ovulation plus ovulation day."],
    ["Follicle", "A fluid-filled sac in the ovary that holds an immature egg."],
    ["FSH (follicle-stimulating hormone)", "Made by the pituitary gland. It prompts follicles in the ovary to grow."],
    ["Heavy menstrual bleeding", "Bleeding that is heavy enough to disrupt daily life, such as soaking through protection hourly or passing large clots."],
    ["LH (luteinizing hormone)", "Surges before ovulation and triggers the egg's release. This is what ovulation tests detect."],
    ["Luteal phase", "From ovulation until your next period, usually 12 to 14 days."],
    ["Menarche", "A person's first period."],
    ["Menopause", "Confirmed after 12 consecutive months without a period."],
    ["Mittelschmerz", "A brief one-sided pain in the lower belly around ovulation that some people feel."],
    ["Ovulation", "The release of an egg from the ovary."],
    ["Perimenopause", "The transition before menopause, when cycles become irregular."],
    ["PMDD", "Premenstrual dysphoric disorder: severe premenstrual mood symptoms that disrupt life. Treatable."],
    ["PMS", "Premenstrual syndrome: physical and emotional symptoms in the days before a period."],
    ["Progesterone", "A hormone made mainly after ovulation. It holds the lining in place and raises body temperature slightly."],
    ["Prostaglandins", "Chemicals that make the uterus contract. They're the main cause of period cramps."]
  ];

  const MORE_SOURCES = [
    "U.S. Food and Drug Administration (FDA) and CDC, Tampon safety and toxic shock syndrome (change tampons every 4–8 hours; never more than 8; warning signs).",
    "ACOG, Premenstrual syndrome and PMDD (PMDD in roughly 3–8% of people). acog.org",
    "NHS, Mayo Clinic and ACOG, Perimenopause and menopause (menopause confirmed after 12 months without a period; average age about 51)."
  ];

  root.AlmanacContent = { PHASES, MYTHS, SEE_DOCTOR, URGENT, FLAGS, SYMPTOMS, ALERT_SYMPTOMS, FLOW, MOOD, ENERGY, PAIN, MUCUS, HOW, SOURCES, FERTILE_FACT, ANATOMY, MUCUS_INFO, GUIDES, LIFE, GLOSSARY, MORE_SOURCES };
})(typeof self !== "undefined" ? self : this);

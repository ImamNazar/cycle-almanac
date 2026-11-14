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
        "LH test strips detect the surge, which makes them a good way to predict ovulation. A sustained temperature rise only confirms it afterwards.",
        "The calendar can't pinpoint ovulation. Mucus, LH tests and temperature are far more precise than a date on a calendar."
      ]
    },
    autumn: {
      name: "Autumn", sci: "Luteal phase", color: "#B5532B",
      days: "From ovulation until your next period. Usually 12 to 14 days, and fairly steady for each person (range roughly 10 to 16).",
      line: "The follicle has become the corpus luteum, and progesterone is rising to hold the lining in place.",
      what: [
        "After the egg is released, the empty follicle becomes the corpus luteum. It makes progesterone, which peaks about a week after ovulation, plus some estrogen.",
        "If the egg isn't fertilised, the corpus luteum breaks down about two weeks after ovulation. Hormones fall, the lining sheds, and that is day 1 of your next cycle.",
        "Progesterone raises your resting body temperature by roughly 0.2–0.5 °C, which is how temperature tracking confirms that ovulation happened."
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
    "heavy": () => ({ t: "You logged signs of very heavy bleeding", b: "Soaking a pad or tampon every hour for several hours, or passing large clots, can mean heavy menstrual bleeding, which is treatable and can lead to anaemia. Contact a clinician. If you feel faint or dizzy, get urgent care." }),
    "pain": () => ({ t: "You've logged severe pain several times", b: "Pain that disrupts your day isn't something to push through. Conditions like endometriosis are often missed for years, so it's worth raising. The doctor summary in this app can help." }),
    "spotting": () => ({ t: "Spotting between periods", b: "Light spotting between periods happens, sometimes around ovulation. If it's new, frequent or heavy, mention it to a clinician." })
  };

  const SYMPTOMS = [
    ["cramps", "Cramps"], ["headache", "Headache"], ["bloating", "Bloating"], ["breast", "Breast tenderness"],
    ["backache", "Back ache"], ["nausea", "Nausea"], ["fatigue", "Tired"], ["insomnia", "Poor sleep"],
    ["cravings", "Cravings"], ["acne", "Breakouts"], ["irritable", "Irritable"], ["anxious", "Anxious"], ["lowmood", "Low mood"]
  ];
  const ALERT_SYMPTOMS = [["clots", "Clots bigger than a coin"], ["soaking", "Soaking a pad or tampon every hour"]];
  const FLOW = [["0", "None"], ["1", "Spotting"], ["2", "Light"], ["3", "Medium"], ["4", "Heavy"]];
  const MOOD = [["1", "😞", "Very low"], ["2", "😕", "Low"], ["3", "😐", "Okay"], ["4", "🙂", "Good"], ["5", "😄", "Great"]];
  const ENERGY = [["1", "Very low"], ["2", "Low"], ["3", "Okay"], ["4", "Good"], ["5", "High"]];
  const PAIN = [["0", "None"], ["1", "Mild"], ["2", "Moderate"], ["3", "Severe"]];
  const MUCUS = [["dry", "Dry"], ["sticky", "Sticky"], ["creamy", "Creamy"], ["watery", "Watery"], ["eggwhite", "Egg-white"]];

  const HOW = [
    ["Day 1", "Your cycle starts on the first day of real bleeding (light flow or more). Spotting alone doesn't start a new cycle. Bleeding days up to two days apart count as one period."],
    ["Your next period", "With 3 or more logged cycles, Almanac averages your last six and builds an 80% prediction range from how much your cycles vary. In simulation, that range contained the real next period about 8 times in 10. With fewer than 3 cycles it says so and shows a wider, rougher range."],
    ["Ovulation", "By default, about 14 days before your next period is predicted to start. The average luteal phase is 12–14 days depending on the study, so 14 is the midpoint. When you log an LH test or temperatures, the estimate switches to your real evidence, and Almanac learns your personal luteal length."],
    ["Temperature", "A sustained rise confirms ovulation after the fact, using the \"3 over 6\" rule: three days in a row higher than the previous six, the third at least 0.2 °C above them."],
    ["Fertile window", "The 5 days before ovulation plus ovulation day. When your cycles vary a lot, the window gets a lighter extension to show the uncertainty, and the app tells you that a calendar can't pinpoint it."],
    ["The hills", "The two hills on the Today screen are schematic estrogen (front) and progesterone (back) curves, stretched to your cycle. They show typical shapes, not your measured levels."],
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

  root.AlmanacContent = { PHASES, MYTHS, SEE_DOCTOR, URGENT, FLAGS, SYMPTOMS, ALERT_SYMPTOMS, FLOW, MOOD, ENERGY, PAIN, MUCUS, HOW, SOURCES, FERTILE_FACT };
})(typeof self !== "undefined" ? self : this);

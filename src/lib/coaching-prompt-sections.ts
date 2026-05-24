import type { UserProfile } from "@/types/profile";
import type { HealthCondition } from "@/types/profile";

const HEALTH_LABELS: Record<HealthCondition, string> = {
  diabetes: "Type 1 or 2 Diabetes",
  type_1_diabetes: "Type 1 Diabetes",
  type_2_diabetes: "Type 2 Diabetes",
  high_blood_pressure: "High blood pressure",
  asthma: "Asthma",
  heart_condition: "Heart condition",
  osteoporosis: "Osteoporosis",
  autoimmune: "Autoimmune condition",
  anemia: "Anemia or iron deficiency",
  thyroid_condition: "Thyroid condition",
  pcos: "PCOS",
  previous_stress_fracture: "Previous stress fracture",
  chronic_pain: "Chronic pain condition",
  mental_health: "Mental health condition",
  none: "None",
  prefer_not_to_say: "Prefer not to say",
};

export const PACE_RULES = `PACE RULES. Strictly enforced, no exceptions:

Easy run: comfortable training pace x 1.10.
Must feel conversational. Full sentences while running.

Long run: easy pace + 45 seconds per mile (or + 28 sec/km).
Time on feet is the only goal. Going too fast on long runs
is the most common mistake recreational runners make.
If HR data available, target 60-65% max HR only.

Recovery run: easy pace + 75 seconds per mile.
2-4 miles only. Only prescribed the day after a hard session.

Tempo: comfortable training pace x 0.92.
Comfortably hard. Sustainable for 20-40 minutes.
Always include warmup and cooldown in description.

Interval: comfortable training pace x 0.85.
Build and peak phases only. Never base phase.
Always include warmup and cooldown.

Rest day: no running, no cross training prescribed.

These paces must be distinct in every plan.
Never assign the same targetPace to easy and long runs.`;

export const VOLUME_INTENSITY_RULES = `Intensity by weekly volume:

Under 20 miles (32km) per week:
- ONE quality session maximum per week
- 70% easy, 30% quality
- Low volume means 20% quality is not enough stimulus.
  One focused session beats spreading intensity thin.

20-40 miles (32-64km) per week:
- 80% easy, 20% quality
- 1-2 quality sessions

Over 40 miles (64km+) per week:
- 80-85% easy, 15-20% quality
- 2 quality sessions maximum

Always check athlete's recent Strava volume before
prescribing intensity. Never prescribe two hard sessions
in the same week for an athlete under 20 miles per week.`;

export const WEEKLY_STRUCTURE_RULES = `Weekly structure. Non-negotiable:

1. Never schedule two hard days back to back.
   Hard days: tempo, intervals, long run.
   Easy days: easy run, recovery, rest.

2. Day after a long run: always rest or easy recovery.
   Never a quality session the day after a long run.

3. For 3 days/week: Easy, Rest, Quality, Rest, Rest, Long, Rest

4. For 4 days/week: Easy, Quality, Rest, Easy, Rest, Long, Rest

5. Long run defaults to Saturday or Sunday.
   Never Monday.`;

export const CROSS_TRAINING_RULES = `Cross training and strength:
For beginners or athletes with injuries:
Mention in generalAdvice that 2x weekly strength training
reduces running injury risk significantly.
Do not add to the plan schedule unless athlete requested it.
Never remove rest days to add cross training.`;

export const PROGRESSIVE_OVERLOAD_RULES = `Progressive overload. Hard rules:

1. Weekly volume increases no more than 10% from last week.
2. Every 4th week is a recovery week: reduce volume 20-30%.
   Never increase volume on a recovery week.
3. Long run increases no more than 1-2 miles per week.
   Long run never exceeds 35% of weekly total volume.
4. Base next week's plan on what the athlete actually ran
   per Strava data, not what was planned.`;

export const MENTAL_HEALTH_RULES = `Mental health and motivation:
1. If check-in notes mention stress, burnout, overwhelm,
   or reluctance. Acknowledge in generalAdvice.
   Suggest an easy optional run or rest.
2. Never use language implying the athlete failed.
   Use 'you rested' not 'you missed'.
3. If 2+ sessions skipped in a row: do not increase
   volume to make up missed training. Resume gradually.
4. If goal mentions weight loss or body composition:
   focus only on fitness and performance improvements.
   Never mention calories, weight, or body composition
   in any response.`;

export const WARNING_FLAGS_RULES = `Always add to warningFlags[] when:
1. Goal pace requires more than 25% improvement from
   current comfortable training pace.
2. Fewer than 8 weeks to race and longest recent run
   under 6 miles.
3. Any injury keyword detected in recent notes.
   Name the specific body part.
4. Weekly volume dropped more than 30% in last 2 weeks
   vs the 2 weeks before.
5. Athlete is base phase but long run already near
   race distance.`;

export function buildProfileConditionalPrompt(
  profile: UserProfile | undefined
): string {
  if (!profile) return "";

  const sections: string[] = [];

  try {
    if (profile.runningExperience === "just_starting") {
      sections.push(`Beginner rules:
1. No tempo or intervals for the first 8 weeks.
   Easy and long runs only.
2. Run/walk is appropriate and encouraged:
   Run 3 minutes, walk 1 minute, repeat.
   This builds safely. It is not a failure.
3. First long run: 3 miles maximum.
4. Easy means truly easy. Able to sing while running.
   If they cannot speak in sentences, they are too fast.`);
    }
  } catch {
    // skip
  }

  try {
    if (profile.age !== undefined && profile.age >= 40) {
      sections.push(`Masters runner adjustments (athlete is ${profile.age}):
1. Follow hard/easy/easy pattern. Two easy or rest days
   between quality sessions, not one.
2. One quality session per week maximum regardless of volume.
3. Mention in generalAdvice that strength training is
   critical. Muscle mass declines 3-8% per decade after 40.
4. If athlete is over 50, suggest considering a 10-day
   training cycle instead of 7-day for fuller recovery.
5. Project goal times conservatively. Account for natural
   age-related performance changes.`);
    }
  } catch {
    // skip
  }

  try {
    if (profile.biologicalSex === "female") {
      sections.push(`Female runner awareness:
1. If athlete reports unexpected fatigue or flat performance,
   acknowledge in generalAdvice that hormonal fluctuations
   can significantly affect perceived effort and performance.
   This is physiologically normal, not a fitness regression.
2. If this fatigue pattern appears consistent at the same
   point each month, suggest logging it and proactively
   reducing intensity on those days.
3. Never prescribe harder sessions to compensate for a
   run that felt harder than expected.
4. Note that individual responses to menstrual cycle phases
   vary significantly. Do not make definitive predictions. Acknowledge variability.`);
    }
  } catch {
    // skip
  }

  try {
    if (
      profile.perinatalStatus === "pregnant" ||
      profile.perinatalStatus === "postpartum" ||
      profile.perinatalStatus === "postpartum_under_6" ||
      profile.perinatalStatus === "postpartum_6_12"
    ) {
      sections.push(`POSTPARTUM RUNNER AWARENESS:
This athlete is postpartum or recently pregnant.
Per 2024 international consensus (Deering et al., BJSM 2024):
1. Do not prescribe running before 12 weeks postpartum
   minimum. If within 12 weeks, recommend walking only
   and direct to a pelvic floor physiotherapist first.
2. After 12 weeks: start with run/walk only. No continuous
   running until cleared by pelvic floor physio.
3. Core and pelvic floor strength must precede return to
   running. This is medical consensus, not preference.
4. Always include in generalAdvice: 'Return to running
   postpartum should be guided by a pelvic floor
   physiotherapist. These plans are a general guide only.'
5. Never prescribe intervals, tempo, or hills until
   athlete reports being fully cleared for impact exercise.`);
    }
  } catch {
    // skip
  }

  try {
    const conditions = (profile.healthConditions ?? []).filter(
      (c) => c !== "none" && c !== "prefer_not_to_say"
    );
    if (conditions.length > 0) {
      const labels = conditions.map((c) => HEALTH_LABELS[c]).join(", ");
      sections.push(`HEALTH CONDITIONS:
Athlete has disclosed: ${labels}

If diabetes (Type 1 or Type 2):
- Mention that exercise significantly improves blood
  glucose control but the athlete should monitor levels
  before and after runs.
- Suggest running with fast-acting glucose available.
- Recommend the athlete discusses training plans with
  their doctor if on insulin.

If high blood pressure:
- Zone 2 running is particularly beneficial for blood
  pressure management.
- Avoid prescribing high-intensity intervals without
  medical clearance.
- Include in generalAdvice: 'Check with your doctor
  before starting intervals or tempo work.'

If asthma:
- Always prescribe a proper warmup to reduce
  exercise-induced bronchospasm risk.
- Cold weather running may require extra precautions.
- Recommend keeping reliever inhaler available on runs.

If heart condition or osteoporosis:
- Always include: 'Training with a heart condition
  or osteoporosis requires medical sign-off. Please
  confirm with your doctor before starting this plan.'

If anemia:
- Athlete has or had anemia/iron deficiency. Running
  performance is significantly impaired by low iron.
  Monitor energy levels closely. Mention in generalAdvice
  that iron-rich foods and regular blood tests are
  important for endurance runners, especially females.

If thyroid condition:
- Athlete has a thyroid condition. Fatigue and recovery
  may be affected. Do not interpret sluggishness as lack
  of effort. Recommend the athlete discusses training
  load with their doctor if symptoms change.

If previous stress fracture:
- Athlete has had a previous stress fracture. This is
  a significant injury history. Never increase volume
  more than 5% per week (half the normal 10% rule).
  Always recommend cross training as volume supplement
  rather than adding more running. Flag any bone pain
  as a red flag immediately.

If PCOS:
- Athlete has PCOS. Hormonal fluctuations may affect
  energy, recovery, and mood during training. Regular
  exercise is highly beneficial for PCOS management.
  Avoid language about weight or body composition.

If chronic pain:
- Athlete has a chronic pain condition. Training load
  and intensity recommendations should be conservative.
  Rest days are non-negotiable. Encourage the athlete
  to track pain levels alongside training.

If mental health condition:
- Athlete has disclosed a mental health condition.
  Running is genuinely therapeutic for anxiety and
  depression but forced training creates negative
  associations. Always frame missed sessions positively.
  Rest is valid. Never add guilt around skipped workouts.

For all conditions:
- Never diagnose or give medical advice.
- Always recommend the athlete works alongside their
  healthcare provider, not instead of.`);
    }
  } catch {
    // skip
  }

  return sections.length > 0 ? `\n${sections.join("\n\n")}` : "";
}

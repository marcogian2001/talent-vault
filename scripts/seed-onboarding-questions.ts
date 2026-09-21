/**
 * Seeds the default chef onboarding questionnaire.
 *
 * Idempotent: questions are matched on their `key`, so re-running never overwrites the
 * edits an admin made in /admin/onboarding. Kept separate from scripts/seed.ts, which
 * wipes the opportunities table.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import type { QuestionConfig, QuestionOption } from '../src/lib/onboarding-types';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

interface SeedQuestion {
  key: string;
  type: string;
  label: string;
  labelIt: string;
  helpText?: string;
  helpTextIt?: string;
  placeholder?: string;
  placeholderIt?: string;
  required: boolean;
  options?: QuestionOption[];
  config?: QuestionConfig;
}

// `[english, italiano]` — the value slug is always derived from the English wording, so
// translating a label never changes what is stored in an answer.
const option = ([label, labelIt]: [string, string]): QuestionOption => ({
  value: label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40),
  label,
  labelIt,
});

const QUESTIONS: SeedQuestion[] = [
  {
    key: 'full_legal_name',
    type: 'short_text',
    label: 'Full legal name',
    labelIt: 'Nome e cognome completi',
    helpText: 'Exactly as it appears on your passport.',
    helpTextIt: 'Esattamente come sul passaporto.',
    placeholder: 'Mario Rossi',
    placeholderIt: 'Mario Rossi',
    required: true,
    config: { maxLength: 120 },
  },
  {
    key: 'years_experience',
    type: 'number',
    label: 'Years of professional kitchen experience',
    labelIt: 'Anni di esperienza professionale in cucina',
    required: true,
    config: { min: 0, max: 60 },
  },
  {
    key: 'cuisine_specialisms',
    type: 'multi_choice',
    label: 'Which cuisines and services are you trained in?',
    labelIt: 'In quali cucine e servizi sei formato?',
    helpText: 'Select everything you can run on your own.',
    helpTextIt: 'Seleziona tutto ciò che sai gestire in autonomia.',
    required: true,
    options: ([
      ['Edomae sushi', 'Sushi Edomae'],
      ['Nigiri & sashimi', 'Nigiri e sashimi'],
      ['Omakase counter service', 'Servizio omakase al banco'],
      ['Kaiseki', 'Kaiseki'],
      ['Robata / yakitori', 'Robata / yakitori'],
      ['Teppanyaki', 'Teppanyaki'],
      ['Ramen & noodles', 'Ramen e noodles'],
      ['Nikkei / Japanese fusion', 'Nikkei / fusion giapponese'],
      ['Japanese pastry & desserts', 'Pasticceria e dolci giapponesi'],
      ['Western fine dining', 'Alta cucina occidentale'],
    ] as [string, string][]).map(option),
  },
  {
    key: 'english_level',
    type: 'single_choice',
    label: 'What is your level of English?',
    labelIt: 'Qual è il tuo livello di inglese?',
    required: true,
    options: ([
      ['None', 'Nessuno'],
      ['Basic (A1-A2)', 'Base (A1-A2)'],
      ['Intermediate (B1-B2)', 'Intermedio (B1-B2)'],
      ['Advanced (C1)', 'Avanzato (C1)'],
      ['Native or bilingual (C2)', 'Madrelingua o bilingue (C2)'],
    ] as [string, string][]).map(option),
  },
  {
    key: 'languages_spoken',
    type: 'multi_choice',
    label: 'Which other languages do you speak?',
    labelIt: 'Quali altre lingue parli?',
    helpText: 'Select every language you can work in.',
    helpTextIt: 'Seleziona tutte le lingue in cui sai lavorare.',
    required: true,
    options: ([
      ['Italian', 'Italiano'],
      ['English', 'Inglese'],
      ['French', 'Francese'],
      ['Spanish', 'Spagnolo'],
      ['German', 'Tedesco'],
      ['Portuguese', 'Portoghese'],
      ['Russian', 'Russo'],
      ['Japanese', 'Giapponese'],
      ['Mandarin', 'Cinese mandarino'],
      ['Arabic', 'Arabo'],
      ['Other', 'Altro'],
    ] as [string, string][]).map(option),
  },
  {
    key: 'cv_resume',
    type: 'file',
    label: 'Upload your CV / résumé',
    labelIt: 'Carica il tuo CV',
    helpText: 'PDF preferred.',
    helpTextIt: 'Preferibilmente in PDF.',
    required: true,
  },
  {
    key: 'passport_scan',
    type: 'file',
    label: 'Passport photo page',
    labelIt: 'Pagina con la foto del passaporto',
    helpText: 'Used only to verify your eligibility to travel and work.',
    helpTextIt: 'Serve solo a verificare che tu possa viaggiare e lavorare.',
    required: true,
  },
  {
    key: 'passport_expiry',
    type: 'date',
    label: 'Passport expiry date',
    labelIt: 'Data di scadenza del passaporto',
    helpText: "Most placements require at least 6 months' validity.",
    helpTextIt: 'Quasi tutti gli incarichi richiedono almeno 6 mesi di validità.',
    required: true,
    config: { mustBeFuture: true },
  },
  {
    key: 'haccp_certificate',
    type: 'file',
    label: 'HACCP / food safety certificate',
    labelIt: 'Attestato HACCP / sicurezza alimentare',
    required: true,
  },
  {
    key: 'stcw_basic_training',
    type: 'yes_no',
    label: 'Do you hold a valid STCW Basic Safety Training certificate?',
    labelIt: 'Hai un certificato STCW Basic Safety Training valido?',
    helpText: 'Required for yacht and expedition placements.',
    helpTextIt: 'Obbligatorio per gli incarichi su yacht e navi da spedizione.',
    required: true,
  },
  {
    key: 'eng1_medical',
    type: 'file',
    label: 'ENG1 (or equivalent) seafarer medical certificate',
    labelIt: 'Certificato medico ENG1 (o equivalente) per naviganti',
    helpText: 'Optional now, mandatory before boarding any vessel.',
    helpTextIt: "Facoltativo ora, obbligatorio prima di salire a bordo.",
    required: false,
  },
  {
    key: 'willing_to_sail',
    type: 'single_choice',
    label: 'Are you willing to work on board?',
    labelIt: 'Sei disponibile a lavorare a bordo?',
    required: true,
    options: ([
      ['Yes - any itinerary, including ocean crossings', 'Sì, qualsiasi itinerario, comprese le traversate oceaniche'],
      ['Yes - Mediterranean & Caribbean only', 'Sì, solo Mediterraneo e Caraibi'],
      ['Coastal charters only', 'Solo charter costieri'],
      ['No - land-based placements only', 'No, solo incarichi a terra'],
    ] as [string, string][]).map(option),
  },
  {
    key: 'relocation_availability',
    type: 'single_choice',
    label: 'How soon could you relocate for a placement?',
    labelIt: 'Tra quanto potresti trasferirti per un incarico?',
    required: true,
    options: ([
      ['Immediately', 'Subito'],
      ['Within 1 month', 'Entro 1 mese'],
      ['Within 3 months', 'Entro 3 mesi'],
      ['Not currently available', 'Al momento non disponibile'],
    ] as [string, string][]).map(option),
  },
  {
    key: 'portfolio_photos',
    type: 'files',
    label: 'Plating and portfolio photos',
    labelIt: 'Foto di impiattamenti e portfolio',
    helpText: 'Up to 8 images of your own work.',
    helpTextIt: 'Fino a 8 immagini di lavori tuoi.',
    required: false,
    config: { maxFiles: 8 },
  },
  {
    key: 'professional_references',
    type: 'long_text',
    label: 'Professional references',
    labelIt: 'Referenze professionali',
    helpText: 'Two contacts: name, role, property and how to reach them.',
    helpTextIt: 'Due contatti: nome, ruolo, struttura e come raggiungerli.',
    required: false,
    config: { maxLength: 1500 },
  },
];

async function run() {
  const existing = await db.select().from(schema.onboardingQuestions);
  const byKey = new Map(existing.map((row) => [row.key, row]));

  let created = 0;
  let translated = 0;
  let untouched = 0;

  for (const [index, question] of QUESTIONS.entries()) {
    const current = byKey.get(question.key);

    if (!current) {
      await db.insert(schema.onboardingQuestions).values({
        id: crypto.randomUUID(),
        key: question.key,
        type: question.type,
        label: question.label,
        helpText: question.helpText ?? null,
        placeholder: question.placeholder ?? null,
        labelIt: question.labelIt,
        helpTextIt: question.helpTextIt ?? null,
        placeholderIt: question.placeholderIt ?? null,
        required: question.required,
        options: question.options ?? null,
        config: question.config ?? null,
        sortOrder: index * 10,
        status: 'active',
      });
      created += 1;
      continue;
    }

    // Backfill only: an Italian wording the admin already wrote is never replaced, and
    // neither is any English text.
    const patch: Partial<typeof schema.onboardingQuestions.$inferInsert> = {};
    if (!current.labelIt) patch.labelIt = question.labelIt;
    if (!current.helpTextIt && question.helpTextIt) patch.helpTextIt = question.helpTextIt;
    if (!current.placeholderIt && question.placeholderIt) {
      patch.placeholderIt = question.placeholderIt;
    }

    // Options are one JSON column, so they can only be filled in wholesale — do it only
    // when the stored options still match this script's, option for option.
    const seedOptions = question.options ?? [];
    const storedOptions = current.options ?? [];
    const sameOptions =
      seedOptions.length === storedOptions.length &&
      seedOptions.every((o, i) => storedOptions[i]?.value === o.value && storedOptions[i]?.label === o.label);
    const noTranslationsYet = storedOptions.every((o) => !o.labelIt);

    if (seedOptions.length && sameOptions && noTranslationsYet) {
      patch.options = seedOptions;
    }

    if (Object.keys(patch).length === 0) {
      untouched += 1;
      continue;
    }

    await db
      .update(schema.onboardingQuestions)
      .set(patch)
      .where(eq(schema.onboardingQuestions.key, question.key));
    translated += 1;
  }

  console.log(
    `Onboarding questions: ${created} created, ${translated} back-filled with Italian, ${untouched} left as they were.`,
  );
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

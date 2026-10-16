import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __perheSql: postgres.Sql | undefined;
  // eslint-disable-next-line no-var
  var __perheSchema: Promise<void> | undefined;
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

function client() {
  if (!globalThis.__perheSql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL puuttuu");
    globalThis.__perheSql = postgres(url, {
      max: 5,
      prepare: false,
      idle_timeout: 20,
      onnotice: () => {},
      // Päivämäärät merkkijonoina (YYYY-MM-DD), ei aikavyöhykesekoilua.
      types: {
        date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x },
      },
    });
  }
  return globalThis.__perheSql;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE IF NOT EXISTS families (
  id serial PRIMARY KEY,
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id serial PRIMARY KEY,
  family_id int NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🙂',
  color text NOT NULL DEFAULT '#f97316',
  role text NOT NULL DEFAULT 'child' CHECK (role IN ('parent','child')),
  pin_hash text,
  notify_prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id serial PRIMARY KEY,
  family_id int NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity text,
  category text NOT NULL DEFAULT 'muut',
  added_by int REFERENCES members(id) ON DELETE SET NULL,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  done_by int REFERENCES members(id) ON DELETE SET NULL,
  cleared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shopping_items_family ON shopping_items(family_id, cleared);

CREATE TABLE IF NOT EXISTS recipes (
  id serial PRIMARY KEY,
  family_id int NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title text NOT NULL,
  emoji text NOT NULL DEFAULT '🍲',
  servings int,
  minutes int,
  ingredients text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  source_url text,
  created_by int REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meals (
  id serial PRIMARY KEY,
  family_id int NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text NOT NULL,
  recipe_id int REFERENCES recipes(id) ON DELETE SET NULL,
  note text,
  wish_id int,
  created_by int REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meals_family_date ON meals(family_id, date);

CREATE TABLE IF NOT EXISTS wishes (
  id serial PRIMARY KEY,
  family_id int NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title text NOT NULL,
  note text,
  recipe_id int REFERENCES recipes(id) ON DELETE SET NULL,
  requested_by int REFERENCES members(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  planned_date date,
  decided_by int REFERENCES members(id) ON DELETE SET NULL,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

CREATE TABLE IF NOT EXISTS wish_votes (
  wish_id int NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  member_id int NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (wish_id, member_id)
);

CREATE TABLE IF NOT EXISTS events (
  id serial PRIMARY KEY,
  family_id int NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  end_date date,
  start_time text,
  end_time text,
  note text,
  emoji text NOT NULL DEFAULT '📅',
  participants int[] NOT NULL DEFAULT '{}',
  created_by int REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_family_date ON events(family_id, date);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id serial PRIMARY KEY,
  member_id int NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

/** Tietokantayhteys. Luo taulut automaattisesti ensimmäisellä kerralla. */
export async function db() {
  const sql = client();
  if (!globalThis.__perheSchema) {
    globalThis.__perheSchema = sql
      .begin(async (tx) => {
        // Lukko estää kilpailutilanteen, jos useampi palvelin käynnistyy yhtä aikaa.
        await tx`SELECT pg_advisory_xact_lock(727274)`;
        await tx.unsafe(SCHEMA);
      })
      .then(
      () => undefined,
      (err) => {
        globalThis.__perheSchema = undefined;
        throw err;
      },
    );
  }
  await globalThis.__perheSchema;
  return sql;
}

/** Pysyvä asetus (esim. salausavaimet), luodaan tarvittaessa. */
export async function getOrCreateSetting(key: string, create: () => string) {
  const sql = await db();
  const rows = await sql<{ value: string }[]>`SELECT value FROM app_settings WHERE key = ${key}`;
  if (rows[0]) return rows[0].value;
  const value = create();
  await sql`INSERT INTO app_settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO NOTHING`;
  const again = await sql<{ value: string }[]>`SELECT value FROM app_settings WHERE key = ${key}`;
  return again[0].value;
}

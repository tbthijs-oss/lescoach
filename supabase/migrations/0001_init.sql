-- ADR-001: LesCoach datalaag op Supabase (Postgres, regio EU-Frankfurt).
-- Idempotent waar mogelijk. App draait server-side met de service-role-key;
-- RLS staat aan als defensieve tweede laag.

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type leraar_rol as enum ('leraar', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type leraar_status as enum ('uitgenodigd', 'actief', 'geblokkeerd');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meldcode_status as enum ('Nieuw', 'Beoordeeld', 'Doorverwezen', 'Geen actie');
exception when duplicate_object then null; end $$;

-- ---------- tabellen ----------
create table if not exists kenniskaarten (
  id            uuid primary key default gen_random_uuid(),
  titel         text not null,
  categorie     text,
  samenvatting  text,
  wat_is_het    text,
  gevolgen      text,
  tips          text,
  trefwoorden   text[] default '{}',
  pdf_url       text,
  bron_url      text,
  aangemaakt_op timestamptz not null default now()
);

create table if not exists experts (
  id              uuid primary key default gen_random_uuid(),
  naam            text not null,
  titel           text,
  bio             text,
  specialisaties  text[] default '{}',
  email           text,
  telefoon        text,
  linkedin        text,
  foto_url        text,
  beschikbaar     boolean not null default true,
  ervaringsjaren  int,
  regio           text,
  taal            text,
  aangemaakt_op   timestamptz not null default now()
);

create table if not exists scholen (
  id               uuid primary key default gen_random_uuid(),
  schoolnaam       text not null,
  contactpersoon   text,
  contact_email    text,
  status           text,
  abonnement_start date,
  abonnement_eind  date,
  notities         text,
  aangemaakt_op    timestamptz not null default now()
);

create table if not exists leraren (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,
  naam             text,
  school_id        uuid references scholen(id) on delete set null,
  rol              leraar_rol not null default 'leraar',
  status           leraar_status not null default 'uitgenodigd',
  laatste_login    timestamptz,
  uitgenodigd_door text,
  aangemaakt_op    timestamptz not null default now()
);

create table if not exists magic_links (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,
  leraar_id   uuid not null references leraren(id) on delete cascade,
  verloopt_op timestamptz not null,
  gebruikt_op timestamptz
);

create table if not exists expert_magic_links (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,
  expert_id   uuid not null references experts(id) on delete cascade,
  verloopt_op timestamptz not null,
  gebruikt_op timestamptz
);

create table if not exists gesprekken (
  id             uuid primary key default gen_random_uuid(),
  zoekterm       text,
  categorie      text,
  datum          timestamptz not null default now(),
  tokens_in      int,
  tokens_out     int,
  school_id      uuid references scholen(id) on delete set null,
  leraar_id      uuid references leraren(id) on delete set null,
  berichten      jsonb,
  primary_kaart  text,
  samenvatting   text
);

create table if not exists meldcode_signalen (
  id                uuid primary key default gen_random_uuid(),
  datum             timestamptz not null default now(),
  signaal_tekst     text,
  samenvatting      text,
  status            meldcode_status not null default 'Nieuw',
  beoordeeld_door   text,
  beoordelingsnotitie text,
  leraar_id         uuid references leraren(id) on delete set null,
  school_id         uuid references scholen(id) on delete set null,
  gesprek_id        uuid references gesprekken(id) on delete set null
);

-- ---------- indexen ----------
create index if not exists idx_leraren_email           on leraren(email);
create index if not exists idx_leraren_school          on leraren(school_id);
create index if not exists idx_magic_links_token       on magic_links(token);
create index if not exists idx_expert_magic_token      on expert_magic_links(token);
create index if not exists idx_gesprekken_leraar_datum on gesprekken(leraar_id, datum desc);
create index if not exists idx_gesprekken_school       on gesprekken(school_id);
create index if not exists idx_meldcode_school_status  on meldcode_signalen(school_id, status);

-- ---------- RLS (defensieve laag; service-role omzeilt dit) ----------
alter table kenniskaarten      enable row level security;
alter table experts            enable row level security;
alter table scholen            enable row level security;
alter table leraren            enable row level security;
alter table magic_links        enable row level security;
alter table expert_magic_links enable row level security;
alter table gesprekken         enable row level security;
alter table meldcode_signalen  enable row level security;

-- Publiek leesbaar: kenniskaarten en beschikbare experts.
drop policy if exists kk_public_read on kenniskaarten;
create policy kk_public_read on kenniskaarten for select using (true);

drop policy if exists exp_public_read on experts;
create policy exp_public_read on experts for select using (beschikbaar = true);

-- Alle overige tabellen: geen anon/auth toegang. App benadert ze met de
-- service-role-key (omzeilt RLS). Voeg granulaire policies toe zodra de app
-- naar Supabase Auth migreert (zie ADR-001, vervolg-ADR).

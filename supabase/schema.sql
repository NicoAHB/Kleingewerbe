-- NvF Finanzen – Datenbank für Schritt 2 (Supabase)
-- Vorbereitet nach Abschnitt 5 und 8 des Konzepts, noch NICHT mit der App verbunden.
-- Ausführen im Supabase-Dashboard unter "SQL Editor" eines neuen, eigenen Projekts für NvF Digital.
--
-- Beträge werden als ganze Cent gespeichert (betrag_cent), damit Summen exakt stimmen.

-- ---------- Tabellen ----------

create table public.einstellungen (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  firmenname text not null default 'NvF Digital',
  gruendungsdatum date,
  gruendungsjahr boolean not null default true,
  grenze_vorjahr_cent bigint not null default 2500000,         -- 25.000 €
  grenze_laufendes_jahr_cent bigint not null default 10000000,  -- 100.000 €
  umsatz_vorjahr_cent bigint,
  logo_pfad text
);

create table public.kategorien (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  art text not null check (art in ('ausgabe', 'einnahme')),
  farbe text not null default 'cat-grau',
  symbol text,
  reihenfolge integer not null default 0
);

create table public.wiederkehrend (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  art text not null check (art in ('ausgabe', 'einnahme')),
  betrag_cent bigint not null check (betrag_cent > 0),
  anbieter text,
  kategorie_id uuid references public.kategorien on delete restrict,
  intervall text not null check (intervall in ('monatlich', 'jaehrlich')),
  naechstes_datum date not null
);

create table public.buchungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  art text not null check (art in ('ausgabe', 'einnahme')),
  datum date not null,
  betrag_cent bigint not null check (betrag_cent > 0),  -- immer positiv
  anbieter_quelle text,
  kategorie_id uuid references public.kategorien on delete restrict,
  notiz text,
  wiederkehrend_id uuid references public.wiederkehrend on delete set null,
  erstellt_am timestamptz not null default now()
);
create index buchungen_user_datum on public.buchungen (user_id, datum desc);

create table public.belege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  buchung_id uuid not null references public.buchungen on delete cascade,
  dateipfad text not null,   -- <user_id>/JJJJ/MM/dateiname im Bucket "belege"
  dateityp text not null,
  groesse bigint not null,
  erstellt_am timestamptz not null default now()
);
create index belege_buchung on public.belege (buchung_id);

-- ---------- Row Level Security: jeder sieht nur seine eigenen Daten ----------

alter table public.einstellungen enable row level security;
alter table public.kategorien enable row level security;
alter table public.wiederkehrend enable row level security;
alter table public.buchungen enable row level security;
alter table public.belege enable row level security;

create policy "eigene Einstellungen" on public.einstellungen
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigene Kategorien" on public.kategorien
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigene wiederkehrende Kosten" on public.wiederkehrend
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigene Buchungen" on public.buchungen
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigene Belege" on public.belege
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Privater Dateispeicher für Belege ----------

insert into storage.buckets (id, name, public) values ('belege', 'belege', false);

-- Erster Ordner im Pfad = eigene Nutzer-ID
create policy "Belege lesen" on storage.objects for select to authenticated
  using (bucket_id = 'belege' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Belege hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'belege' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Belege ändern" on storage.objects for update to authenticated
  using (bucket_id = 'belege' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Belege löschen" on storage.objects for delete to authenticated
  using (bucket_id = 'belege' and (storage.foldername(name))[1] = auth.uid()::text);

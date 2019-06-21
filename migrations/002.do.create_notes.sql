create table notes (
  id integer primary key generated by default as identity,
  name text not null,
  modified timestamp not null default now(),
  folderId integer references folders(id) on delete cascade not null,
  content text not null
)
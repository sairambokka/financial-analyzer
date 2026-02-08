-- ============================================================
-- STORAGE BUCKET FOR STATEMENT FILES
-- ============================================================
insert into storage.buckets (id, name, public)
values ('statements', 'statements', false);

-- Users can upload files to their own folder
create policy "Users can upload own statements"
  on storage.objects for insert
  with check (
    bucket_id = 'statements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own files
create policy "Users can read own statements"
  on storage.objects for select
  using (
    bucket_id = 'statements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
create policy "Users can delete own statements"
  on storage.objects for delete
  using (
    bucket_id = 'statements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

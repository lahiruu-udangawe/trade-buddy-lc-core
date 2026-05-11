
insert into storage.buckets (id, name, public)
values ('lc-documents', 'lc-documents', false)
on conflict (id) do nothing;

create policy "Users can view their own LC documents"
on storage.objects for select
to authenticated
using (bucket_id = 'lc-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own LC documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'lc-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own LC documents"
on storage.objects for update
to authenticated
using (bucket_id = 'lc-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own LC documents"
on storage.objects for delete
to authenticated
using (bucket_id = 'lc-documents' and auth.uid()::text = (storage.foldername(name))[1]);

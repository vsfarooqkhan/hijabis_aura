-- ============================================================================
-- Hijabisaura — 0006: product image storage
--
-- Creates the bucket product photographs live in, and locks writing to admins.
--
-- Public READ, admin-only WRITE. Product photographs are meant to be seen by
-- everyone — that is the entire point of them — but only you may put files
-- there or remove them. Without the policies below, anyone holding the
-- publishable key could upload to your storage and run up your bill.
--
-- Safe to run more than once.
-- ============================================================================

-- 5 MB per file is generous for a web product photo and small enough that a
-- phone upload on Indian mobile data still completes. The MIME allow-list stops
-- the bucket being used to host anything other than images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may look at a product photo.
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

-- Only an admin may add, replace or remove one. is_admin() is the same check the
-- rest of the schema uses, so access is granted in exactly one place.
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

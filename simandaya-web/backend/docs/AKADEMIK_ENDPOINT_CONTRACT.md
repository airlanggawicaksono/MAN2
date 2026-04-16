# Akademik Endpoint Contract

This document is the current API contract for `"/api/v1/akademik"`.
It groups endpoints by domain and labels frontend usage status.

## Kategori Kelas
- `GET /kategori-kelas?status=available|archived|all&tahun_ajaran_id=<uuid>` - used by admin akademik (`tahun_ajaran_id` optional, defaults to active tahun ajaran)
- `POST /kategori-kelas` - used by admin akademik (`tahun_ajaran_id` optional in payload, defaults to active tahun ajaran)
- `PATCH /kategori-kelas/{kategori_kelas_id}` - used by admin akademik
- `DELETE /kategori-kelas/{kategori_kelas_id}` - used by admin akademik (archive / soft delete)
- `GET /kategori-kelas/{kategori_kelas_id}/archive-impact` - used by admin akademik (archive warning preview)

## Mapel
- `GET /mapel?status=available|archived|all&tahun_ajaran_id=<uuid>` - used by admin akademik (`tahun_ajaran_id` optional, defaults to active tahun ajaran)
- `GET /mapel/{mapel_id}` - currently not used by frontend, kept for compatibility
- `POST /mapel` - used by admin akademik (`tahun_ajaran_id` optional in payload, defaults to active tahun ajaran)
- `PATCH /mapel/{mapel_id}` - used by admin akademik
- `DELETE /mapel/{mapel_id}` - used by admin akademik (archive / soft delete)
- `GET /mapel/{mapel_id}/archive-impact` - used by admin akademik (archive warning preview)

## Tahun Ajaran
- `GET /tahun-ajaran` - used by admin/guru/siswa pages
- `GET /tahun-ajaran/active` - used by jadwal active filtering
- `GET /tahun-ajaran/{tahun_ajaran_id}` - currently not used by frontend, kept for compatibility
- `POST /tahun-ajaran` - used by admin akademik
- `POST /tahun-ajaran/copy-structure` - used by admin akademik
- `PATCH /tahun-ajaran/{tahun_ajaran_id}` - used by admin akademik
- `PATCH /tahun-ajaran/{tahun_ajaran_id}/archive` - used by admin akademik (archive / non-destructive)

## Semester
- `GET /semester` - used by admin/guru/siswa pages
- `GET /semester/active` - used by jadwal active filtering
- `GET /semester/tahun-ajaran/{tahun_ajaran_id}` - currently not used by frontend, kept for compatibility
- `GET /semester/{semester_id}` - currently not used by frontend, kept for compatibility
- `POST /semester` - used by admin akademik
- `POST /semester/copy-structure` - used by admin akademik
- `PATCH /semester/{semester_id}` - used by admin akademik
- `DELETE /semester/{semester_id}` - used by admin akademik

## Kelas
- `GET /kelas` - used by admin/guru pages
- `GET /kelas/active` - used by jadwal page
- `GET /kelas/my-kelas` - used by siswa flow
- `GET /kelas/tahun-ajaran/{tahun_ajaran_id}` - used by kelas-guru-siswa page
- `GET /kelas/{kelas_id}` - currently not used by frontend, kept for compatibility
- `POST /kelas` - used by admin akademik
- `PATCH /kelas/{kelas_id}` - used by admin akademik
- `DELETE /kelas/{kelas_id}` - used by admin akademik
- `GET /kelas/{kelas_id}/siswa` - used by admin/guru pages
- `POST /kelas/{kelas_id}/siswa` - used by admin akademik
- `DELETE /kelas/{kelas_id}/siswa/{user_id}` - used by admin akademik

## Guru Mapel
- `GET /guru-mapel` - used by admin akademik
- `GET /guru-mapel/active` - used by jadwal form
- `GET /guru-mapel/my-context` - used by guru jadwal/penilaian filters (backend-driven)
- `POST /guru-mapel` - used by admin akademik
- `DELETE /guru-mapel/{guru_mapel_id}` - used by admin akademik

## Jadwal
- `GET /jadwal/kelas/{kelas_id}` - used by admin/guru pages
- `GET /my-jadwal` - used by siswa and guru page (supports optional `tahun_ajaran_id`, `semester_id`)
- `POST /jadwal` - used by admin akademik
- `PATCH /jadwal/{jadwal_id}` - currently not used by frontend, kept for compatibility
- `DELETE /jadwal/{jadwal_id}` - used by admin akademik

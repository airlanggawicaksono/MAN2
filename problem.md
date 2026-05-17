# MAN2 — Data Fragmentation Audit

Dependency map across **backend (FastAPI)**, **sijinak (Flutter Win desktop)**, **frontend (Next.js)**. Goal: find where same data live in multiple places and risk drift.

> **Naming canonical:** `nisn` is the correct field name. Any occurrence of `nis` in sijinak local DB / DTO / CSV is **inconsistent** and should be renamed to `nisn`.

---

## 1. Topology

```
[ Sijinak Flutter Win ]  --HTTP X-API-Key-->  [ Backend FastAPI ]  <--HTTP cookie+JWT--  [ Frontend Next.js ]
        |                                            ^
        |                                            |
        +--ISAPI digest-->  [ Hikvision Device ]    (no link BE <-> Hikvision)
        +--HTTP-->          [ Wablas WA ]           (BE never call Wablas yet)
```

Backend expose **2 surfaces only**:
- `/api/v1/*` → frontend (auth, users, absensi, jobs)
- `/api/desktop/*` + WS `/api/desktop/pubsub` → sijinak

---

## 2. SIJINAK → BACKEND (sijinak consume)

File: `sijinak_win/lib/data/remote/api_client.dart` → `BackendApiPort`

| sijinak call | backend route | backend file |
|---|---|---|
| `testConnection()` | `GET /api/desktop/ping` | `routers/desktop.py:98` |
| `fetchStudents()` | `GET /api/desktop/students` | `routers/desktop.py:22` |
| `syncAttendance(events)` | `POST /api/desktop/sync-attendance` | `routers/desktop.py:83` |
| `assignStudentCard(uid,rfid)` | `POST /api/desktop/students/{uid}/card-assign` | `routers/desktop.py:36` |
| `replaceStudentCard(uid,new)` | `POST /api/desktop/students/{uid}/card-replace` | `routers/desktop.py:67` |
| `removeStudentCard(uid)` | `DELETE /api/desktop/students/{uid}/card` | `routers/desktop.py:52` |

Auth: `X-API-Key` header → `verify_desktop_api_key`.

**Declared but unused:** WS `/api/desktop/pubsub` topics `desktop.students.snapshot`, `desktop.attendance.synced` published by `backend/app/pubsub/desktop_pubsub.py`. No sijinak subscriber → **dead channel**.

DTO contract:
- BE request: `dto/desktop/desktop_request.py` (`AttendanceEventDTO`, `CardAssignRequestDTO`, `CardReplaceRequestDTO`, `BulkAttendanceSyncDTO`)
- BE response: `dto/desktop/desktop_response.py` (`StudentSyncDTO`, `AttendanceAckDTO`, `BulkAttendanceResponseDTO`, `PingResponseDTO`, `CardReplaceResponseDTO`)
- Sijinak: `lib/data/remote/dto/student_sync_response_dto.dart`, `izin_dispatch_request_dto.dart`, `izin_dispatch_result_dto.dart`, `wablas_send_message_request_dto.dart`

---

## 3. BACKEND ← SIJINAK (BE writes triggered by sijinak push)

| sijinak action | BE table written | BE service |
|---|---|---|
| `sync-attendance` (absen_masuk/keluar) | `absensi` (`models/absensi.py`) | `services/desktop_service.py:_handle_absen_*` |
| `sync-attendance` (izin) | `izin_keluar` (`models/izin_keluar.py`) | `_handle_izin` |
| card-assign / replace / remove | `siswa_profile.rfid_number` | `assign/remove/replace_student_card` |
| (read only) list_students | reads `users + siswa_profile` | `repositoriy/desktop_repository.py` |

Sijinak NEVER create students on BE. Only mirror + report.

---

## 4. FRONTEND → BACKEND (Next.js consume)

Rewrite: `frontend/next.config.mjs` proxies `/api/v1/*` to `BACKEND_INTERNAL_URL`. Base query: `frontend/api/shared/base.ts` (JWT bearer + refresh).

| FE file | base path | BE router |
|---|---|---|
| `api/public/auth.ts` | `/api/v1/auth` | `routers/auth.py` (login/refresh/verify/logout) |
| `api/public/absensi.ts` | `/api/v1/absensi` | `routers/absensi.py` (list, update, settings, izin public) |
| `api/admin/students.ts` | `/api/v1/users/students` | `routers/users.py` student_router |
| `api/admin/teachers.ts` | `/api/v1/users/teachers` | `routers/users.py` teacher_router |
| `api/admin/userman.ts` | `/api/v1/users` | `routers/users.py` (public civitas, structural-assignments) |
| `api/admin/jobs.ts` | `/api/v1/jobs` | `routers/jobs.py` (imports/exports CSV) |
| `api/admin/setContentManagement.ts` | carousel slides | separate router |

FE types: `frontend/types/students.ts`, etc. — must match BE pydantic `dto/userMan`, `dto/absensi`, `dto/auth`, `dto/jobs`.

BE → FE: response DTOs only. No WS to FE.

---

## 5. EXTERNAL deps — bypass backend

Sijinak talks direct to:
- **Hikvision ISAPI** (`lib/data/hikvision/isapi_client.dart`) — upsertPerson, upsertCard, deletePerson, deleteCard, listUsers, listCards. Caller: `student_service.dart`.
- **Wablas** (`lib/services/izin_dispatch_service.dart::_sendWablas`) — `POST {wablasBaseUrl}/api/send-message`.

Backend talks to neither. **Biggest fragmentation surface.**

---

## 6. Fragmentation risks

### 6.1 `rfid_number` — 4 writers (HIGH RISK)
- FE `UpdateStudent` → BE `siswa_profile.rfid_number`
- Sijinak `assignStudentCard()` via BE API → BE same column
- Sijinak `assignCard()` direct (`student_service.dart:297`) → Hikvision + local Drift `Students.rfidNumber` (BE not informed)
- BE `desktop_service.assign_student_card` writes column

If admin use sijinak `assignCard()` path, BE doesn't know. Next BE snapshot fetch overwrites local Drift; Hikvision card stays orphan until cleanup runs.

**Fix:** single owner = BE. Sijinak must mirror only after BE ack.

### 6.2 Attendance event — 2 sources of truth
- BE `Absensi` row (canonical for FE/report)
- Sijinak `TapRecords` Drift (canonical for retry)
- FE `updateAttendance` / `deleteAttendance` mutate BE — sijinak TapRecords never reflect this.
- If FE deletes and sijinak retries unsynced record, recreates via `sync-attendance`.

**Fix:** confirm BE upsert is idempotent by `(user_id, date)`. Add server tombstone or version cursor.

### 6.3 `nisn` vs `nis` (NAMING DRIFT) — `nisn` is correct
- BE column: `nisn` ✓ canonical
- BE DTO `StudentSyncDTO.nisn` ✓
- FE type `StudentProfile.nisn` ✓
- Sijinak DTO field `nis` ✗ (mapped from BE `nisn` in `student_sync_response_dto.dart:23`)
- Sijinak Drift `Students.nis` column ✗ (`lib/data/local/tables/students.dart`)
- Sijinak CSV row key `nis` ✗ (`bulkAssignCards` in `student_service.dart`)

**Fix:** rename sijinak side everywhere: DTO field, Drift column (migration!), CSV header, `getStudentByNis` → `getStudentByNisn`. Update `sample_kartu.csv` header.

### 6.4 `user_id` UUID format — BY DESIGN
- BE: UUID with dashes (canonical, Postgres `uuid` type)
- Hikvision `employeeNo`: 32-char hex with no separators (device protocol limit, max 32 chars; dashed UUID is 36)
- Sijinak `_toUuid()` (`attendance_service.dart:31`) reconstructs dashes when receiving Hikvision events
- Not fragmentation — it's a deliberate protocol adapter

**Adapter centralized:**
- Sijinak: `hikvisionEmployeeNoFor(userId)` in `data/hikvision/isapi_client.dart`. All sijinak call sites use it.
- BE: `user_id.hex` on the pydantic UUID (Python standard) inside `_enqueue_card_sync_job` in `services/desktop_service.py`. Comment cross-references the sijinak helper.

### 6.5 `user_type=administrator` in student sync — DOWNGRADED to NOTE
Earlier I called this fragile. After re-reading, the code already has two layers protecting admins, so it's defensive-in-depth, not a bug:

1. **Local Drift protection (primary):** `studentSyncProvider.syncStudents` collects admin `user_id`s into `protectedUserIds` and passes them to `syncStudentsSnapshot`. Admins are stored in Drift alongside siswa. So `cleanupStaleFromHikvision` sees admin employeeNos in `localEmployeeNos` and skips deleting them.
2. **Device-label protection (safety net):** the same cleanup also reads `device.userType == 'administrator'` and adds those to `adminEmployeeNos`, used to skip admin cards (whose RFID BE doesn't track because admins have no `siswa_profile.rfid_number`).

**Only realistic failure:** an admin person exists on the Hikvision device but (a) is NOT mirrored into Drift via the snapshot AND (b) is NOT labeled `administrator` on the device (e.g. someone added the admin manually via the device's own web UI without setting the userType correctly). In that case cleanup may nuke that admin's card.

**If you want full local truth:** add `userType` to Drift `Students` table, populate from `StudentSyncResponseDTO.userType`, and let cleanup consult Drift first. Cheap, but the gain is small unless you have a real history of device-only admin entries. Skip unless you've seen it bite.

### 6.6 Izin / WA send path — RESOLVED
- Confirmed: Wablas is **sijinak-only**. BE has no Wablas integration.
- Stale BE `dto/wablas/` folder deleted.
- Sijinak `izin_dispatch_service` keeps direct Wablas webhook + parallel BE event post.
- **Rule:** do not add Wablas to BE. WA send stays sijinak-local.

### 6.7 Late cutoff — evolved past "good design"
- BE still **owns classification** (`desktop_settings.late_cutoff_time`, applied in `_handle_absen_masuk`).
- Sijinak now also holds a **read replica** (`DesktopSettingsStore`) populated on start via `GET /api/desktop/settings` and refreshed on `desktop.settings.changed` WS events.
- Sijinak uses the replica only for UI hints (e.g. tap snackbar shows "MASUK — TERLAMBAT" immediately, before BE acks). Never writes back to it.
- Single-owner preserved. No fragmentation.

### 6.8 Pubsub dead channel — RESOLVED
- Built `DesktopEventBus` (`lib/data/remote/desktop_event_bus.dart`) — single multiplexed WS connection with `TopicSubscriber` registry.
- Live subscribers wired:
  - `desktop.job.created` → triggers `DeviceJobWorker.tick`
  - `desktop.settings.changed` → updates `DesktopSettingsStore`
  - `desktop.absensi.changed` → drops matching local `TapRecords` via `AbsensiInvalidationSubscriber`
  - `desktop.student.deleted` → drops Drift row + unpublished `TapRecords` via `StudentDeletedSubscriber`
- Stale `desktop.students.snapshot` topic publish call removed from BE.
- `desktop.attendance.synced` still published; no consumer yet. Kept for a future admin dashboard hook — drop if nothing materializes.

### 6.9 Student deletion lag — RESOLVED
Two-rail fanout on `delete_student`:

1. **Outbox (DeviceJob)** — BE enqueues `hik.person.delete` in the same transaction as the BE delete. Payload `{user_id, employee_no, rfid_number}`. Sijinak's `HikPersonDeleteHandler` claims it and deletes person + card from Hikvision (revoke card first so the device doesn't keep an orphan card row).
2. **Invalidation (pubsub)** — BE publishes `desktop.student.deleted` on the WS bus. `StudentDeletedSubscriber` drops the local Drift row AND any unpublished `TapRecords` for that user — instantly killing the infinite retry loop and the "already signed off" lock.

Safety net for missed events: `SyncService.manualBulkSync` now recognises terminal failures (`detail` contains `"not found"`, `"tidak ditemukan"`, `"deactivat"`) and marks the offending TapRecord as published-with-timestamp so it leaves the unpublished queue. Local row stays in history for forensics.

---

## 7. Recommended next steps

1. **Rename `nis` → `nisn` everywhere in sijinak** (DTO, Drift column + migration, CSV header, method names, UI labels). Match BE canonical.
2. Pick **single owner per column**:
   - `rfid_number` owner = BE. Sijinak mirror Hikvision only after BE ack.
   - `Absensi` owner = BE. Sijinak `TapRecords` is staging buffer only.
3. Add `user_type` column to Drift `Students`.
4. Decide pubsub fate: wire sijinak WS client OR drop BE publish.
5. Add deletion cursor to `/api/desktop/students` response.
6. Document `wablas` ownership before BE adds its own WA path.

---

## 8. File pointers

**Backend**
- `backend/app/main.py` — router mount + CORS
- `backend/app/routers/desktop.py` — sijinak surface
- `backend/app/services/desktop_service.py` — sijinak business logic
- `backend/app/dto/desktop/` — sijinak request/response DTOs
- `backend/app/pubsub/desktop_pubsub.py` — WS publish (dead)
- `backend/app/repositoriy/desktop_repository.py` — DB queries
- `backend/app/models/{absensi,izin_keluar,siswa_profile,user}.py`

**Sijinak**
- `lib/data/remote/api_client.dart` — BE client
- `lib/data/remote/dto/student_sync_response_dto.dart` — uses `nis` ✗
- `lib/data/local/database.dart` + `tables/{students,tap_records}.dart` — Drift
- `lib/data/hikvision/isapi_client.dart` — Hikvision client
- `lib/services/{attendance,student,sync,server,izin_dispatch}_service.dart`
- `lib/services/app_pubsub.dart` — local FBroadcast (NOT WS to BE)
- `sample_kartu.csv` — CSV header uses `nis` ✗

**Frontend**
- `frontend/next.config.mjs` — rewrites `/api/v1/*` + `/api/desktop/*`
- `frontend/api/shared/base.ts` — auth-aware fetch
- `frontend/api/{admin,public}/*.ts` — RTK Query slices
- `frontend/types/students.ts` — uses `nisn` ✓

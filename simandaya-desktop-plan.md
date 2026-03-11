# Simandaya Desktop - Architecture Plan

## Overview

A Flutter Windows desktop app (`sijinak_win/`) running on a dedicated gate PC that:
1. Listens to Hikvision RFID reader via ISAPI `alertStream`
2. Auto-records attendance (masuk/keluar) to local SQLite on card tap
3. Shows webview of simandaya-web frontend for live dashboard
4. Syncs tap records to FastAPI backend via WebSocket *(pending)*

---

## Part 1: Backend Changes (FastAPI) — DONE

> Desktop app handles `card_no → user_id` mapping locally. Backend only knows `user_id`.

### 1a. Settings & Auth — DONE

- Added `DESKTOP_API_KEY` to `app/config/settings.py` and `.env.example`
- Added `verify_desktop_api_key` dependency in `app/dependencies.py` (X-API-Key header)

### 1b. DesktopSettings Model — DONE

- `app/models/desktop_settings.py` — singleton row (id=1) with `late_cutoff_time` (default 07:15)
- Registered in `app/config/database.py` `init_db()`

### 1c. DTOs — DONE

- `app/dto/desktop/desktop_request.py` — `AttendanceEventDTO`, `UpdateDesktopSettingsDTO`
- `app/dto/desktop/desktop_response.py` — `StudentSyncDTO`, `AttendanceAckDTO`, `DesktopSettingsDTO`

### 1d. DesktopService — DONE

- `app/services/desktop_service.py`
- `list_students()` — all active siswa with profile info
- `process_attendance_event()` — handles absen_masuk (Hadir/Terlambat based on cutoff), absen_keluar, izin
- `get_settings()` / `update_settings()` — singleton CRUD

### 1e. Desktop Router — DONE

- `app/routers/desktop.py`, registered in `app/main.py`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/desktop/students` | API Key | Student list for RFID mapping |
| `GET` | `/api/desktop/settings` | API Key | Get late cutoff config |
| `PUT` | `/api/desktop/settings` | JWT (Admin) | Update cutoff time |
| `WS` | `/api/desktop/ws?api_key=<key>` | Query param | Attendance events (bidirectional) |

### WebSocket Protocol

- Desktop sends: `{record_id, user_id, event_type, device_time, reason?}`
- Server replies: `{record_id, status: "ok"|"error", published_at, detail?}`

---

## Part 2: Flutter Desktop App — DONE

### Project Structure (actual)

```
sijinak_win/
├── lib/
│   ├── main.dart
│   ├── config/
│   │   └── app_config.dart           # Hikvision IP/creds, server URL, API key, frontendUrl
│   ├── data/
│   │   ├── local/
│   │   │   ├── database.dart         # Drift DB + all queries
│   │   │   └── tables/
│   │   │       ├── students.dart     # userId PK, cardNo, nama, nis, kelas, syncedAt, hikRegistered
│   │   │       └── tap_records.dart  # id, cardNo, eventType, deviceTime, reason, hikSerialNo, createdAt, publishedAt
│   │   ├── hikvision/
│   │   │   ├── isapi_client.dart     # dart:io HttpClient + manual Digest auth
│   │   │   ├── alert_stream.dart     # Long-lived GET /alertStream, JSON+XML parsing
│   │   │   ├── event_poller.dart     # POST /AcsEvent polling with paging
│   │   │   └── hik_event.dart        # HikEvent + DeviceInfo models
│   │   └── remote/
│   │       ├── api_client.dart       # REST: GET /api/desktop/students (X-API-Key)
│   │       └── [ws_sync.dart]        # WebSocket sync — NOT YET IMPLEMENTED
│   ├── services/
│   │   ├── hikvision_service.dart    # Orchestrates AlertStream + catch-up polling
│   │   ├── attendance_service.dart   # HikEvent -> masuk/keluar decision -> TapRecord insert
│   │   ├── student_service.dart      # Hikvision person/card management + CSV bulk assign
│   │   ├── server_service.dart       # Server connection test (/api/desktop/settings)
│   │   └── [sync_service.dart]       # Background queue -> server — NOT YET IMPLEMENTED
│   ├── ui/
│   │   ├── screens/
│   │   │   ├── app_shell.dart        # Shell with nav + starts HikvisionService + AttendanceService
│   │   │   ├── dashboard.dart        # Connection status + recent tap events
│   │   │   ├── students_screen.dart  # Student list + bulk Hik push + CSV card import
│   │   │   ├── absensi_screen.dart   # WebView (webview_windows) of frontendUrl/beranda
│   │   │   └── settings_screen.dart  # Hikvision + server config
│   │   └── widgets/
│   │       ├── card_scan_dialog.dart       # Manual card scan with device-time filtering
│   │       ├── bulk_push_dialog.dart       # Push all students to Hikvision
│   │       └── bulk_card_assign_dialog.dart # CSV card assignment with progress
│   └── providers/                          # Riverpod
├── pubspec.yaml
```

### Key Packages

| Package | Purpose |
|---|---|
| `drift` + `sqlite3_flutter_libs` | Local SQLite |
| `dart:io` HttpClient + Digest auth | Hikvision ISAPI (no Dio) |
| `webview_windows` | Absensi screen webview |
| `file_picker` | CSV file selection for bulk card import |
| `riverpod` | State management |
| `[web_socket_channel]` | Sync to FastAPI — not yet added |

---

## Part 3: Core Flows

### 3a. Hikvision alertStream — DONE

```
1. AlertStream opens GET /ISAPI/Event/notification/alertStream (Digest auth, keep-alive)
2. Parses multipart/mixed chunks
3. Tries JSON first (DS-K1T341 sends JSON), falls back to XML
4. ALL JSON events update lastDeviceTime (including non-card noise)
5. Card events (cardNo present) -> emitted as HikEvent
6. lastSerialNo tracked for catch-up
7. On disconnect -> auto-reconnect (3s retry)
8. HikvisionService monitors status: on reconnect -> EventPoller.pollAll(lastSerialNo+1) catch-up
```

**lastDeviceTime note:** Extracted from `dateTime` field of ALL JSON events (even heartbeats/noise),
not just card events. Used by CardScanDialog to filter duplicate taps (only accept events where
device time > lastDeviceTime + 2s).

### 3b. Attendance Recording — DONE

```
AttendanceService listens to HikvisionService.events stream:
1. Lookup student by employeeNo (UUID reconstructed from 32-hex) -> fallback to cardNo
2. If unknown card -> ignore
3. Query today's tap_records for this cardNo
4. todayTaps.isEmpty -> eventType = "absen_masuk"
   todayTaps.isNotEmpty -> eventType = "absen_keluar"
5. Insert TapRecord with id="${cardNo}_${serialNo}" (UNIQUE guard)
6. Fire onTapRecorded callback -> dashboard updates live
```

No manual popup — tap type is auto-determined by today's record count.

### 3c. Background Sync — DONE

```
1. On startup: connect WebSocket to /api/desktop/ws?api_key=<key>
2. Worker loop: watch tap_records WHERE publishedAt IS NULL
3. Send each record: {record_id, user_id, event_type, device_time, reason}
4. On server ack -> update publishedAt locally
5. On disconnect -> queue keeps growing, retry connection every 5s
6. On reconnect -> flush entire queue
```

### 3d. Student Sync — DONE

```
ApiClient.fetchStudents() -> GET /api/desktop/students
Triggered on Dashboard initialization or manually via sync button.
Upserts into local DB with StudentsCompanion.
```

---

## Part 4: Local SQLite Schema (actual)

### students

| Column | Type | Notes |
|---|---|---|
| userId | TEXT | PK — UUID from server |
| cardNo | TEXT | Nullable, assigned card |
| nama | TEXT | Student name |
| nis | TEXT | Nullable, student NIS |
| kelas | TEXT | Nullable, class/jurusan |
| syncedAt | INTEGER | Nullable, epoch |
| hikRegistered | BOOL | Whether pushed to Hikvision device |

### tap_records

| Column | Type | Notes |
|---|---|---|
| id | TEXT | PK — format: `${cardNo}_${serialNo}` |
| cardNo | TEXT | RFID card number |
| eventType | TEXT | absen_masuk / absen_keluar / izin |
| deviceTime | INTEGER | Epoch from Hikvision event dateTime |
| reason | TEXT | Nullable, for izin keterangan |
| hikSerialNo | INTEGER | Nullable, Hikvision event serial |
| createdAt | INTEGER | Epoch |
| publishedAt | INTEGER | Nullable, set on server ack |

**Unique constraint:** `(cardNo, deviceTime)` — prevents duplicate events from alertStream + polling overlap

---

## Part 5: Hikvision ISAPI Reference

### Authentication
- Manual HTTP Digest auth via `dart:io` HttpClient
- Credentials: configured in app settings (IP, username, password)
- Device: `192.168.40.181`, user `admin`

### Key Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/ISAPI/Event/notification/alertStream` | GET | Real-time event stream (primary) |
| `/ISAPI/AccessControl/AcsEvent?format=json` | POST | Poll events by serialNo (catch-up) |
| `/ISAPI/System/deviceInfo` | GET | Verify connection / test |
| `/ISAPI/AccessControl/UserInfo/Record?format=json` | POST | Upsert person |
| `/ISAPI/AccessControl/CardInfo/Record?format=json` | PUT | Upsert card assignment |
| `/ISAPI/AccessControl/CardInfo/Delete?format=json` | PUT | Delete card from device |
| `/ISAPI/AccessControl/UserInfo/Delete?format=json` | PUT | Delete person(s) from device |

### alertStream Response Format

Multipart/mixed with boundary. Each part:
- `Content-Type: application/json` (DS-K1T341 series) or `application/xml`
- JSON: `{ "dateTime": "...", "cardNo": "...", "employeeNoString": "...", "AccessControllerEvent": { "serialNo": ... } }`
- XML: `<EventNotificationAlert>` with `<cardNo>`, `<dateTime>`, `<serialNo>` tags

### employeeNo ↔ UUID conversion

```dart
// UUID -> Hikvision employeeNo (strip hyphens, 36 -> 32 chars)
final employeeNo = userId.replaceAll('-', '');

// Hikvision employeeNo -> UUID (re-insert hyphens)
final uuid = '${h.substring(0,8)}-${h.substring(8,12)}-${h.substring(12,16)}'
             '-${h.substring(16,20)}-${h.substring(20)}';
```

### AcsEvent Polling (catch-up)

```json
{
  "AcsEventCond": {
    "searchID": "poll",
    "searchResultPosition": 0,
    "maxResults": 30,
    "major": 5,
    "minor": 0,
    "beginSerialNo": LAST_KNOWN + 1
  }
}
```
Response `responseStatusStrg == "MORE"` means page through with next serialNo.

---

## Part 6: Reliability Design

| Concern | Solution |
|---|---|
| alertStream drops | Auto-reconnect loop (3s retry) in AlertStream |
| Missed events during gap | EventPoller.pollAll() catch-up on reconnect |
| Hikvision device reboot | Same reconnect loop handles it |
| Duplicate card events | `lastDeviceTime + 2s` filter in CardScanDialog; UNIQUE(cardNo, deviceTime) in DB |
| App crash | Windows Task Scheduler auto-restart *(not yet configured)* |
| Internet down | Local SQLite queues everything (publishedAt NULL) |
| FastAPI server down | WebSocket reconnect + queue flush on recovery *(sync not yet built)* |

---

## Part 7: Status & Next Steps

### Done
- [x] Backend changes (Part 1)
- [x] Flutter scaffold: Drift DB, config screen, Riverpod providers
- [x] Hikvision integration: IsapiClient (Digest), AlertStream (JSON+XML), EventPoller, HikvisionService
- [x] AttendanceService: auto masuk/keluar recording from card taps
- [x] Student management: bulk push to Hikvision, CSV card import (file_picker)
- [x] Absensi screen: webview (webview_windows), no URL bar, loads frontendUrl/beranda
- [x] Dashboard: live tap events, Hikvision connection status
- [x] Settings: Hikvision + server config + connection test
- [x] **WebSocket sync**: `ws_sync.dart` + `sync_service.dart` — send unpublished tap_records to `/api/desktop/ws`
- [x] **Student sync from server**: on startup call `ApiClient.fetchStudents()` and upsert into local DB
- [x] **Izin flow**: UI for recording `izin` event type with keterangan

### Pending
- [ ] **Windows auto-start**: Task Scheduler or startup shortcut

---

## Part 8: Backend Models (Reference)

### Absensi (absensi table)
- `absensi_id` UUID PK
- `user_id` FK -> users (CASCADE)
- `tanggal` Date
- `time_in` DateTime nullable
- `time_out` DateTime nullable
- `status` Enum: Hadir, Terlambat, Alfa, Sakit, Izin
- `marked_by` FK -> users (SET NULL)
- **UNIQUE:** `(user_id, tanggal)` — one record per student per day

### IzinKeluar (izin_keluar table)
- `izin_id` UUID PK
- `user_id` FK -> users (CASCADE)
- `created_at` DateTime
- `keterangan` String (reason)
- `waktu_kembali` DateTime nullable
- No unique constraint — multiple izin per day allowed

### SiswaProfile (siswa_profiles table)
- `siswa_id` UUID PK
- `user_id` FK -> users (CASCADE)
- `nis` String(50) unique nullable
- `nama_lengkap` String(225)
- `kelas_jurusan` String(100) nullable
- Note: card_no mapping lives in desktop SQLite (`students.cardNo`), not on server

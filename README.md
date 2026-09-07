# Dexa HRIS • WFH Attendance & Employee Management System

Aplikasi web **Enterprise HRIS Monolith** untuk **Presensi Kerja Dari Rumah (WFH) Karyawan** dan **Monitoring serta Laporan Kehadiran Real-time oleh HR Administrator**, dibangun menggunakan arsitektur **NestJS Monolith REST API**, database **MySQL**, dan antarmuka enterprise modern **React.js + TypeScript** dengan bahasa desain **shadcn/ui** serta identitas visual resmi **Dexa Group**.

---

## 1. Arsitektur & Prinsip Rekayasa Perangkat Lunak

Aplikasi ini dirancang mengikuti kaidah rekayasa perangkat lunak modern dan **Prinsip SOLID**:
- **Single Responsibility Principle (SRP)**: Controller, Service, Guard, dan Entity pada backend terisolasi. Komponen UI frontend (`DataTable`, `DurationBadge`, `GoogleMapPreview`, `PermissionModal`) masing-masing memikul satu tanggung jawab terpisah.
- **Open/Closed Principle (OCP)**: Komponen generic `DataTable<T>` dan arsitektur modular NestJS siap diekstensi tanpa merombak kode internal.
- **Liskov Substitution Principle (LSP)**: Seluruh strategy (`JwtStrategy`), guards (`CanActivate`), dan repositori TypeORM dapat disubstitusi (misal dengan mock objek pada unit testing) tanpa inkonsistensi.
- **Interface Segregation Principle (ISP)**: Interface dan DTO dibuat ramping (`User`, `Attendance`, `EmployeeAuditLog`, `Column<T>`).
- **Dependency Inversion Principle (DIP)**: Menerapkan *Inversion of Control* (IoC) via Dependency Injection NestJS dan React Context (`AuthContext`, `apiClient`).
- **Don't Repeat Yourself (DRY)**: Seluruh kalkulasi durasi jam kerja diekstrak ke dalam [`DurationBadge.tsx`](frontend/src/components/DurationBadge.tsx) dan manipulasi tanggal terpusat di [`date.ts`](frontend/src/utils/date.ts).

### Backend (NestJS Monolith + TypeORM + MySQL)
- **Monolithic Architecture**: Single REST API backend tanpa kompleksitas microservices yang berlebih.
- **Modul Utama (`backend/src/`)**:
  - `auth`: Autentikasi JWT (Passport JWT Strategy, bcrypt password hashing, Role-based Access Control: `ADMIN_HRD` dan `EMPLOYEE`).
  - `employees`: Manajemen Master Data Karyawan (CRUD, NIK unik, email unik, konfigurasi jadwal shift kerja, dan audit logging).
  - `attendance`: Manajemen presensi WFH (clock-in, clock-out, bukti foto selfie live, koordinat GPS murni perangkat, snapshot jadwal shift, monitoring real-time hari ini, dan rekapitulasi laporan periode).
  - `database`: Koneksi TypeORM tersambung langsung ke MySQL (`127.0.0.1:3308`, database `dexa`).
- **Penyimpanan Berkas**: Upload foto selfie WFH disimpan di `/uploads/proofs/` dan disajikan statis via `@nestjs/serve-static`.
- **Unit Testing**: Konfigurasi Jest & `@nestjs/testing` dengan mocked repository TypeORM (**39 test cases, 100% PASS**).

### Frontend (React.js + TypeScript + Dexa Brand Identity)
- **Identitas Visual Resmi Dexa Group**:
  - Primary Corporate Red: `#B12523`
  - Deep Burgundy Header Gradient: `linear-gradient(135deg, #8B1816 0%, #B12523 55%, #C62828 100%)`
  - Soft Red Tint / Surface: `#FEF2F2` & Border `#FECACA`
  - Tipografi modern bersih dan kelas `.tabular-nums` untuk perataan angka jam, NIK, dan koordinat.
- **Tampilan Responsif & Mobile-Friendly**:
  - **Segmented View Switcher**: Pengguna mobile (< 768px) dapat beralih antara tampilan **[ 📇 Kartu ]** (nyaman untuk scrolling vertikal satu jempol) dan **[ 📊 Tabel ]** (dengan *smooth touch horizontal scroll*).
  - **Zero Horizontal Scroll di Desktop**: Kolom dialokasikan secara proporsional 100% sehingga pas sempurna di layar monitor/laptop.
- **Komponen Utama (`frontend/src/`)**:
  - `DataTable.tsx`: Tabel enterprise generic dengan instant search, paginasi dinamis, card view mobile, dan auto layout.
  - `DurationBadge.tsx`: Komponen visual durasi kerja mandiri dengan progress bar pemenuhan 8 jam kerja dan live pulsing timer.
  - `CameraCapture.tsx`: Circular viewfinder kamera selfie live via `navigator.mediaDevices.getUserMedia` (anti-fraud, tanpa opsi upload galeri).
  - `GoogleMapPreview.tsx`: Preview peta interaktif Google Maps embed berdasarkan koordinat GPS presensi murni perangkat.
  - `PermissionModal.tsx`: Dialog panduan interaktif saat browser memblokir akses izin kamera atau lokasi.
  - `ImageLightbox.tsx`: Dialog audit foto presensi resolusi penuh beserta verifikasi koordinat, peta, jadwal shift, dan catatan kerja.
  - `StatCard.tsx` & `StatusBadge.tsx`: Metrik KPI dashboard dan indikator status presensi/karyawan.

---

## 2. Fitur Utama Sistem

### A. Fitur Karyawan (Employee Portal)
1. **Presensi Masuk (Clock-In) & Pulang (Clock-Out)**:
   - **Anti-Fraud Live Camera**: Pengambilan foto selfie WFH murni melalui live webcam (tombol upload galeri telah ditiadakan sepenuhnya).
   - **Sensor GPS Perangkat Murni**: Mengharuskan deteksi koordinat GPS asli dari perangkat (*strict GPS*, tanpa koordinat default/palsu). Dilengkapi tombol refresh koordinat dan status kunci GPS.
   - **Catatan Pekerjaan**: Rencana kerja saat clock-in dan laporan hasil kerja saat clock-out.
2. **Penjadwalan Shift Kerja Karyawan**:
   - Banner shift aktif (misal `09:00 - 18:00 (Reguler)`, `08:00 - 17:00 (Shift Pagi)`, `13:00 - 22:00 (Shift Siang)`, atau `Flexible`).
   - Snapshot jadwal kerja tersimpan permanen pada setiap transaksi presensi.
3. **Riwayat Presensi Pribadi & Rekapitulasi Jam Kerja**:
   - Menampilkan riwayat kehadiran harian dengan status pemenuhan jam kerja, avatar selfie masuk (hijau) & pulang (merah), serta audit bukti lokasi.

### B. Fitur HR Administrator (HR Portal)
1. **Monitoring Presensi Hari Ini (Live Real-time)**:
   - Terkunci khusus untuk kehadiran **hari ini** secara real-time.
   - Durasi kerja berjalan real-time dengan **live pulsing dot** biru bagi karyawan yang sedang aktif bekerja.
   - Filter departemen dan status kehadiran.
   - Ringkasan KPI harian (Total Karyawan Aktif, Presensi Masuk, Sedang Bekerja, Selesai Bekerja, Rasio Kehadiran).
2. **Laporan Presensi (Rekapitulasi & Export Excel)**:
   - Filter rentang tanggal fleksibel (`Dari Tanggal` s/d `Sampai Tanggal`).
   - Tombol preset instan: *Hari Ini, 7 Hari Terakhir, Bulan Ini, 30 Hari Terakhir*.
   - **Pemisahan Kolom Status & Durasi Kerja**:
     - Kolom **Status** (10%): Badge status kehadiran (*Tepat Waktu*, *Terlambat*, *Sedang Kerja*).
     - Kolom **Durasi Kerja** (15%): Menampilkan jam kerja tabular `${jam}j ${menit}m`, tag pencapaian (`✓ Lengkap` $\ge$ 8h atau `⚠ <8 Jam`), dan **progress bar** visual.
   - Metrik akumulasi periode: Total Presensi, Selesai Bekerja, Jam Kerja Kumulatif, dan Rata-rata jam kerja/hari.
   - **Export ke Microsoft Excel (.xlsx)**: Mengunduh rekapitulasi data lengkap 14 kolom berformat rapi via SheetJS (`xlsx`).
3. **Direktori & Master Data Karyawan (CRUD)**:
   - Tambah, edit, dan hapus data karyawan.
   - Pengaturan jadwal shift kerja per karyawan.
   - Pengaturan role (`ADMIN_HRD` / `EMPLOYEE`) dan status (`ACTIVE` / `INACTIVE`).
4. **Audit Log & Jejak Riwayat Perubahan Data Karyawan**:
   - Pencatatan otomatis setiap penambahan (`CREATE`), pembaruan atribut profil (`UPDATE`), perubahan status akun (`STATUS_CHANGE`), maupun penghapusan.
   - Menyimpan informasi aktor HR yang mengubah, waktu, serta komparasi nilai lama vs baru (*diff viewer* per atribut).
   - Tombol **Log** di samping tombol Edit pada tabel Direktori Karyawan untuk menampilkan modal riwayat audit secara real-time.

---

## 3. Kredensial Pengujian (Demo Accounts)

| Role | Email / NIK | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **HR Administrator** | `hrd@dexa.com` / `HRD-001` | `password123` | Monitoring Hari Ini, Laporan Presensi (Export Excel), Direktori Karyawan, Audit Log |
| **Karyawan 1 (Senior Dev)** | `budi@dexa.com` / `EMP-001` | `password123` | Presensi WFH (Shift Reguler 09-18) & Riwayat Presensi |
| **Karyawan 2 (Product)** | `siti@dexa.com` / `EMP-002` | `password123` | Presensi WFH & Riwayat Presensi |

*(Halaman login dilengkapi tombol satu-klik **"Akun Pengujian Cepat"** untuk kemudahan evaluasi).*

---

## 4. Cara Menjalankan Project

Anda dapat menjalankan project dengan **Docker Compose (Sekali Command)** atau **Manual Development Lokal**:

### 🐳 Metode 1: Menggunakan Docker Compose (Sekali Command - Direkomendasikan)

Seluruh service (MySQL, Backend NestJS, dan Frontend Nginx React) telah dikonfigurasi dalam `docker-compose.yml` di root direktori.

```bash
# Jalankan seluruh stack container di background
docker compose up --build -d
```

> **Catatan Otomatisasi Docker:**
> - Container `dexa-mysql` otomatis siap dengan database `dexa` pada port host `3309` (dapat dikonfigurasi via `MYSQL_PORT`).
> - Container `dexa-backend` otomatis menunggu MySQL *healthy*, menjalankan seeder akun awal (`hrd@dexa.com`, dll), lalu menjalankan NestJS pada port `3000`.
> - Container `dexa-frontend` otomatis meng-compile aset produksi dan menyajikan via Nginx pada port `5173` dengan reverse proxy API otomatis.

#### Akses Aplikasi via Docker:
- **Frontend Portal**: [`http://localhost:5173`](http://localhost:5173)
- **Backend REST API**: [`http://localhost:3000`](http://localhost:3000)
- **MySQL Database**: `localhost:3309` (User: `root`, Password: `rahasia`, Database: `dexa`)

#### Menghentikan Container Docker:
```bash
docker compose down
# Atau hapus volume jika ingin reset database total:
docker compose down -v
```

---

### 💻 Metode 2: Menjalankan Manual (Development Lokal)

#### Prasyarat:
- **Node.js**: v18+ atau v20+
- **MySQL Database**: Berjalan di `127.0.0.1:3308` (database `dexa`, user `root`, password sesuai `.env`).

#### A. Backend (NestJS Monolith)
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Jalankan database seeder (Admin HRD & sampel karyawan)
npm run seed

# 3. Menjalankan Unit Tests (Jest - 39 test cases)
npm test

# Atau cek laporan coverage unit test:
npm run test:cov

# 4. Jalankan server backend (Development / Watch)
npm run start:dev

# Atau jalankan build produksi:
npm run build && npm run start:prod
```
- Server REST API aktif di: `http://127.0.0.1:3000`

#### B. Frontend (React.js + Vite)
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Jalankan server pengembangan Vite
npm run dev

# Atau validasi build produksi:
npm run build
```
- Antarmuka frontend aktif di: `http://127.0.0.1:5173`

---

## 5. Endpoint REST API Utama

| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login akun (mengembalikan JWT token & profil) | Publik |
| `GET` | `/api/auth/me` | Mengambil profil user yang sedang login | Authenticated |
| `POST` | `/api/attendance/clock-in` | Presensi masuk (foto selfie, GPS location, catatan) | Karyawan |
| `POST` | `/api/attendance/clock-out` | Presensi pulang (foto selfie, GPS location, catatan) | Karyawan |
| `GET` | `/api/attendance/today` | Mengambil status presensi karyawan hari ini | Karyawan |
| `GET` | `/api/attendance/my-history` | Mengambil riwayat presensi pribadi (param: `limit`) | Karyawan |
| `GET` | `/api/attendance/monitoring` | Monitoring presensi real-time hari ini (filter: `date`, `dept`, `status`) | HR Admin |
| `GET` | `/api/attendance/reports` | Laporan presensi rekapitulasi (filter: `startDate`, `endDate`, `dept`, `status`) | HR Admin |
| `GET` | `/api/attendance/dashboard-stats` | Statistik agregat metrik presensi harian | HR Admin |
| `GET` | `/api/employees` | Mengambil daftar seluruh karyawan (filter: `search`, `dept`) | HR Admin |
| `GET` | `/api/employees/:id` | Mengambil detail satu karyawan | HR Admin |
| `POST` | `/api/employees` | Menambah data karyawan baru (termasuk shift kerja) | HR Admin |
| `PUT` | `/api/employees/:id` | Memperbarui data karyawan (termasuk shift kerja) | HR Admin |
| `DELETE` | `/api/employees/:id` | Menghapus data karyawan | HR Admin |
| `GET` | `/api/employees/:id/audit-logs` | Mengambil riwayat jejak audit perubahan data profil karyawan | HR Admin |
| `GET` | `/api/employees/stats` | Mengambil statistik agregat karyawan per departemen | HR Admin |

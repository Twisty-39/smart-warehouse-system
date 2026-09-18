# 🚀 PANDUAN LENGKAP DEPLOYMENT KE AZURE VIRTUAL MACHINE (VM)
## InvWare — Smart Warehouse & Inventory Management System
**Fullstack Architecture: React 19 SPA + ASP.NET Core 10 Web API + Microsoft SQL Server 2022 + Nginx Reverse Proxy**

Dokumen ini berisi panduan *step-by-step* (langkah demi langkah) dari nol sampai aplikasi aktif dan bisa diakses publik melalui browser menggunakan **Azure Virtual Machine (Linux Ubuntu)**.

---

## 📋 DAFTAR ISI
1. [Spesifikasi Virtual Machine yang Disarankan](#1-spesifikasi-virtual-machine-yang-disarankan)
2. [Langkah 1: Membuat VM di Azure Portal](#langkah-1-membuat-vm-di-azure-portal)
3. [Langkah 2: Konfigurasi Jaringan & Port Firewall (NSG)](#langkah-2-konfigurasi-jaringan--port-firewall-nsg)
4. [Langkah 3: Remote Masuk ke VM via SSH](#langkah-3-remote-masuk-ke-vm-via-ssh)
5. [Langkah 4: Instalasi Docker & Docker Compose (1-Klik)](#langkah-4-instalasi-docker--docker-compose-1-klik)
6. [Langkah 5: Mengunduh Kode & Menjalankan Aplikasi](#langkah-5-mengunduh-kode--menjalankan-aplikasi)
7. [Langkah 6: Inisialisasi Database SQL Server](#langkah-6-inisialisasi-database-sql-server)
8. [Langkah 7: Verifikasi & Pengujian di Browser](#langkah-7-verifikasi--pengujian-di-browser)
9. [Langkah 8: (Opsional) Mengaktifkan Domain & HTTPS / SSL Gratis](#langkah-8-opsional-mengaktifkan-domain--https--ssl-gratis)
10. [Perintah Berguna untuk Monitoring & Pemeliharaan](#perintah-berguna-untuk-monitoring--pemeliharaan)

---

## 1. Spesifikasi Virtual Machine yang Disarankan

Karena sistem menggunakan **Microsoft SQL Server**, dibutuhkan memori RAM yang cukup:

| Komponen | Rekomendasi Minimum *(Hemat Biaya / Azure Student)* | Rekomendasi Optimal *(Produksi Lancar)* |
| :--- | :--- | :--- |
| **Ukuran VM (Size)** | **Standard_B2s** (2 vCPU, 4 GiB RAM) | **Standard_B2ms** (2 vCPU, 8 GiB RAM) |
| **Sistem Operasi (OS)** | **Ubuntu Server 22.04 LTS** atau **24.04 LTS (x64 Gen2)** | **Ubuntu Server 22.04 LTS (x64 Gen2)** |
| **Disk Storage** | 30 GiB Standard SSD | 64 GiB Premium SSD |
| **Estimasi Biaya** | ~$30/bulan (Gratis via Azure Student Credit) | ~$60/bulan |

---

## Langkah 1: Membuat VM di Azure Portal

1. Masuk ke **[Azure Portal](https://portal.azure.com/)**.
2. Cari dan pilih menu **Virtual Machines** ➔ Klik **+ Create** ➔ **Azure virtual machine**.
3. Isi tab **Basics**:
   - **Subscription**: Pilih langganan Azure Anda (misal: *Azure for Students* atau *Pay-As-You-Go*).
   - **Resource group**: Buat baru, beri nama misalnya `rg-invware-prod`.
   - **Virtual machine name**: Beri nama, misalnya `vm-invware-server`.
   - **Region**: Pilih yang terdekat dengan Indonesia, misalnya **Southeast Asia (Singapore)** atau **East Asia (Hong Kong)**.
   - **Security type**: `Standard`.
   - **Image**: Pilih **Ubuntu Server 22.04 LTS - x64 Gen2**.
   - **Size**: Klik *See all sizes* ➔ Cari dan pilih **B2s** (4 GB RAM) atau **B2ms** (8 GB RAM).
4. Isi **Administrator account**:
   - **Authentication type**: Pilih **Password** (agar mudah bagi pemula) atau **SSH public key**.
   - **Username**: Masukkan `azureuser`.
   - **Password**: Masukkan kata sandi yang kuat (simpan di catatan Anda).
5. Pada bagian **Inbound port rules**:
   - **Public inbound ports**: Pilih **Allow selected ports**.
   - **Select inbound ports**: Centang **SSH (22)**, **HTTP (80)**, dan **HTTPS (443)**.
6. Klik tombol biru **Review + create** di bagian bawah, lalu klik **Create**. Tunggu sekitar 1–2 menit hingga pembuatan VM selesai (*Deployment Succeeded*).

---

## Langkah 2: Konfigurasi Jaringan & Port Firewall (NSG)

Setelah VM selesai dibuat, klik tombol **Go to resource**:
1. Catat **Public IP address** VM Anda (misalnya: `20.198.xxx.xxx`).
2. Di menu bilah samping kiri VM, klik **Networking** ➔ **Network settings**.
3. Pastikan pada tabel **Inbound port rules** terdapat 3 port berikut dengan status **Allow**:
   - Port `22` (SSH)
   - Port `80` (HTTP)
   - Port `443` (HTTPS)
   - *(Opsional)* Port `1433` (SQL Server) jika Anda ingin membuka database langsung dari laptop menggunakan SSMS (*SQL Server Management Studio*).

---

## Langkah 3: Remote Masuk ke VM via SSH

Buka **Terminal** di laptop Anda (Command Prompt / PowerShell di Windows, atau Terminal di Mac/Linux), lalu jalankan perintah:

```bash
ssh azureuser@<IP_PUBLIK_VM_ANDA>
```
*Contoh:*
```bash
ssh azureuser@20.198.88.105
```
Ketik `yes` saat muncul konfirmasi *fingerprint*, lalu masukkan kata sandi VM yang Anda buat di Langkah 1. Anda sekarang sudah masuk ke dalam terminal Ubuntu server Azure!

---

## Langkah 4: Instalasi Docker & Docker Compose (1-Klik)

Jalankan perintah berikut di dalam terminal SSH server Anda untuk memperbarui sistem dan memasang Docker secara otomatis:

```bash
# 1. Update sistem operasi
sudo apt-get update && sudo apt-get upgrade -y

# 2. Pasang Docker Engine resmi
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Izinkan user tanpa perlu selalu mengetik 'sudo'
sudo usermod -aG docker $USER

# 4. Aktifkan Docker service
sudo systemctl enable docker
sudo systemctl start docker

# 5. Reload session user
newgrp docker
```

*Verifikasi instalasi:*
```bash
docker --version
docker compose version
```
*(Keduanya akan menampilkan versi Docker terbaru).*

---

## Langkah 5: Mengunduh Kode & Menjalankan Aplikasi

1. **Clone repositori proyek Anda dari GitHub ke server Azure:**
```bash
git clone https://github.com/<USERNAME_GITHUB_ANDA>/<NAMA_REPO>.git invware
cd invware
```

2. **Siapkan berkas konfigurasi `.env`:**
```bash
cp .env.example .env
```
*(Opsional: Anda bisa mengedit kata sandi SQL Server di dalam `.env` menggunakan `nano .env`).*

3. **Jalankan aplikasi menggunakan Docker Compose:**
```bash
docker compose up -d --build
```
> **Apa yang terjadi saat perintah ini berjalan?**
> - Sistem otomatis mengunduh Microsoft SQL Server 2022.
> - Mengompilasi source code C# ASP.NET Core 10 Web API menjadi release bundle.
> - Mem-build static asset React 19 + Vite ke format HTML/JS/CSS minified.
> - Menyalakan Nginx web server sebagai reverse-proxy port 80.

4. **Periksa status container:**
```bash
docker compose ps
```
Semua container (`invware-db`, `invware-backend`, dan `invware-frontend`) akan berstatus **Up / Healthy**.

---

## Langkah 6: Inisialisasi Database SQL Server

Saat backend dinyalakan untuk pertama kalinya, **Entity Framework Core otomatis menjalankan migrasi & `DbSeeder`** (membuat seluruh tabel dan mengisi 20+ data awal otomatis).

Jika Anda ingin mengeksekusi skrip SQL mandiri ([`init_database.sql`](file:///d:/FAJAR%20SIDIK/Portofolio/Smart%20Warehouse%20&%20Inventory%20Management%20System/backend/SmartWarehouse.Api/Data/Scripts/init_database.sql)) secara manual ke dalam container SQL Server:

```bash
# Eksekusi script SQL langsung ke container DB
docker exec -i invware-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "Password123!SafeStrong" -C \
  -i backend/SmartWarehouse.Api/Data/Scripts/init_database.sql
```

---

## Langkah 7: Verifikasi & Pengujian di Browser

Buka browser laptop atau handphone Anda, lalu kunjungi:
```text
http://<IP_PUBLIK_VM_ANDA>
```
*Contoh:* `http://20.198.88.105`

🎉 **Aplikasi InvWare langsung terbuka dengan tampilan Bento Flat Design System!**

### Akun Demo Default untuk Pengujian:
- **Super Administrator**: `admin@smartwarehouse.com` | Password: `Password123!`
- **Warehouse Manager**: `manager.jkt@smartwarehouse.com` | Password: `Password123!`
- **Staff Gudang**: `staff.jkt1@smartwarehouse.com` | Password: `Password123!`
- **Purchasing Lead**: `purchasing.lead@smartwarehouse.com` | Password: `Password123!`

---

## Langkah 8: (Opsional) Mengaktifkan Domain & HTTPS / SSL Gratis

Jika Anda memiliki domain (misal: `invware.mycompany.id` atau `gudang.com`):

1. **Arahkan DNS Record**: Buat **A Record** di panel domain Anda yang mengarah ke `Public IP Address` Azure VM.
2. Pasang **Certbot (Let's Encrypt)** di VM:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```
3. Terbitkan sertifikat SSL gratis:
```bash
sudo certbot --nginx -d domainanda.com
```
Certbot akan otomatis memperbarui sertifikat SSL secara gratis seumur hidup.

---

## Perintah Berguna untuk Monitoring & Pemeliharaan

Jalankan perintah ini di dalam folder proyek di server:

```bash
# Melihat log real-time backend API (jika ada error)
docker compose logs -f backend

# Melihat log SQL Server
docker compose logs -f db

# Mematikan seluruh aplikasi
docker compose down

# Mengupdate kode setelah melakukan git push dari laptop
git pull origin main
docker compose up -d --build

# Melihat penggunaan CPU dan RAM di VM
docker stats
```

using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Models.Entities;

namespace SmartWarehouse.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, bool forceReset = false)
    {
        // Pastikan Database terbuat
        await context.Database.EnsureCreatedAsync();

        if (forceReset)
        {
            await ClearAllDataAsync(context);
        }
        else if (await context.Roles.AnyAsync())
        {
            // Periksa jika ada duplikasi kategori atau data tanggal transaksi yang belum diperkaya
            var catCount = await context.Categories.CountAsync();
            var txnPastCount = await context.StockTransactions.CountAsync(t => t.CreatedAt < DateTime.UtcNow.AddMonths(-1));
            
            if (catCount <= 20 && txnPastCount >= 50)
            {
                return; // Data sudah bersih dan kaya tanggal
            }

            // Jika ada duplikasi kategori atau transaksi belum diperkaya, lakukan pembersihan & re-seed
            await ClearAllDataAsync(context);
        }

        // 1. SEED ROLES (4 Roles)
        var roles = new List<Role>
        {
            new() { Name = "Super Admin", Code = "ROLE_ADMIN", Description = "Akses penuh ke seluruh modul sistem" },
            new() { Name = "Warehouse Manager", Code = "ROLE_MANAGER", Description = "Mengelola operasional gudang, persetujuan PO dan mutasi stok" },
            new() { Name = "Inventory Staff", Code = "ROLE_STAFF", Description = "Mencatat penerimaan, pengeluaran, dan stock opname fisik" },
            new() { Name = "Purchasing Officer", Code = "ROLE_PURCHASING", Description = "Mengelola data vendor pemasok dan pembuatan Purchase Order" }
        };
        await context.Roles.AddRangeAsync(roles);
        await context.SaveChangesAsync();

        var adminRole = roles.First(r => r.Code == "ROLE_ADMIN");
        var managerRole = roles.First(r => r.Code == "ROLE_MANAGER");
        var staffRole = roles.First(r => r.Code == "ROLE_STAFF");
        var purchasingRole = roles.First(r => r.Code == "ROLE_PURCHASING");

        var defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");

        // 2. SEED USERS & USER PROFILES (20 Users)
        var userSeeds = new[]
        {
            ("admin@smartwarehouse.com", "Fajar Sidik", "081234567890", "Executive Management", "Jl. Sudirman Kav 10, Jakarta", adminRole.Id),
            ("manager.jkt@smartwarehouse.com", "Budi Santoso", "081234567891", "Warehouse Operations", "Jl. Daan Mogot KM 12, Jakarta Barat", managerRole.Id),
            ("manager.sby@smartwarehouse.com", "Siti Rahmawati", "081234567892", "Warehouse Operations", "Jl. Rungkut Industri III, Surabaya", managerRole.Id),
            ("manager.ckr@smartwarehouse.com", "Hendro Wijaya", "081234567893", "Warehouse Operations", "Kawasan Industri GIIC, Cikarang", managerRole.Id),
            ("purchasing.lead@smartwarehouse.com", "Dewi Lestari", "081234567894", "Procurement & SCM", "Jl. Gatot Subroto No. 45, Jakarta", purchasingRole.Id),
            ("purchasing.staff1@smartwarehouse.com", "Agus Pratama", "081234567895", "Procurement & SCM", "Jl. Kuningan Barat No. 8, Jakarta", purchasingRole.Id),
            ("purchasing.staff2@smartwarehouse.com", "Rina Marlina", "081234567896", "Procurement & SCM", "Jl. TB Simatupang No. 18, Jakarta", purchasingRole.Id),
            ("staff.jkt1@smartwarehouse.com", "Ahmad Fauzi", "081234567897", "Inbound Logistics", "Jl. Sunter Podomoro, Jakarta Utara", staffRole.Id),
            ("staff.jkt2@smartwarehouse.com", "Rian Hidayat", "081234567898", "Outbound Logistics", "Jl. Cakung Cilincing, Jakarta Timur", staffRole.Id),
            ("staff.ckr1@smartwarehouse.com", "Dedi Kurniawan", "081234567899", "Storage & Picking", "Jl. Jababeka Raya, Cikarang", staffRole.Id),
            ("staff.ckr2@smartwarehouse.com", "Eko Prasetyo", "081234567800", "Packing & Dispatch", "Jl. EJIP Plot 4, Cikarang", staffRole.Id),
            ("staff.krw1@smartwarehouse.com", "Irfan Hakim", "081234567801", "Inventory Audit", "Kawasan KIIC, Karawang", staffRole.Id),
            ("staff.sby1@smartwarehouse.com", "Gita Gutawa", "081234567802", "Inbound Logistics", "Jl. Margomulyo Indah, Surabaya", staffRole.Id),
            ("staff.sby2@smartwarehouse.com", "Bayu Wicaksono", "081234567803", "Outbound Logistics", "Jl. Kenjeran No. 200, Surabaya", staffRole.Id),
            ("staff.smg1@smartwarehouse.com", "Hadi Suwarno", "081234567804", "Inventory Control", "Kawasan Industri Wijayakusuma, Semarang", staffRole.Id),
            ("staff.mdn1@smartwarehouse.com", "Zulkifli Lubis", "081234567805", "Logistics Hub", "Kawasan Industri Medan (KIM 2), Medan", staffRole.Id),
            ("staff.mks1@smartwarehouse.com", "Andi Muhammad", "081234567806", "Warehouse Ops", "Kawasan Industri Makassar (KIMA), Makassar", staffRole.Id),
            ("staff.bdg1@smartwarehouse.com", "Cecep Supriatna", "081234567807", "Distribution Center", "Jl. Soekarno Hatta No. 590, Bandung", staffRole.Id),
            ("staff.plb1@smartwarehouse.com", "M. Rizky Saputra", "081234567808", "Inbound Receiving", "Jl. Tanjung Api-Api, Palembang", staffRole.Id),
            ("audit.lead@smartwarehouse.com", "Wahyudi Saputra", "081234567809", "Quality & Compliance", "Jl. M.T. Haryono Kav 22, Jakarta", adminRole.Id)
        };

        var usersList = new List<User>();
        foreach (var u in userSeeds)
        {
            var user = new User
            {
                Email = u.Item1,
                PasswordHash = defaultPasswordHash,
                RoleId = u.Item6,
                IsActive = true,
                Profile = new UserProfile
                {
                    FullName = u.Item2,
                    PhoneNumber = u.Item3,
                    Department = u.Item4,
                    Address = u.Item5,
                    AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.Item2)}&background=946D6D&color=fff&bold=true"
                }
            };
            usersList.Add(user);
        }
        await context.Users.AddRangeAsync(usersList);
        await context.SaveChangesAsync();

        // 3. SEED CATEGORIES (20 Categories - Unique & Distinct)
        var categorySeeds = new[]
        {
            ("Komponen Elektronik", "CAT-ELEK", "Mikrokontroler, resistor, kapasitor, modul PCB industrial"),
            ("Perangkat Komputer", "CAT-PCIT", "Server enterprise rack, RAM ECC, SSD NVMe, GPU"),
            ("Perlengkapan Jaringan", "CAT-NETW", "Router enterprise, switch PoE manageable, patch cord fiber"),
            ("Perkakas Mesin", "CAT-MACH", "Mesin bubut, CNC router, mata bor karbida presisi"),
            ("Material Bangunan", "CAT-BLDG", "Baja ringan C75, semen instan, insulasi panel sandwich"),
            ("Kemasan & Logistik", "CAT-PACK", "Kardus corrugated, bubble wrap tebal, stretch film palet"),
            ("Bahan Kimia Industri", "CAT-CHEM", "Cairan solvent degreaser, pelumas gear oil sintetis"),
            ("Alat Pelindung Diri (APD)", "CAT-SAFE", "Helm proyek ANSI Z89, rompi safety reflektif, sepatu safety"),
            ("Perkakas Tangan", "CAT-TOOL", "Kunci socket ratchet, cordless impact drill, obeng torsi"),
            ("Kabel & Kelistrikan", "CAT-CAB", "Kabel NYYHY 3x2.5mm, tray kabel galvanis, MCB 3-Phase"),
            ("Lampu & Penerangan Industri", "CAT-LGHT", "Highbay LED 150W IP65, floodlight solar cell 200W"),
            ("Mesin & Otomasi Industri", "CAT-INDS", "Kompresor piston 3HP 120L, inverter VFD, forklift charger"),
            ("Sensor & Barcode Reader", "CAT-SENS", "Fixed barcode scanner 2D, proximity inductive sensor, sensor laser"),
            ("Pipa & Valve Industri", "CAT-PIPE", "Pipa seamless carbon steel SCH 40, ball valve flanged"),
            ("Baut & Fasteners Stainless", "CAT-FAST", "Baut hexagon M12x50 SUS304, dynabolt anchor, rivet baja"),
            ("Cat & Pelapis Industri", "CAT-COAT", "Epoxy lantai pabrik heavy duty, primer zinc chromate"),
            ("Peralatan Fire Safety & APAR", "CAT-FIRE", "Tabung APAR dry chemical 6kg, fire blanket, hydrant valve"),
            ("Alat Ukur Presisi & Kalibrasi", "CAT-MEAS", "Digital caliper vernier 150mm, multitester True-RMS digital"),
            ("Palet Plastik & Racking Gudang", "CAT-RACK", "Palet plastik heavy duty 4-ton, racking beam upright"),
            ("Aksesoris Pengiriman & Labeling", "CAT-SHP", "Segel kontainer barcode, label thermal barcode direct 100x150")
        };

        var categories = categorySeeds.Select(c => new Category
        {
            Name = c.Item1,
            Code = c.Item2,
            Description = c.Item3
        }).ToList();
        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();

        // 4. SEED WAREHOUSES (20 Facilities)
        var warehouseSeeds = new[]
        {
            ("WH-JKT-01", "Gudang Utama Jakarta Utara", "Kawasan Berikat Nusantara, Marunda", "Jakarta Utara", 15000m, usersList[1].Id),
            ("WH-CKR-01", "Central DC Cikarang", "Kawasan Industri GIIC Blok AA No. 5", "Bekasi", 25000m, usersList[3].Id),
            ("WH-KRW-01", "Hub Logistik Karawang", "Kawasan Industri KIIC Lot C-3", "Karawang", 18000m, usersList[3].Id),
            ("WH-SBY-01", "Pusat Distribusi Rungkut Surabaya", "Kawasan SIER Rungkut Industri Raya", "Surabaya", 20000m, usersList[2].Id),
            ("WH-SMG-01", "Hub Logistik Jawa Tengah Semarang", "Kawasan Candi Gatot Subroto No. 88", "Semarang", 12000m, usersList[1].Id),
            ("WH-BDG-01", "DC Regional Bandung Gedebage", "Jl. Soekarno Hatta KM 14", "Bandung", 10000m, usersList[1].Id),
            ("WH-MDN-01", "Hub Sumatera 1 Medan Belawan", "Kawasan Industri Medan (KIM 2)", "Medan", 14000m, usersList[1].Id),
            ("WH-PLB-01", "DC Sumatera 2 Palembang", "Jl. Bypass Alang-Alang Lebar", "Palembang", 9500m, usersList[1].Id),
            ("WH-MKS-01", "Hub Indonesia Timur Makassar", "Kawasan Industri Makassar KIMA 10", "Makassar", 16000m, usersList[2].Id),
            ("WH-BPN-01", "DC Kalimantan 1 Balikpapan", "Kawasan Industri Kariangau KM 13", "Balikpapan", 11000m, usersList[2].Id),
            ("WH-BJM-01", "Hub Kalimantan 2 Banjarmasin", "Jl. Gubernur Soebardjo Lingkar Selatan", "Banjarmasin", 8500m, usersList[2].Id),
            ("WH-DPS-01", "DC Bali & Nusa Tenggara Denpasar", "Jl. Bypass Ngurah Rai No. 450", "Denpasar", 7500m, usersList[2].Id),
            ("WH-YOG-01", "Hub Logistik DIY Sleman", "Jl. Ring Road Utara Maguwoharjo", "Sleman", 6500m, usersList[1].Id),
            ("WH-BTM-01", "DC Free Trade Zone Batam Center", "Kawasan Industri Batamindo Muka Kuning", "Batam", 13000m, usersList[1].Id),
            ("WH-PKU-01", "Hub Distribusi Riau Pekanbaru", "Jl. Tuanku Tambusai Ujung", "Pekanbaru", 8000m, usersList[1].Id),
            ("WH-PDG-01", "DC Sumatera Barat Padang", "Kawasan Pelabuhan Teluk Bayur", "Padang", 7000m, usersList[1].Id),
            ("WH-LMP-01", "Hub Lampung Panjang", "Jl. Yos Sudarso No. 120 Panjang", "Bandar Lampung", 8500m, usersList[1].Id),
            ("WH-PTK-01", "DC Kalimantan Barat Pontianak", "Jl. Arteri Supadio KM 9", "Kubu Raya", 7200m, usersList[2].Id),
            ("WH-MND-01", "Hub Sulawesi Utara Manado", "Jl. Trans Sulawesi Kawangkoan", "Minahasa Utara", 6800m, usersList[2].Id),
            ("WH-SMD-01", "Hub Distribusi Samarinda", "Jl. Poros Samarinda - Balikpapan KM 2", "Samarinda", 7800m, usersList[2].Id)
        };

        var warehouses = warehouseSeeds.Select(w => new Warehouse
        {
            Code = w.Item1,
            Name = w.Item2,
            Address = w.Item3,
            City = w.Item4,
            CapacitySqm = w.Item5,
            ManagerId = w.Item6,
            IsActive = true
        }).ToList();
        await context.Warehouses.AddRangeAsync(warehouses);
        await context.SaveChangesAsync();

        // 5. SEED SUPPLIERS (20 Suppliers)
        var supplierSeeds = new[]
        {
            ("SUP-001", "PT Mega Elektronik Nusantara", "Bambang Wijaya", "sales@megaelektronik.co.id", "021-89830001", "Kawasan Industri Cikarang Blok C-1", "01.234.567.8-011.000", 4.9m),
            ("SUP-002", "PT Global IT Solutions", "Jessica Iskandar", "contact@globalitsol.com", "021-57900002", "Gedung Cyber 2 Lantai 15, Jakarta Selatan", "01.234.567.8-012.000", 4.8m),
            ("SUP-003", "PT Jaringan Fiber Utama", "Gunawan Prasetyo", "info@jaringanfiber.co.id", "021-29340003", "Kawasan Industri Pulogadung Kav 12", "01.234.567.8-013.000", 4.7m),
            ("SUP-004", "PT Sinar Baja Presisi", "Toni Hermanto", "orders@sinarbaja.com", "021-89350004", "Kawasan EJIP Plot 8, Cikarang", "01.234.567.8-014.000", 4.9m),
            ("SUP-005", "PT Semen & Konstruksi Jaya", "Rahmat Hidayat", "marketing@semenkonstruksi.id", "031-78900005", "Jl. Gresik Industri No. 45, Gresik", "01.234.567.8-015.000", 4.6m),
            ("SUP-006", "PT Packindo Kemasan Logistik", "Maya Anggraini", "sales@packindolog.com", "021-89110006", "Kawasan Industri KIIC Lot D-2, Karawang", "01.234.567.8-016.000", 4.8m),
            ("SUP-007", "PT Tri Chem Industri", "Dr. Handoko M.", "info@tricheme.co.id", "0254-3900007", "Kawasan Industri Krakatau, Cilegon", "01.234.567.8-017.000", 4.9m),
            ("SUP-008", "PT Safety First Indonesia", "Aris Munandar", "cs@safetyfirst.co.id", "021-58300008", "Komp. Pergudangan Daan Mogot Prima No. 8", "01.234.567.8-018.000", 4.7m),
            ("SUP-009", "PT Perkakas Mandiri Perkasa", "Surya Darmawan", "order@perkakasmandiri.com", "021-65400009", "Pertokoan Glodok Makmur No. 34, Jakarta", "01.234.567.8-019.000", 4.5m),
            ("SUP-010", "PT Supreme Kabel Logistik", "Indra Kusuma", "sales@supremekabel.co.id", "021-59000010", "Jl. Raya Daan Mogot KM 16, Tangerang", "01.234.567.8-020.000", 4.8m),
            ("SUP-011", "PT Surya Terang Lighting", "Teddy Kurnia", "info@suryaterang.com", "021-89700011", "Kawasan Delta Silicon 3, Lippo Cikarang", "01.234.567.8-021.000", 4.7m),
            ("SUP-012", "PT Mesin Otomasi Nusantara", "Agung Wibowo", "sales@mesinotomasi.id", "021-89800012", "Kawasan Industri MM2100 Blok C, Cibitung", "01.234.567.8-022.000", 4.9m),
            ("SUP-013", "PT Sensor Presisi Indonesia", "Lukas Tanuwijaya", "support@sensorpresisi.co.id", "021-30000013", "Green Sedayu Bizpark DM 5, Jakarta Barat", "01.234.567.8-023.000", 4.6m),
            ("SUP-014", "PT Flow & Pipe Metal Utama", "Irwan Syahputra", "inquiry@flowpipemetal.com", "021-89100014", "Kawasan Industri Surya Cipta, Karawang", "01.234.567.8-024.000", 4.8m),
            ("SUP-015", "PT Fastener Stainless Pratama", "David Susanto", "sales@fastenerpratama.co.id", "021-62800015", "Jl. Pangeran Jayakarta No. 102, Jakarta", "01.234.567.8-025.000", 4.7m),
            ("SUP-016", "PT Epoxy Coating Nusantara", "Ferdy Gunawan", "info@epoxycoating.co.id", "031-84900016", "Kawasan Industri SIER Rungkut, Surabaya", "01.234.567.8-026.000", 4.9m),
            ("SUP-017", "PT Proteksi Api Mandiri", "Haris Fadillah", "marketing@proteksiapi.com", "021-78900017", "Jl. Raya Pasar Minggu No. 56, Jakarta", "01.234.567.8-027.000", 4.8m),
            ("SUP-018", "PT Instrumen Ukur Teknik", "Benny Kurniawan", "sales@instrumenukur.id", "021-56900018", "Rukan Puri Mutiara Blok BD No. 8, Jakarta", "01.234.567.8-028.000", 4.9m),
            ("SUP-019", "PT Paletindo Heavy Duty", "Sony Alamsyah", "order@paletindo.co.id", "021-89300019", "Kawasan Industri Jababeka 2, Cikarang", "01.234.567.8-029.000", 4.8m),
            ("SUP-020", "PT Barcode Label Solusindo", "Vivi Anggraeni", "cs@labelsolusindo.com", "021-29400020", "Komp. Pergudangan Infinia Park Blok B-12", "01.234.567.8-030.000", 4.9m)
        };

        var suppliers = supplierSeeds.Select(s => new Supplier
        {
            Code = s.Item1,
            Name = s.Item2,
            ContactName = s.Item3,
            Email = s.Item4,
            Phone = s.Item5,
            Address = s.Item6,
            TaxId = s.Item7,
            Rating = s.Item8,
            IsActive = true
        }).ToList();
        await context.Suppliers.AddRangeAsync(suppliers);
        await context.SaveChangesAsync();

        // 6. SEED PRODUCTS (30 Distinct Products Across Categories)
        var productSeeds = new[]
        {
            ("SKU-ELEK-001", "8991001000011", "Mikrokontroler STM32 ARM Cortex-M4", "Board mikrokontroler 32-bit untuk kontroler cerdas & otomasi", 185000m, 140000m, 50, 20, 2000, "UNIT", categories[0].Id),
            ("SKU-ELEK-002", "8991001000028", "Power Supply Switching 24V 10A Industrial", "Catu daya teregulasi din-rail mounting industrial", 350000m, 270000m, 30, 10, 1000, "UNIT", categories[0].Id),
            ("SKU-PCIT-001", "8991001000035", "Server Enterprise SSD NVMe 1.92TB Gen4", "SSD enterprise grade read-intensive untuk storage server", 4200000m, 3500000m, 15, 5, 200, "UNIT", categories[1].Id),
            ("SKU-PCIT-002", "8991001000042", "RAM Server DDR4 ECC Registered 32GB 3200MHz", "Memori server dengan deteksi koreksi error parity", 1650000m, 1300000m, 20, 8, 300, "UNIT", categories[1].Id),
            ("SKU-NETW-001", "8991001000059", "Manageable Switch 24-Port Gigabit PoE+ L2", "Switch jaringan enterprise rackmount 1U dukungan VLAN & QoS", 3800000m, 2950000m, 10, 4, 100, "UNIT", categories[2].Id),
            ("SKU-NETW-002", "8991001000066", "Access Point WiFi-6 Dual Band Enterprise", "AP outdoor/indoor kecepatan tinggi hingga 3000Mbps", 1950000m, 1500000m, 15, 5, 150, "UNIT", categories[2].Id),
            ("SKU-MACH-001", "8991001000073", "Mata Bor Karbida CNC Solid 10mm 4-Flute", "Mata milling presisi tinggi untuk baja paduan dan stainless", 120000m, 85000m, 40, 15, 500, "PCS", categories[3].Id),
            ("SKU-BLDG-001", "8991001000080", "Baja Ringan Kanal C75 Ketebalan 0.75mm", "Panjang standar 6 meter untuk konstruksi atap pabrik/gudang", 95000m, 78000m, 100, 30, 5000, "BATANG", categories[4].Id),
            ("SKU-PACK-001", "8991001000097", "Kardus Corrugated Double Wall 40x30x30 cm", "Kardus kuat standar ekspor untuk pengiriman logistik berat", 18500m, 12500m, 200, 50, 10000, "PCS", categories[5].Id),
            ("SKU-PACK-002", "8991001000103", "Stretch Film Wrapping 50cm x 300m 17 Micron", "Plastik wrapping pembungkus palet barang anti debu & air", 75000m, 55000m, 80, 25, 2000, "ROLL", categories[5].Id),
            ("SKU-CHEM-001", "8991001000110", "Pelumas Mesin Industri Gear Oil ISO VG 220 20L", "Oli transmisi gearbox beban berat kemasan pail industrial", 950000m, 760000m, 20, 5, 250, "PAIL", categories[6].Id),
            ("SKU-SAFE-001", "8991001000127", "Helm Keselamatan Kerja V-Gard Industrial ANSI Z89", "Helm pelindung kepala suspensi ratchet 4 titik standar K3", 145000m, 95000m, 50, 20, 1000, "UNIT", categories[7].Id),
            ("SKU-SAFE-002", "8991001000134", "Sepatu Safety Ujung Baja S1P Kulit Asli", "Sepatu kerja tahan benturan 200J dan sol anti slip minyak", 285000m, 210000m, 25, 10, 500, "PASANG", categories[7].Id),
            ("SKU-TOOL-001", "8991001000141", "Cordless Impact Drill 20V Brushless Heavy Duty", "Mesin bor baterai torsi 65Nm dengan 2 baterai lithium", 1250000m, 950000m, 15, 5, 200, "SET", categories[8].Id),
            ("SKU-TOOL-002", "8991001000158", "Kunci Socket Set 1/2 Inch 24-Piece Chrome Vanadium", "Set mata sock lengkap dengan gagang ratchet reversibel", 480000m, 360000m, 20, 8, 300, "SET", categories[8].Id),
            ("SKU-CAB-001", "8991001000165", "Kabel Listrik NYYHY 3x2.5mm² Tembaga Murni 100m", "Kabel instalasi fleksibel serabut standar SPLN/SNI", 1150000m, 920000m, 30, 10, 400, "ROLL", categories[9].Id),
            ("SKU-LGHT-001", "8991001000172", "Lampu Industri Highbay LED 150W IP65 6500K", "Penerangan gudang efisiensi tinggi 140 lumen/watt", 620000m, 470000m, 25, 10, 400, "UNIT", categories[10].Id),
            ("SKU-INDS-001", "8991001000189", "Kompresor Angin Piston 3HP 120 Liter 3-Phase", "Kompresor udara kapasitas medium tekanan 8 bar continuous", 6800000m, 5400000m, 5, 2, 50, "UNIT", categories[11].Id),
            ("SKU-SENS-001", "8991001000196", "Industrial Fixed Barcode Scanner 2D QR Code", "Pemindai kode batang otomatis pada jalur konveyor conveyor", 2750000m, 2100000m, 12, 4, 150, "UNIT", categories[12].Id),
            ("SKU-PIPE-001", "8991001000202", "Pipa Seamless Carbon Steel SCH 40 Diameter 2 Inch", "Pipa tahan tekanan tinggi fluida panas panjang 6 meter", 450000m, 360000m, 50, 15, 600, "BATANG", categories[13].Id),
            ("SKU-FAST-001", "8991001000219", "Baut Hexagon M12x50mm Stainless Steel 304 (Box 50pcs)", "Baut tahan karat untuk perakitan mesin & racking gudang", 145000m, 105000m, 60, 20, 1000, "BOX", categories[14].Id),
            ("SKU-COAT-001", "8991001000226", "Cat Epoxy Lantai Pabrik Heavy Traffic 20Kg Set", "Lapisan lantai tahan gesekan forklift & tumpahan zat kimia", 1850000m, 1450000m, 15, 5, 200, "SET", categories[15].Id),
            ("SKU-FIRE-001", "8991001000233", "Tabung APAR Dry Chemical Powder 6Kg ABC", "Alat pemadam api ringan tersertifikasi Damkar & SNI", 320000m, 230000m, 30, 10, 500, "UNIT", categories[16].Id),
            ("SKU-MEAS-001", "8991001000240", "Digital Caliper Vernier Jangka Sorong 150mm Stainless", "Alat ukur presisi ketelitian 0.01mm layar LCD besar", 195000m, 135000m, 40, 10, 500, "UNIT", categories[17].Id),
            ("SKU-RACK-001", "8991001000257", "Palet Plastik Heavy Duty 1200x1000x150 mm Static 4 Ton", "Palet higienis 4-way entry untuk sistem rak gudang bertingkat", 385000m, 290000m, 100, 25, 3000, "UNIT", categories[18].Id),
            ("SKU-SHP-001", "8991001000264", "Segel Kontainer Bolt Seal High Security ISO 17712", "Segel pengunci pintu kontainer ekspor anti sabotase (Box 50)", 220000m, 160000m, 50, 15, 1000, "BOX", categories[19].Id),
            ("SKU-SHP-002", "8991001000271", "Label Thermal Barcode 100x150mm Direct Thermal (Roll 500)", "Stiker label resi pengiriman logistik & nomor rak", 48000m, 32000m, 150, 40, 5000, "ROLL", categories[19].Id),
            ("SKU-SAFE-003", "8991001000288", "Rompi Safety Proyek Hi-Vis dengan Scotlight 4 Jalur", "Rompi polyester jaring warna hijau stabilo standar K3", 35000m, 22000m, 100, 30, 2000, "PCS", categories[7].Id),
            ("SKU-SAFE-004", "8991001000295", "Sarung Tangan Safety Nitrile Foam Anti Cut Level 5", "Sarung tangan kerja pelindung sayatan pisau & gesekan", 45000m, 28000m, 120, 35, 2500, "PASANG", categories[7].Id),
            ("SKU-PCIT-003", "8991001000301", "Power Supply Redundant Server 800W 80 Plus Platinum", "Modul PSU cadangan hot-plug untuk chassis server 2U", 2400000m, 1850000m, 10, 4, 150, "UNIT", categories[1].Id)
        };

        var products = productSeeds.Select(p => new Product
        {
            Sku = p.Item1,
            Barcode = p.Item2,
            Name = p.Item3,
            Description = p.Item4,
            UnitPrice = p.Item5,
            CostPrice = p.Item6,
            ReorderLevel = p.Item7,
            MinStock = p.Item8,
            MaxStock = p.Item9,
            UnitOfMeasure = p.Item10,
            CategoryId = p.Item11,
            ImageUrl = $"/uploads/images/products/{p.Item1.ToLower()}.jpg"
        }).ToList();
        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();

        // 7. SEED INVENTORY STOCKS (Across Multiple Warehouses)
        var stockList = new List<InventoryStock>();
        for (int i = 0; i < products.Count; i++)
        {
            var p = products[i];
            
            // Stock in Warehouse 1 (Jakarta)
            stockList.Add(new InventoryStock
            {
                ProductId = p.Id,
                WarehouseId = warehouses[0].Id,
                BinLocation = $"A{((i % 5) + 1):D2}-R{((i % 4) + 1):D2}-B{((i % 6) + 1):D2}",
                QuantityOnHand = 120 + (i * 10),
                QuantityAllocated = 10 + (i * 2),
                QuantityAvailable = (120 + (i * 10)) - (10 + (i * 2)),
                LastCountedAt = DateTime.UtcNow.AddDays(-3)
            });

            // Stock in Warehouse 2 (Cikarang)
            stockList.Add(new InventoryStock
            {
                ProductId = p.Id,
                WarehouseId = warehouses[1].Id,
                BinLocation = $"C{((i % 6) + 1):D2}-R{((i % 5) + 1):D2}-B{((i % 8) + 1):D2}",
                QuantityOnHand = 180 + (i * 14),
                QuantityAllocated = 15 + (i * 2),
                QuantityAvailable = (180 + (i * 14)) - (15 + (i * 2)),
                LastCountedAt = DateTime.UtcNow.AddDays(-2)
            });

            // Stock in Warehouse 4 (Surabaya) for every 2nd product
            if (i % 2 == 0)
            {
                stockList.Add(new InventoryStock
                {
                    ProductId = p.Id,
                    WarehouseId = warehouses[3].Id,
                    BinLocation = $"S{((i % 4) + 1):D2}-R{((i % 3) + 1):D2}-B{((i % 5) + 1):D2}",
                    QuantityOnHand = 75 + (i * 6),
                    QuantityAllocated = 8,
                    QuantityAvailable = 67 + (i * 6),
                    LastCountedAt = DateTime.UtcNow.AddDays(-7)
                });
            }

            // Stock in Warehouse 3 (Karawang) for every 3rd product
            if (i % 3 == 0)
            {
                stockList.Add(new InventoryStock
                {
                    ProductId = p.Id,
                    WarehouseId = warehouses[2].Id,
                    BinLocation = $"K{((i % 3) + 1):D2}-R{((i % 3) + 1):D2}-B{((i % 4) + 1):D2}",
                    QuantityOnHand = 90 + (i * 5),
                    QuantityAllocated = 5,
                    QuantityAvailable = 85 + (i * 5),
                    LastCountedAt = DateTime.UtcNow.AddDays(-5)
                });
            }
        }
        await context.InventoryStocks.AddRangeAsync(stockList);
        await context.SaveChangesAsync();

        // 8. SEED STOCK TRANSACTIONS (140+ Transactions Richly Distributed Across Past 12 Months)
        var transactions = new List<StockTransaction>();
        var now = DateTime.UtcNow;
        int trxCounter = 1;

        // Distribusi transaksi per bulan dari 11 bulan lalu hingga bulan berjalan
        for (int monthOffset = 11; monthOffset >= 0; monthOffset--)
        {
            var baseDate = now.AddMonths(-monthOffset);
            var year = baseDate.Year;
            var month = baseDate.Month;
            int daysInMonth = DateTime.DaysInMonth(year, month);

            // Inbound Transactions for this month (4-6 transactions)
            int inboundCount = 4 + (trxCounter % 3);
            for (int k = 0; k < inboundCount; k++)
            {
                int day = Math.Min(daysInMonth, 2 + (k * 5));
                var txDate = new DateTime(year, month, day, 9 + (k * 2), 15 + (k * 7), 0, DateTimeKind.Utc);
                var prod = products[(trxCounter + k) % products.Count];
                var qty = 35 + ((monthOffset * 7 + k * 13) % 85);

                transactions.Add(new StockTransaction
                {
                    ReferenceNumber = $"TRX-IN-{year}{month:D2}-{trxCounter:D4}",
                    TransactionType = "INBOUND",
                    ProductId = prod.Id,
                    SourceWarehouseId = null,
                    TargetWarehouseId = warehouses[k % 4].Id,
                    Quantity = qty,
                    Notes = $"Penerimaan barang masuk (Inbound PO batch #{trxCounter})",
                    CreatedByUserId = usersList[7 + (k % 4)].Id,
                    CreatedAt = txDate,
                    UpdatedAt = txDate
                });
                trxCounter++;
            }

            // Outbound Transactions for this month (4-6 transactions)
            int outboundCount = 4 + ((trxCounter + 1) % 3);
            for (int k = 0; k < outboundCount; k++)
            {
                int day = Math.Min(daysInMonth, 4 + (k * 5));
                var txDate = new DateTime(year, month, day, 13 + (k * 1), 20 + (k * 6), 0, DateTimeKind.Utc);
                var prod = products[(trxCounter + k + 3) % products.Count];
                var qty = 30 + ((monthOffset * 5 + k * 11) % 75);

                transactions.Add(new StockTransaction
                {
                    ReferenceNumber = $"TRX-OUT-{year}{month:D2}-{trxCounter:D4}",
                    TransactionType = "OUTBOUND",
                    ProductId = prod.Id,
                    SourceWarehouseId = warehouses[k % 4].Id,
                    TargetWarehouseId = null,
                    Quantity = qty,
                    Notes = $"Pengiriman barang keluar / dispatch customer order #{trxCounter}",
                    CreatedByUserId = usersList[8 + (k % 4)].Id,
                    CreatedAt = txDate,
                    UpdatedAt = txDate
                });
                trxCounter++;
            }

            // Transfer Transactions for this month (2 transactions)
            for (int k = 0; k < 2; k++)
            {
                int day = Math.Min(daysInMonth, 8 + (k * 10));
                var txDate = new DateTime(year, month, day, 11 + k, 45, 0, DateTimeKind.Utc);
                var prod = products[(trxCounter + k) % products.Count];
                var qty = 15 + (k * 10);

                transactions.Add(new StockTransaction
                {
                    ReferenceNumber = $"TRX-TRF-{year}{month:D2}-{trxCounter:D4}",
                    TransactionType = "TRANSFER",
                    ProductId = prod.Id,
                    SourceWarehouseId = warehouses[k].Id,
                    TargetWarehouseId = warehouses[(k + 1) % 4].Id,
                    Quantity = qty,
                    Notes = $"Mutasi transfer antar fasilitas gudang regional",
                    CreatedByUserId = usersList[1].Id,
                    CreatedAt = txDate,
                    UpdatedAt = txDate
                });
                trxCounter++;
            }

            // Adjustment Transaction for this month (1 transaction)
            if (monthOffset % 2 == 0)
            {
                int day = Math.Min(daysInMonth, 28);
                var txDate = new DateTime(year, month, day, 16, 30, 0, DateTimeKind.Utc);
                var prod = products[(trxCounter + 5) % products.Count];

                transactions.Add(new StockTransaction
                {
                    ReferenceNumber = $"TRX-ADJ-{year}{month:D2}-{trxCounter:D4}",
                    TransactionType = "ADJUSTMENT",
                    ProductId = prod.Id,
                    SourceWarehouseId = warehouses[0].Id,
                    TargetWarehouseId = warehouses[0].Id,
                    Quantity = 5,
                    Notes = $"Penyesuaian hasil stock opname fisik berkala",
                    CreatedByUserId = usersList[11].Id,
                    CreatedAt = txDate,
                    UpdatedAt = txDate
                });
                trxCounter++;
            }
        }

        await context.StockTransactions.AddRangeAsync(transactions);
        await context.SaveChangesAsync();

        // 9. SEED PURCHASE ORDERS & PO ITEMS (30 POs Across Past 12 Months)
        var purchaseOrders = new List<PurchaseOrder>();
        int poCounter = 1;

        for (int monthOffset = 11; monthOffset >= 0; monthOffset--)
        {
            var baseDate = now.AddMonths(-monthOffset);
            var year = baseDate.Year;
            var month = baseDate.Month;

            // 2-3 POs per month
            int posInMonth = monthOffset == 0 ? 3 : 2;
            for (int k = 0; k < posInMonth; k++)
            {
                var sup = suppliers[(poCounter - 1) % suppliers.Count];
                var orderDay = Math.Min(25, 3 + (k * 9));
                var orderDate = new DateTime(year, month, orderDay, 10, 0, 0, DateTimeKind.Utc);
                var expDate = orderDate.AddDays(7 + (k * 3));

                string status;
                if (monthOffset > 1) status = "RECEIVED";
                else if (monthOffset == 1) status = k == 0 ? "RECEIVED" : "APPROVED";
                else status = k == 0 ? "APPROVED" : (k == 1 ? "PENDING" : "DRAFT");

                var po = new PurchaseOrder
                {
                    PoNumber = $"PO-{year}{month:D2}-{poCounter:D3}",
                    SupplierId = sup.Id,
                    OrderDate = orderDate,
                    ExpectedDeliveryDate = expDate,
                    Status = status,
                    Notes = $"Pengadaan barang reguler kuartal operasional dari pemasok {sup.Name}",
                    CreatedByUserId = usersList[4].Id, // Dewi Lestari (Purchasing lead)
                    DocumentUrl = $"/uploads/documents/po_{year}_{month:D2}_{poCounter:D3}.pdf",
                    CreatedAt = orderDate,
                    UpdatedAt = orderDate,
                    Items = new List<PurchaseOrderItem>()
                };

                decimal total = 0;
                for (int j = 0; j < 3; j++)
                {
                    var prod = products[(poCounter + j) % products.Count];
                    var qty = 20 + (j * 15);
                    var cost = prod.CostPrice;
                    var subtotal = qty * cost;
                    total += subtotal;

                    po.Items.Add(new PurchaseOrderItem
                    {
                        ProductId = prod.Id,
                        OrderedQuantity = qty,
                        ReceivedQuantity = status == "RECEIVED" ? qty : 0,
                        UnitCost = cost,
                        Subtotal = subtotal,
                        Notes = $"Item batch pengadaan {prod.Sku}"
                    });
                }
                po.TotalAmount = total;
                purchaseOrders.Add(po);
                poCounter++;
            }
        }

        await context.PurchaseOrders.AddRangeAsync(purchaseOrders);
        await context.SaveChangesAsync();
    }

    private static async Task ClearAllDataAsync(AppDbContext context)
    {
        // Hapus data secara bertahap sesuai relasi foreign key
        context.PurchaseOrderItems.RemoveRange(context.PurchaseOrderItems);
        context.PurchaseOrders.RemoveRange(context.PurchaseOrders);
        context.StockTransactions.RemoveRange(context.StockTransactions);
        context.InventoryStocks.RemoveRange(context.InventoryStocks);
        context.Products.RemoveRange(context.Products);
        context.Suppliers.RemoveRange(context.Suppliers);
        context.Warehouses.RemoveRange(context.Warehouses);
        context.Categories.RemoveRange(context.Categories);
        context.UserProfiles.RemoveRange(context.UserProfiles);
        context.Users.RemoveRange(context.Users);
        context.Roles.RemoveRange(context.Roles);
        await context.SaveChangesAsync();
    }
}

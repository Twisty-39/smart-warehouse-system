import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { dashboardApi, currencyApi } from '../../services/api';
import { DashboardSummary, ChartData, RecentActivity } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import { animateNumber } from '../../utils/animations';
import { useToast } from '../../context/ToastContext';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Warehouse,
  Boxes,
  RefreshCw,
  ShoppingCart,
  Layers,
  ArrowRight,
  PieChart,
  List,
  Coins,
  Globe
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const DashboardPage: React.FC = () => {
  const toast = useToast();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Currency state & Live exchange rate
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [exchangeRate, setExchangeRate] = useState<{ rate: number; isLive: boolean; lastUpdated: string }>({
    rate: 16250,
    isLive: false,
    lastUpdated: 'Memuat kurs...'
  });
  const [isFetchingRate, setIsFetchingRate] = useState<boolean>(false);

  // Timeframe state untuk chart pergerakan stok (3, 6, 12 bulan)
  const [timeframe, setTimeframe] = useState<3 | 6 | 12>(6);
  const [isFetchingChart, setIsFetchingChart] = useState<boolean>(false);

  // View mode untuk proporsi kategori ('donut' vs 'list')
  const [categoryView, setCategoryView] = useState<'donut' | 'list'>('donut');
  const [categoryMetric, setCategoryMetric] = useState<'value' | 'items'>('value');

  // Refs untuk animasi angka Anime.js
  const totalStockValueRef = useRef<HTMLHeadingElement>(null);
  const totalStockQtyRef = useRef<HTMLHeadingElement>(null);
  const lowStockRef = useRef<HTMLHeadingElement>(null);
  const activePORef = useRef<HTMLHeadingElement>(null);
  const inCountRef = useRef<HTMLSpanElement>(null);
  const outCountRef = useRef<HTMLSpanElement>(null);

  // Helper format mata uang
  const formatMoney = useCallback(
    (idrVal: number, targetCurrency: 'IDR' | 'USD' = currency) => {
      if (targetCurrency === 'USD') {
        const rate = exchangeRate.rate > 0 ? exchangeRate.rate : 16250;
        const usdVal = idrVal / rate;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: usdVal >= 1000 ? 0 : 2
        }).format(usdVal);
      }
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(idrVal);
    },
    [currency, exchangeRate.rate]
  );

  const animateValueNumber = (rawIdrVal: number, targetCurrency: 'IDR' | 'USD', rate: number) => {
    if (!totalStockValueRef.current) return;
    if (targetCurrency === 'USD') {
      const usdVal = Math.round(rawIdrVal / (rate || 16250));
      animateNumber(totalStockValueRef.current, 0, usdVal, 600, (val) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
      );
    } else {
      animateNumber(totalStockValueRef.current, 0, rawIdrVal, 600, (val) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
      );
    }
  };

  // Fetch data dasbor utama
  const fetchDashboardData = async (isManual: boolean = false) => {
    setIsLoading(true);
    try {
      const [sumRes, chartRes, actRes, rateRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getCharts(timeframe),
        dashboardApi.getRecentActivities(),
        currencyApi.getUsdIdrRate()
      ]);
      setSummary(sumRes);
      setChartData(chartRes);
      setActivities(actRes);
      setExchangeRate(rateRes);

      // Trigger Anime.js animasi hitung angka naik
      setTimeout(() => {
        animateValueNumber(sumRes.totalStockValue, currency, rateRes.rate);
        animateNumber(totalStockQtyRef.current, 0, sumRes.totalStockQuantity);
        animateNumber(lowStockRef.current, 0, sumRes.lowStockCount + sumRes.outOfStockCount);
        animateNumber(activePORef.current, 0, sumRes.activePurchaseOrders);
        animateNumber(inCountRef.current, 0, sumRes.monthlyInboundCount);
        animateNumber(outCountRef.current, 0, sumRes.monthlyOutboundCount);
      }, 50);

      if (isManual) {
        toast.success('Data dasbor berhasil disegarkan dari database!');
      }
    } catch {
      // Data Fallback jika offline
      const fallbackSum: DashboardSummary = {
        totalProducts: 32,
        totalStockQuantity: 20688,
        totalStockValue: 17222461000,
        lowStockCount: 0,
        outOfStockCount: 1,
        totalWarehouses: 20,
        totalSuppliers: 21,
        activePurchaseOrders: 13,
        monthlyInboundCount: 9,
        monthlyOutboundCount: 8
      };
      setSummary(fallbackSum);
      setChartData({
        months: ['Mar 2026', 'Apr 2026', 'Mei 2026', 'Jun 2026', 'Jul 2026', 'Agu 2026'],
        inboundData: [0, 0, 0, 0, 0, 690],
        outboundData: [0, 0, 0, 0, 0, 680],
        categoryDistribution: [
          { categoryName: 'Komponen Elektronik', totalItems: 2, totalValue: 161990000 },
          { categoryName: 'Perangkat Komputer', totalItems: 2, totalValue: 2310300000 },
          { categoryName: 'Perlengkapan Jaringan', totalItems: 2, totalValue: 2409000000 },
          { categoryName: 'Perkakas Mesin', totalItems: 1, totalValue: 54400000 },
          { categoryName: 'Material Bangunan', totalItems: 1, totalValue: 42042000 },
          { categoryName: 'Kemasan & Logistik', totalItems: 2, totalValue: 41490000 },
          { categoryName: 'Bahan Kimia Industri', totalItems: 1, totalValue: 592800000 },
          { categoryName: 'Alat Pelindung Diri (APD)', totalItems: 2, totalValue: 205674000 }
        ]
      });
      setActivities([
        {
          id: 51,
          referenceNumber: 'TRX-INB-PO-202608-AC6B9A',
          transactionType: 'INBOUND',
          productName: 'Helm Keselamatan Kerja V-Gard Industrial ANSI Z89',
          quantity: 50,
          warehouseInfo: 'Masuk ke: Gudang Utama Jakarta Utara',
          performedBy: 'Ahmad Fauzi',
          createdAt: new Date().toISOString()
        }
      ]);

      setTimeout(() => {
        animateValueNumber(fallbackSum.totalStockValue, currency, 16250);
        animateNumber(totalStockQtyRef.current, 0, fallbackSum.totalStockQuantity);
        animateNumber(lowStockRef.current, 0, fallbackSum.lowStockCount + fallbackSum.outOfStockCount);
        animateNumber(activePORef.current, 0, fallbackSum.activePurchaseOrders);
        animateNumber(inCountRef.current, 0, fallbackSum.monthlyInboundCount);
        animateNumber(outCountRef.current, 0, fallbackSum.monthlyOutboundCount);
      }, 50);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handler toggle mata uang dengan live currency fetch
  const handleToggleCurrency = async () => {
    const nextCurrency = currency === 'IDR' ? 'USD' : 'IDR';
    setCurrency(nextCurrency);

    let currentRate = exchangeRate.rate;
    if (nextCurrency === 'USD') {
      setIsFetchingRate(true);
      try {
        const liveRate = await currencyApi.getUsdIdrRate();
        setExchangeRate(liveRate);
        currentRate = liveRate.rate;
      } catch {
        // Keep current rate
      } finally {
        setIsFetchingRate(false);
      }
    }

    if (summary) {
      animateValueNumber(summary.totalStockValue, nextCurrency, currentRate);
    }
  };

  // Handler ganti rentang waktu grafik
  const handleTimeframeChange = async (newMonths: 3 | 6 | 12) => {
    if (newMonths === timeframe) return;
    setTimeframe(newMonths);
    setIsFetchingChart(true);
    try {
      const chartRes = await dashboardApi.getCharts(newMonths);
      setChartData(chartRes);
    } catch {
      // Ignore
    } finally {
      setIsFetchingChart(false);
    }
  };

  // Konfigurasi Chart Batang Flat 4-Palet (#B0CDE6 & #946D6D)
  const barChartConfig = useMemo(() => {
    return {
      labels: chartData?.months || [],
      datasets: [
        {
          label: 'Barang Masuk (Inbound)',
          data: chartData?.inboundData || [],
          backgroundColor: '#B0CDE6',
          borderColor: '#2C2424',
          borderWidth: 1.5,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.65
        },
        {
          label: 'Barang Keluar (Outbound)',
          data: chartData?.outboundData || [],
          backgroundColor: '#946D6D',
          borderColor: '#2C2424',
          borderWidth: 1.5,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.65
        }
      ]
    };
  }, [chartData]);

  // Donut Chart: Ambil Top 5 kategori dan gabungkan sisanya ke "Kategori Lainnya"
  const doughnutChartConfig = useMemo(() => {
    const allCategories = chartData?.categoryDistribution || [];
    if (allCategories.length === 0) {
      return { labels: [], datasets: [] };
    }

    let labels: string[] = [];
    let data: number[] = [];

    if (allCategories.length <= 6) {
      labels = allCategories.map((c) => c.categoryName);
      data = allCategories.map((c) => (categoryMetric === 'value' ? c.totalValue : c.totalItems));
    } else {
      const top5 = allCategories.slice(0, 5);
      const others = allCategories.slice(5);

      labels = top5.map((c) => c.categoryName);
      data = top5.map((c) => (categoryMetric === 'value' ? c.totalValue : c.totalItems));

      const otherTotal = others.reduce(
        (acc, curr) => acc + (categoryMetric === 'value' ? curr.totalValue : curr.totalItems),
        0
      );
      labels.push(`Lainnya (${others.length} Kategori)`);
      data.push(otherTotal);
    }

    const paletteColors = [
      '#FDF4D2', // Cream
      '#B0CDE6', // Sky
      '#A290B7', // Lavender
      '#946D6D', // Rosewood
      '#E2D7BE', // Light Sand
      '#827373', // Muted Brown
      '#FFFFFF'  // White
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: paletteColors.slice(0, labels.length),
          borderColor: '#2C2424',
          borderWidth: 1.5
        }
      ]
    };
  }, [chartData, categoryMetric]);

  // Perhitungan total untuk List View progress bar
  const totalCategoryMetricSum = useMemo(() => {
    const list = chartData?.categoryDistribution || [];
    return list.reduce(
      (acc, c) => acc + (categoryMetric === 'value' ? c.totalValue : c.totalItems),
      0
    );
  }, [chartData, categoryMetric]);

  const totalIssuesCount = (summary?.lowStockCount || 0) + (summary?.outOfStockCount || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Halaman */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Dasbor Manajemen Gudang
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '4px', margin: 0, fontWeight: 500 }}>
            Ringkasan status stok, pergerakan inventaris, dan audit mutasi barang terkini.
          </p>
        </div>

        <button
          className="btn btn-cream"
          onClick={() => fetchDashboardData(true)}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          title="Sinkronisasi ulang seluruh data dari database"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* ====================================================================
          BENTO GRID CONTAINER
          ==================================================================== */}
      <div className="bento-grid">
        {/* Bento 1: Hero Asset & Total Stok (Span 8 - Cream #FDF4D2) */}
        <div className="bento-card bento-card-cream col-span-8">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <span className="badge badge-rosewood" style={{ marginBottom: '0.5rem' }}>
                  Aset & Saldo Inventaris
                </span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Total Nilai Aset Stok Keseluruhan
                </div>
                <h2
                  ref={totalStockValueRef}
                  style={{ fontSize: '2.125rem', fontWeight: 900, marginTop: '6px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}
                >
                  {formatMoney(summary?.totalStockValue || 0)}
                </h2>

                {/* Info Kurs Real-time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Globe size={13} color="var(--palette-rosewood)" />
                  <span>
                    Kurs Acuan: <strong>1 USD = Rp {exchangeRate.rate.toLocaleString('id-ID')}</strong>
                  </span>
                </div>
              </div>

              {/* Tombol Interaktif Currency Switcher */}
              <button
                type="button"
                onClick={handleToggleCurrency}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  backgroundColor: currency === 'USD' ? 'var(--palette-sky)' : '#FFFFFF',
                  borderColor: '#2C2424',
                  boxShadow: '0 3px 0 #2C2424',
                  cursor: 'pointer',
                  fontWeight: 800
                }}
                title="Klik untuk mengubah tampilan mata uang (IDR ⇄ USD)"
              >
                <Coins size={18} color="var(--palette-rosewood)" />
                <span>Mata Uang: <strong>{currency === 'IDR' ? 'IDR (Rp)' : 'USD ($)'}</strong></span>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1.5px dashed #2C2424'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  TOTAL UNIT FISIK
                </div>
                <div ref={totalStockQtyRef} style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {(summary?.totalStockQuantity || 0).toLocaleString('id-ID')} unit
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  PRODUK AKTIF
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {summary?.totalProducts || 0} SKU
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  FASILITAS GUDANG
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {summary?.totalWarehouses || 0} Gudang
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn-rosewood btn-sm">
              <Boxes size={16} />
              <span>Kelola Katalog Produk</span>
            </Link>
            <Link to="/inventory" className="btn btn-sky btn-sm">
              <span>Buka Lokasi Rak Stok</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Bento 2: Alert Stok & Peringatan Adaptif (Span 4 - Sky Blue #B0CDE6) */}
        <div className="bento-card bento-card-sky col-span-4">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  className={totalIssuesCount > 0 ? 'badge badge-rosewood' : 'badge badge-cream'}
                  style={{ marginBottom: '0.5rem', color: totalIssuesCount > 0 ? '#FFFFFF' : '#2C2424' }}
                >
                  {totalIssuesCount > 0 ? 'Perlu Perhatian' : 'Gudang Optimal'}
                </span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {totalIssuesCount > 0 ? 'Stok Menipis & Habis' : 'Semua Stok Aman'}
                </div>
                <h2
                  ref={lowStockRef}
                  style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    marginTop: '6px',
                    color: totalIssuesCount > 0 ? 'var(--palette-rosewood)' : 'var(--text-main)'
                  }}
                >
                  {totalIssuesCount} SKU
                </h2>
              </div>

              {/* Tombol Shortcut Filter / Status */}
              <Link
                to={totalIssuesCount > 0 ? '/inventory?status=low_stock' : '/inventory'}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--palette-cream)',
                  color: totalIssuesCount > 0 ? 'var(--palette-rosewood)' : '#2C2424',
                  border: '1.5px solid #2C2424',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 0 #2C2424',
                  textDecoration: 'none',
                  transition: 'transform 0.15s ease'
                }}
                title={totalIssuesCount > 0 ? 'Buka daftar stok yang menipis/habis' : 'Semua stok aman, lihat inventaris'}
              >
                {totalIssuesCount > 0 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
              </Link>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: '1.5' }}>
              {totalIssuesCount > 0 ? (
                <>
                  Terdapat <strong>{summary?.lowStockCount || 0}</strong> produk mendekati reorder level dan <strong>{summary?.outOfStockCount || 0}</strong> produk habis.
                </>
              ) : (
                <>
                  Seluruh <strong>{summary?.totalProducts || 0}</strong> SKU produk berada di atas batas minimum reorder. Gudang beroperasi optimal.
                </>
              )}
            </p>
          </div>

          <Link
            to={totalIssuesCount > 0 ? '/inventory?status=low_stock' : '/inventory'}
            className="btn btn-dark btn-sm"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            <span>{totalIssuesCount > 0 ? 'Tinjau & Lakukan Reorder' : 'Periksa Level Reorder Gudang'}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Bento 3: Inbound vs Outbound Velocity Chart (Span 7 - White #FFFFFF) */}
        <div className="bento-card bento-card-white col-span-7">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Pergerakan Barang ({timeframe} Bulan Terakhir)
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Perbandingan volume barang masuk (Inbound) dan keluar (Outbound).
                </p>
              </div>

              {/* Timeframe Selector Button Group (3, 6, 12 Bulan) */}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--palette-cream)', border: '1.5px solid #2C2424', borderRadius: '8px', padding: '2px', boxShadow: '0 2px 0 #2C2424' }}>
                {([3, 6, 12] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTimeframeChange(m)}
                    disabled={isFetchingChart}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: timeframe === m ? 800 : 600,
                      backgroundColor: timeframe === m ? 'var(--palette-rosewood)' : 'transparent',
                      color: timeframe === m ? '#FFFFFF' : 'var(--text-main)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Lihat tren pergerakan ${m} bulan terakhir`}
                  >
                    {m} Bulan
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: '230px', marginTop: '0.5rem', opacity: isFetchingChart ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <Bar
                data={barChartConfig}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 500,
                    easing: 'easeOutQuart'
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: '#2C2424',
                        font: { family: 'Plus Jakarta Sans', size: 12, weight: 700 },
                        boxWidth: 14,
                        boxHeight: 14
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (item) => ` ${item.dataset.label}: ${item.raw} unit`
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: { color: '#2C2424', font: { family: 'Plus Jakarta Sans', weight: 600, size: 11 } },
                      grid: { color: '#EFE8D6' }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: '#2C2424',
                        font: { family: 'Plus Jakarta Sans', weight: 600, size: 11 },
                        precision: 0
                      },
                      grid: { color: '#EFE8D6' }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #EFE8D6', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#B0CDE6', border: '1px solid #2C2424' }}></span>
              <span>Bulan Ini Masuk: <strong ref={inCountRef}>{summary?.monthlyInboundCount || 0}</strong> kali</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#946D6D', border: '1px solid #2C2424' }}></span>
              <span>Bulan Ini Keluar: <strong ref={outCountRef}>{summary?.monthlyOutboundCount || 0}</strong> kali</span>
            </div>
          </div>
        </div>

        {/* Bento 4: Distribusi Kategori (Span 5 - Lavender #A290B7) */}
        <div className="bento-card bento-card-lavender col-span-5">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Proporsi Kategori Produk
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', margin: '2px 0 0 0', opacity: 0.85 }}>
                  {categoryMetric === 'value' ? 'Persentase nilai aset stok.' : 'Jumlah total item produk.'}
                </p>
              </div>

              {/* View Mode Toggle Button: Donat vs Daftar List */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setCategoryView((v) => (v === 'donut' ? 'list' : 'donut'))}
                  className="btn btn-cream btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                  title={categoryView === 'donut' ? 'Beralih ke tampilan list lengkap' : 'Beralih ke tampilan diagram donat'}
                >
                  {categoryView === 'donut' ? (
                    <>
                      <List size={14} />
                      <span>Mode List</span>
                    </>
                  ) : (
                    <>
                      <PieChart size={14} />
                      <span>Mode Donat</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content Switcher: Donut Mode vs List Progress Bar Mode */}
            {categoryView === 'donut' ? (
              <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut
                  data={doughnutChartConfig}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: { color: '#2C2424', font: { family: 'Plus Jakarta Sans', size: 10, weight: 700 } }
                      },
                      tooltip: {
                        callbacks: {
                          label: (item) => {
                            const val = item.raw as number;
                            return categoryMetric === 'value'
                              ? ` ${item.label}: ${formatMoney(val)}`
                              : ` ${item.label}: ${val} SKU`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              /* List Mode: Scrollable Progress Bar List untuk menangani banyak kategori */
              <div
                style={{
                  height: '220px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {(chartData?.categoryDistribution || []).map((cat, idx) => {
                  const metricVal = categoryMetric === 'value' ? cat.totalValue : cat.totalItems;
                  const percentage = totalCategoryMetricSum > 0 ? (metricVal / totalCategoryMetricSum) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #2C2424',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        boxShadow: '0 2px 0 #2C2424'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-main)' }}>{cat.categoryName}</span>
                        <span style={{ color: 'var(--palette-rosewood)' }}>{formatMoney(cat.totalValue)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', backgroundColor: '#EFE8D6', borderRadius: '4px', overflow: 'hidden', border: '1px solid #2C2424' }}>
                          <div
                            style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: '#946D6D',
                              borderRadius: '3px'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                        {cat.totalItems} Produk SKU terdaftar
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link to="/categories" className="btn btn-cream btn-sm" style={{ width: '100%', marginTop: '0.75rem' }}>
            <Layers size={16} />
            <span>Kelola Master Kategori</span>
          </Link>
        </div>

        {/* Bento 5: Purchase Order Aktif (Span 4 - Rosewood #946D6D) */}
        <div className="bento-card bento-card-rosewood col-span-4">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-cream" style={{ marginBottom: '0.5rem', color: '#2C2424' }}>
                  Pembelian & Vendor
                </span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--palette-cream)' }}>
                  Purchase Orders (PO) Berjalan
                </div>
                <h2
                  ref={activePORef}
                  style={{ fontSize: '2rem', fontWeight: 900, marginTop: '6px', color: '#FFFFFF' }}
                >
                  {summary?.activePurchaseOrders || 0} PO
                </h2>
              </div>

              {/* Tombol Shortcut PO */}
              <Link
                to="/purchase-orders"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--palette-cream)',
                  color: 'var(--palette-rosewood)',
                  border: '1.5px solid #2C2424',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 0 #2C2424',
                  textDecoration: 'none',
                  transition: 'transform 0.15s ease'
                }}
                title="Buka daftar Purchase Orders (PO)"
              >
                <ShoppingCart size={24} />
              </Link>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--palette-cream)', marginTop: '0.75rem', lineHeight: '1.5' }}>
              Terhubung dengan <strong>{summary?.totalSuppliers || 0}</strong> mitra pemasok aktif untuk suplai pergudangan.
            </p>
          </div>

          <Link to="/purchase-orders" className="btn btn-cream btn-sm" style={{ width: '100%', marginTop: '1rem' }}>
            <span>Buka Daftar Purchase Orders</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Bento 6: Riwayat Mutasi Terbaru (Span 8 - White #FFFFFF) */}
        <div className="bento-card bento-card-white col-span-8">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Riwayat Mutasi Barang Terakhir
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Log 10 pergerakan inventaris dan barang masuk/keluar.
                </p>
              </div>

              <Link to="/transactions" className="btn btn-sky btn-sm" title="Lihat seluruh riwayat mutasi transaksi">
                Lihat Semua &rarr;
              </Link>
            </div>

            <div className="table-container" style={{ border: '1.5px solid #2C2424', borderRadius: '10px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Referensi</th>
                    <th>Tipe</th>
                    <th>Nama Produk</th>
                    <th>Unit</th>
                    <th>Keterangan</th>
                    <th>Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                        Belum ada mutasi barang tercatat.
                      </td>
                    </tr>
                  ) : (
                    activities.slice(0, 5).map((act) => (
                      <tr key={act.id}>
                        <td style={{ fontWeight: 700 }}>{act.referenceNumber}</td>
                        <td>
                          <StatusBadge status={act.transactionType} type="transaction" />
                        </td>
                        <td>{act.productName}</td>
                        <td style={{ fontWeight: 800 }}>
                          {act.transactionType === 'INBOUND' ? `+${act.quantity}` : `-${act.quantity}`}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{act.warehouseInfo}</td>
                        <td style={{ fontSize: '0.875rem' }}>{act.performedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

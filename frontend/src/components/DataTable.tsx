import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  LayoutGrid,
  Table as TableIcon,
  ArrowLeftRight,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  title: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: (item: T) => string;
  pageSizeDefault?: number;
  emptyMessage?: string;
  headerAction?: React.ReactNode;
  mobileCardRender?: (item: T, index: number) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Cari data...',
  searchKey,
  pageSizeDefault = 10,
  emptyMessage = 'Tidak ada data ditemukan',
  headerAction,
  mobileCardRender,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'cards' : 'table';
    }
    return 'table';
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileScreen(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (searchKey) {
        return searchKey(item).toLowerCase().includes(term);
      }
      return Object.values(item).some((val) =>
        val ? String(val).toLowerCase().includes(term) : false,
      );
    });
  }, [data, searchTerm, searchKey]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const startRecord = filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, filteredData.length);

  // Generate page numbers array with ellipsis for clean navigation
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  // Default automatic card renderer when mobileCardRender is not provided
  const defaultCardRender = (item: T, idx: number) => {
    const firstCol = columns[0];
    const actionCol = columns.find(
      (c) => c.key === 'actions' || c.key === 'bukti' || c.title === 'Aksi' || c.title === 'Bukti',
    );
    const badgeCol = columns.find(
      (c) => c.key === 'status' || c.key === 'role' || c.title.toLowerCase().includes('status'),
    );
    const otherCols = columns.filter(
      (c) => c !== firstCol && c !== actionCol && c !== badgeCol,
    );

    return (
      <div
        key={item.id || idx}
        className="card"
        style={{
          padding: '0.875rem 1rem',
          borderRadius: '10px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
        }}
      >
        {/* Card Header: Primary Title + Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b', flex: 1, minWidth: 0 }}>
            {firstCol ? (firstCol.render ? firstCol.render(item, idx) : item[firstCol.key]) : null}
          </div>
          {badgeCol && (
            <div style={{ flexShrink: 0 }}>
              {badgeCol.render ? badgeCol.render(item, idx) : item[badgeCol.key]}
            </div>
          )}
        </div>

        {/* Card Body: Details Grid */}
        {otherCols.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.5rem',
              padding: '0.5rem 0.65rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #f1f5f9',
            }}
          >
            {otherCols.map((col) => (
              <div key={col.key} style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>
                  {col.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#09090b' }}>
                  {col.render ? col.render(item, idx) : item[col.key] || '-'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Card Footer: Action Buttons */}
        {actionCol && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingTop: '0.35rem',
              borderTop: '1px solid #f4f4f5',
            }}
          >
            {actionCol.render ? actionCol.render(item, idx) : item[actionCol.key]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Table Toolbar */}
      <div
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.625rem',
          borderBottom: '1px solid var(--border)',
          background: '#ffffff',
        }}
      >
        {/* Left: Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: isMobileScreen ? '100%' : '320px' }}>
          <Search
            size={14}
            color="#71717a"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{ paddingLeft: '2rem', height: '34px', fontSize: '0.8125rem', width: '100%' }}
          />
        </div>

        {/* Right Controls: View Switcher & Custom Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Segmented View Mode Switcher */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f4f4f5',
              borderRadius: '6px',
              padding: '2px',
              border: '1px solid var(--border)',
            }}
            title="Pilih Tampilan: Kartu (Mobile) atau Tabel"
          >
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.55rem',
                borderRadius: '4px',
                border: 'none',
                background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                color: viewMode === 'cards' ? '#B12523' : '#71717a',
                fontWeight: viewMode === 'cards' ? 700 : 500,
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutGrid size={13} />
              <span>Kartu</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.55rem',
                borderRadius: '4px',
                border: 'none',
                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? '#B12523' : '#71717a',
                fontWeight: viewMode === 'table' ? 700 : 500,
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <TableIcon size={13} />
              <span>Tabel</span>
            </button>
          </div>

          {headerAction && <div>{headerAction}</div>}
        </div>
      </div>

      {/* Main Content: Either Mobile Cards or Scrollable Table */}
      {viewMode === 'cards' ? (
        /* 1. RESPONSIVE CARDS VIEW */
        <div style={{ padding: '0.75rem', background: '#fafafa' }}>
          {paginatedData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {paginatedData.map((item, idx) =>
                mobileCardRender ? mobileCardRender(item, idx) : defaultCardRender(item, idx),
              )}
            </div>
          ) : (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', background: '#ffffff', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#71717a' }}>
                <Inbox size={32} strokeWidth={1.5} color="#d4d4d8" />
                <span style={{ fontSize: '0.8125rem' }}>{emptyMessage}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2. HORIZONTALLY SCROLLABLE DATA TABLE */
        <div>
          {/* Subtle mobile swipe guidance */}
          <div className="mobile-swipe-hint">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowLeftRight size={12} color="#B12523" />
              <span>Geser tabel ke samping untuk melihat kolom lengkap</span>
            </div>
            <span style={{ fontSize: '0.625rem', color: '#a1a1aa' }}>Swipe ↔</span>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        width: col.width,
                      }}
                    >
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, idx) => (
                    <tr key={item.id || idx}>
                      {columns.map((col) => (
                        <td key={col.key}>
                          {col.render ? col.render(item, idx) : item[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#71717a' }}>
                        <Inbox size={32} strokeWidth={1.5} color="#d4d4d8" />
                        <span style={{ fontSize: '0.8125rem' }}>{emptyMessage}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shadcn-Style Table Pagination Footer (Responsive on Mobile) */}
      <div
        style={{
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderTop: '1px solid var(--border)',
          background: '#ffffff',
          fontSize: '0.8125rem',
          color: '#71717a',
        }}
      >
        {/* Left: Summary text & Rows per page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.75rem' }}>
            <strong style={{ color: '#09090b', fontWeight: 600 }}>{startRecord}</strong>-
            <strong style={{ color: '#09090b', fontWeight: 600 }}>{endRecord}</strong> dari{' '}
            <strong style={{ color: '#09090b', fontWeight: 600 }}>{filteredData.length}</strong> data
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="form-control"
              style={{
                width: '60px',
                height: '28px',
                padding: '0 0.35rem',
                fontSize: '0.72rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Right: Touch-Friendly Pagination Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {/* First Page (Desktop only) */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
            title="Halaman Pertama"
            style={{ width: '28px', height: '28px', padding: 0, display: isMobileScreen ? 'none' : 'inline-flex' }}
          >
            <ChevronsLeft size={13} />
          </button>

          {/* Prev Page */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Halaman Sebelumnya"
            style={{ height: '28px', padding: isMobileScreen ? '0 0.5rem' : '0 0.35rem', fontSize: '0.72rem' }}
          >
            <ChevronLeft size={13} />
            {isMobileScreen && <span>Prev</span>}
          </button>

          {/* Page Info Pill / Numbers */}
          {isMobileScreen ? (
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#09090b', padding: '0 0.35rem' }}>
              {currentPage} / {totalPages}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', margin: '0 0.2rem' }}>
              {pageNumbers.map((num, idx) => {
                if (num === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{ padding: '0 0.2rem', color: '#a1a1aa', fontSize: '0.72rem' }}
                    >
                      •••
                    </span>
                  );
                }
                const isCurrent = num === currentPage;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(Number(num))}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 700 : 500,
                      border: '1px solid',
                      borderColor: isCurrent ? '#B12523' : 'transparent',
                      backgroundColor: isCurrent ? '#B12523' : 'transparent',
                      color: isCurrent ? '#ffffff' : '#3f3f46',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = '#f4f4f5';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          )}

          {/* Next Page */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Halaman Selanjutnya"
            style={{ height: '28px', padding: isMobileScreen ? '0 0.5rem' : '0 0.35rem', fontSize: '0.72rem' }}
          >
            {isMobileScreen && <span>Next</span>}
            <ChevronRight size={13} />
          </button>

          {/* Last Page (Desktop only) */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Halaman Terakhir"
            style={{ width: '28px', height: '28px', padding: 0, display: isMobileScreen ? 'none' : 'inline-flex' }}
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

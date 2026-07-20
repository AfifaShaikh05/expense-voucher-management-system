import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { getAllVouchers } from '../../api/director';
import s from '../employee/employee.module.css';

const STATUS_META = {
  DRAFT: { cls: s.badgeDraft, label: 'Draft' },
  SUBMITTED: { cls: s.badgeSubmitted, label: 'Submitted' },
  PENDING_APPROVAL: { cls: s.badgePending, label: 'Pending Approval' },
  APPROVED: { cls: s.badgeApproved, label: 'Approved' },
  REJECTED: { cls: s.badgeRejected, label: 'Rejected' },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { cls: s.badgeDraft, label: status };
  return <span className={`${s.badge} ${meta.cls}`}>{meta.label}</span>;
};

const getDateInputValue = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DirectorVouchers = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await getAllVouchers({ page, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
        setVouchers(data.vouchers);
        setMeta(data.meta);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load vouchers');
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [page]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };
  const filtered = vouchers.filter((voucher) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      voucher.voucherNumber?.toLowerCase().includes(q) ||
      voucher.departmentName?.toLowerCase().includes(q) ||
      voucher.employee?.name?.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || voucher.status === statusFilter;
    const voucherDate = getDateInputValue(voucher.expenseDate);
    const matchesDateFrom = !dateFromFilter || voucherDate >= dateFromFilter;
    const matchesDateTo = !dateToFilter || voucherDate <= dateToFilter;
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  return (
    <div className={s.page}>
      <TopBar />
      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1 className={s.pageTitle}>All Vouchers</h1>
          <button onClick={() => navigate('/director/dashboard')} className={s.btnSecondary}>
            Dashboard
          </button>
        </div>

        {error && <div className={s.alertError}>{error}</div>}

        <div className={s.card}>
          <div className={s.voucherCardHeader}>
            <div className={s.sectionTitle} style={{ margin: 0, border: 'none', padding: 0 }}>
              Vouchers
            </div>
            <div className={s.voucherFilters}>
              <input
                id="director-voucher-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={s.searchInput}
                placeholder="Search Voucher No., Department or Employee..."
                aria-label="Search vouchers by number, department or employee"
              />
              <select
                id="director-voucher-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={s.filterSelect}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
            From
            <input
              id="director-voucher-from-date-filter"
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className={s.filterSelect}
              aria-label="Filter from expense date"
            />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
            To
            <input
              id="director-voucher-to-date-filter"
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className={s.filterSelect}
              aria-label="Filter to expense date"
            />
          </label>
          <button
            type="button"
            onClick={handleClearFilters}
            className={s.btnSecondary}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            Clear Filters
          </button>
            </div>
          </div>

          {loading ? (
            <div className={s.loadingState}>Loading vouchers...</div>
          ) : filtered.length === 0 ? (
            <div className={s.emptyState}>
              <p>{vouchers.length === 0 ? 'No vouchers found.' : 'No vouchers match your search or filter.'}</p>
            </div>
          ) : (
            <>
              <div className={s.tableWrapScrollable}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Voucher No.</th>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Department</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((voucher) => (
                      <tr
                        key={voucher.id}
                        className={s.tableRow}
                        onClick={() => navigate(`/director/vouchers/${voucher.id}`)}
                      >
                        <td style={{ fontWeight: 600 }}>{voucher.voucherNumber}</td>
                        <td>{voucher.employee?.name || '-'}</td>
                        <td>{new Date(voucher.expenseDate).toLocaleDateString('en-IN')}</td>
                        <td>{voucher.departmentName}</td>
                        <td>INR {Number(voucher.amount).toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={voucher.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {meta.totalPages > 1 && (
                <div className={s.pagination}>
                  <button className={s.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Prev
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`${s.pageBtn} ${p === page ? s.pageBtnActive : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button className={s.pageBtn} disabled={page === meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </button>
                </div>
              )}

              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center' }}>
                {filtered.length} of {meta.total} voucher{meta.total !== 1 ? 's' : ''}
                {(searchQuery || statusFilter || dateFromFilter || dateToFilter) ? ' (filtered)' : ' total'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectorVouchers;





import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { getEmployeeDashboard, getMyVouchers } from '../../api/vouchers';
import s from './employee.module.css';

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

/* ── My Vouchers card — owns search/filter state ──────── */
const MyVouchersCard = ({ navigate }) => {
  const [vouchers, setVouchers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  // Client-side filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setListLoading(true);
        // Fetch up to 50 per page so client-side filtering covers a useful range
        const { data } = await getMyVouchers({ page, limit: 50 });
        setVouchers(data.vouchers);
        setMeta(data.meta);
      } catch (err) {
        setListError(err.response?.data?.message || 'Failed to load vouchers');
      } finally {
        setListLoading(false);
      }
    };
    fetchVouchers();
  }, [page]);

  // Client-side filtered list
  const filtered = vouchers.filter(v => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      v.voucherNumber?.toLowerCase().includes(q) ||
      v.expenseTitle?.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || v.status === statusFilter;
    
    let matchesFromDate = true;
    let matchesToDate = true;
    
    if (fromDate) {
      matchesFromDate = new Date(v.expenseDate) >= new Date(fromDate);
    }
    if (toDate) {
      // Add one day to toDate to include the whole day
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      matchesToDate = new Date(v.expenseDate) <= to;
    }

    return matchesSearch && matchesStatus && matchesFromDate && matchesToDate;
  });

  return (
    <div className={s.card}>
      {/* Header row: title on left, search + filter on right */}
      <div className={s.voucherCardHeader}>
        <div className={s.sectionTitle} style={{ margin: 0, border: 'none', padding: 0 }}>
          My Vouchers
        </div>
        <div className={s.voucherFilters}>
          <input
            id="voucher-search"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={s.searchInput}
            placeholder="Search Voucher No. or Title…"
            aria-label="Search vouchers by number or title"
          />
          <input 
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className={s.filterSelect}
            aria-label="From Date"
            title="From Date"
          />
          <input 
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className={s.filterSelect}
            aria-label="To Date"
            title="To Date"
          />
          <select
            id="voucher-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={s.filterSelect}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {listError && <div className={s.alertError} style={{ marginTop: '0.75rem' }}>{listError}</div>}

      {listLoading ? (
        <div className={s.loadingState}>Loading vouchers…</div>
      ) : filtered.length === 0 ? (
        <div className={s.emptyState}>
          <span style={{ fontSize: '2rem' }}>📄</span>
          <p>
            {vouchers.length === 0
              ? (
                <>No vouchers yet.{' '}
                  <Link to="/employee/vouchers/create" style={{ color: '#2d6a9f', fontWeight: 600 }}>
                    Create your first one!
                  </Link>
                </>
              )
              : 'No vouchers match your search or filter.'}
          </p>
        </div>
      ) : (
        <>
          <div className={s.tableWrapScrollable}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Voucher No.</th>
                  <th>Expense Title</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr
                    key={v.id}
                    className={s.tableRow}
                    onClick={() => navigate(`/employee/vouchers/${v.id}`)}
                  >
                    <td style={{ fontWeight: 600 }}>{v.voucherNumber}</td>
                    <td>{v.expenseTitle}</td>
                    <td>{new Date(v.expenseDate).toLocaleDateString('en-IN')}</td>
                    <td>₹{Number(v.amount).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className={s.pagination}>
              <button className={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`${s.pageBtn} ${p === page ? s.pageBtnActive : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className={s.pageBtn} disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}

          <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center' }}>
            {filtered.length} of {meta.total} voucher{meta.total !== 1 ? 's' : ''}
            {(searchQuery || statusFilter) ? ' (filtered)' : ' total'}
          </p>
        </>
      )}
    </div>
  );
};

/* ── Main Dashboard component ─────────────────────────── */
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getEmployeeDashboard();
        setStats(data);
      } catch (err) {
        setStatsError(err.response?.data?.message || 'Failed to load dashboard stats');
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className={s.page}>
      <TopBar />
      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1 className={s.pageTitle}>My Dashboard</h1>
          <Link to="/employee/vouchers/create" className={s.btnPrimary}>+ Create Voucher</Link>
        </div>

        {statsLoading && <div className={s.loadingState}>Loading stats…</div>}
        {statsError && <div className={s.alertError}>{statsError}</div>}

        {stats && (
          <div className={s.statsGrid}>
            <div className={`${s.statCard} ${s.statCardAccent}`}>
              <div className={s.statValue}>{stats.totalVouchers}</div>
              <div className={s.statLabel}>Total Vouchers</div>
            </div>
            <div className={`${s.statCard} ${s.statCardDraft}`}>
              <div className={s.statValue}>{stats.draftVouchers}</div>
              <div className={s.statLabel}>Drafts</div>
            </div>
            <div className={`${s.statCard} ${s.statCardPending}`}>
              <div className={s.statValue}>{stats.pendingApproval}</div>
              <div className={s.statLabel}>Pending Approval</div>
            </div>
            <div className={`${s.statCard} ${s.statCardApproved}`}>
              <div className={s.statValue}>{stats.approvedVouchers}</div>
              <div className={s.statLabel}>Approved</div>
            </div>
            <div className={`${s.statCard} ${s.statCardRejected}`}>
              <div className={s.statValue}>{stats.rejectedVouchers}</div>
              <div className={s.statLabel}>Rejected</div>
            </div>
            <div className={`${s.statCard} ${s.statCardAmount}`}>
              <div className={s.statValue}>₹{Number(stats.totalAmountClaimed).toLocaleString('en-IN')}</div>
              <div className={s.statLabel}>Total Claimed</div>
            </div>
          </div>
        )}

        <MyVouchersCard navigate={navigate} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;

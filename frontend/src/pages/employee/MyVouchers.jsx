import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { getMyVouchers } from '../../api/vouchers';
import s from './employee.module.css';

// Maps VoucherStatus enum values to badge CSS classes and labels
const STATUS_META = {
  DRAFT:            { cls: s.badgeDraft,     label: 'Draft' },
  SUBMITTED:        { cls: s.badgeSubmitted,  label: 'Submitted' },
  PENDING_APPROVAL: { cls: s.badgePending,    label: 'Pending Approval' },
  APPROVED:         { cls: s.badgeApproved,   label: 'Approved' },
  REJECTED:         { cls: s.badgeRejected,   label: 'Rejected' },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { cls: s.badgeDraft, label: status };
  return <span className={`${s.badge} ${meta.cls}`}>{meta.label}</span>;
};

const MyVouchers = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        // GET /api/vouchers/my?page=&limit=
        const { data } = await getMyVouchers({ page, limit: 10 });
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

  const handleRowClick = (id) => navigate(`/employee/vouchers/${id}`);

  return (
    <div className={s.page}>
      <TopBar />
      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1 className={s.pageTitle}>My Vouchers</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate('/employee/dashboard')} className={s.btnSecondary}>
              ← Dashboard
            </button>
            <button onClick={() => navigate('/employee/vouchers/create')} className={s.btnPrimary}>
              + Create Voucher
            </button>
          </div>
        </div>

        {error && <div className={s.alertError}>{error}</div>}

        <div className={s.card}>
          {loading ? (
            <div className={s.loadingState}>Loading vouchers…</div>
          ) : vouchers.length === 0 ? (
            <div className={s.emptyState}>
              <span style={{ fontSize: '2.5rem' }}>📄</span>
              <p>No vouchers found. Create your first one!</p>
              <button onClick={() => navigate('/employee/vouchers/create')}
                className={s.btnPrimary} style={{ marginTop: '1rem' }}>+ Create Voucher</button>
            </div>
          ) : (
            <>
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Voucher No.</th>
                      <th>Expense Date</th>
                      <th>Department</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map(v => (
                      <tr key={v.id} className={s.tableRow} onClick={() => handleRowClick(v.id)}>
                        <td style={{ fontWeight: 600 }}>{v.voucherNumber}</td>
                        <td>{new Date(v.expenseDate).toLocaleDateString('en-IN')}</td>
                        <td>{v.departmentName}</td>
                        <td>{v.expenseCategory}</td>
                        <td>₹{Number(v.amount).toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={v.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className={s.pagination}>
                  <button className={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    ← Prev
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p}
                      className={`${s.pageBtn} ${p === page ? s.pageBtnActive : ''}`}
                      onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button className={s.pageBtn} disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>
                    Next →
                  </button>
                </div>
              )}
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center' }}>
                {meta.total} voucher{meta.total !== 1 ? 's' : ''} total
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyVouchers;

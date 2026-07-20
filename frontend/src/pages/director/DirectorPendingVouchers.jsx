import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { getPendingVouchers } from '../../api/director';
import s from '../employee/employee.module.css';

const STATUS_META = {
  PENDING_APPROVAL: { cls: s.badgePending, label: 'Pending Approval' }
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { cls: s.badgeDraft, label: status };
  return <span className={`${s.badge} ${meta.cls}`}>{meta.label}</span>;
};

const DirectorPendingVouchers = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPendingVouchers = async () => {
      try {
        setLoading(true);
        const { data } = await getPendingVouchers({ page, limit: 10 });
        setVouchers(data.vouchers);
        setMeta(data.meta);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load pending vouchers');
      } finally {
        setLoading(false);
      }
    };
    fetchPendingVouchers();
  }, [page]);

  const handleRowClick = (id) => navigate(`/director/vouchers/${id}`);

  return (
    <div className={s.page}>
      <TopBar />
      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1 className={s.pageTitle}>Pending Approvals</h1>
          <button onClick={() => navigate('/director/dashboard')} className={s.btnSecondary}>
            â† Dashboard
          </button>
        </div>

        {error && <div className={s.alertError}>{error}</div>}

        <div className={s.card}>
          {loading ? (
            <div className={s.loadingState}>Loading vouchersâ€¦</div>
          ) : vouchers.length === 0 ? (
            <div className={s.emptyState}>
              <span style={{ fontSize: '2.5rem' }}>âœ…</span>
              <p>All caught up! No vouchers are pending approval.</p>
            </div>
          ) : (
            <>
              <div className={s.tableWrapScrollable}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Voucher No.</th>
                      <th>Employee</th>
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
                        <td>{v.employee?.name || 'â€”'}</td>
                        <td>{new Date(v.expenseDate).toLocaleDateString('en-IN')}</td>
                        <td>{v.departmentName}</td>
                        <td>{v.expenseCategory}</td>
                        <td>â‚¹{Number(v.amount).toLocaleString('en-IN')}</td>
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
                    â† Prev
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p}
                      className={`${s.pageBtn} ${p === page ? s.pageBtnActive : ''}`}
                      onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button className={s.pageBtn} disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>
                    Next â†’
                  </button>
                </div>
              )}
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center' }}>
                {meta.total} pending voucher{meta.total !== 1 ? 's' : ''} total
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectorPendingVouchers;


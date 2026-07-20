import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { getVoucherById } from '../../api/accounts';
import s from '../employee/employee.module.css';
import p from './AccountsVoucherDetail.module.css';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const STATUS_META = {
  DRAFT: { cls: s.badgeDraft, label: 'Draft' },
  SUBMITTED: { cls: s.badgeSubmitted, label: 'Submitted' },
  PENDING_APPROVAL: { cls: s.badgePending, label: 'Pending Approval' },
  APPROVED: { cls: s.badgeApproved, label: 'Approved' },
  REJECTED: { cls: s.badgeRejected, label: 'Rejected' },
};

const fmtDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

const fmtDateTime = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

const fmtAmount = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const signatureUrl = (filename) =>
  filename ? `${API_BASE}/uploads/signatures/${filename}` : '';

const DetailItem = ({ label, value, fullWidth = false, children }) => (
  <div
    className={`${s.detailItem} ${fullWidth ? p.printWide : ''}`}
    style={fullWidth ? { gridColumn: '1 / -1' } : undefined}
  >
    <div className={`${s.detailLabel} ${p.printLabel}`}>{label}</div>
    <div className={`${s.detailValue} ${p.printValue}`}>{children || value || '-'}</div>
  </div>
);

const SignatureItem = ({ label, filename, fallback }) => {
  const url = signatureUrl(filename);

  return (
    <div className={s.detailItemInlineSig}>
      <div className={`${s.detailLabel} ${p.printLabel}`}>{label}</div>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" title="Open signature" className={p.printSignatureLink}>
          <img
            src={url}
            alt={label}
            className={`${s.signaturePreview} ${p.printSignatureImage}`}
          />
        </a>
      ) : (
        <div className={`${s.detailValue} ${p.printValue}`} style={{ color: '#6b7280' }}>
          {fallback}
        </div>
      )}
    </div>
  );
};

const AccountsVoucherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await getVoucherById(id);
        setVoucher(data.voucher);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load voucher');
      } finally {
        setLoading(false);
      }
    };

    fetchVoucher();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className={`${s.page} ${p.printPage}`}>
        <div className={p.printHidden}><TopBar /></div>
        <div className={`${s.container} ${p.printContainer}`}>
          <div className={`${s.card} ${p.printCard}`}>
            <div className={s.loadingState}>Loading voucher...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${s.page} ${p.printPage}`}>
        <div className={p.printHidden}><TopBar /></div>
        <div className={`${s.container} ${p.printContainer}`}>
          <div className={`${s.alertError} ${p.printHidden}`}>{error}</div>
          <button onClick={() => navigate('/accounts/dashboard')} className={`${s.btnSecondary} ${p.printHidden}`}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!voucher) return null;

  const statusMeta = STATUS_META[voucher.status] || {
    cls: s.badgeDraft,
    label: voucher.status,
  };

  return (
    <div className={`${s.page} ${p.printPage}`}>
      <div className={p.printHidden}><TopBar /></div>
      <div className={`${s.container} ${p.printContainer}`}>
        <div className={p.printArea}>
          <div className={`${s.pageHeader} ${p.printHeader}`}>
            <div>
              <h1 className={s.pageTitle}>{voucher.voucherNumber}</h1>
              <div className={p.printHeaderMeta}>
                <span className={`${s.badge} ${statusMeta.cls} ${p.printBadge}`}>
                  {statusMeta.label}
                </span>
                <span className={`${s.detailValue} ${p.printValue}`}>{fmtAmount(voucher.amount)}</span>
              </div>
            </div>
            <div className={`${p.printActions} ${p.printHidden}`}>
              <button onClick={handlePrint} className={`${s.btnSecondary} ${p.printButton}`}>
                Print / Download
              </button>
              <button onClick={() => navigate('/accounts/dashboard')} className={s.btnSecondary}>
                Back to Dashboard
              </button>
            </div>
          </div>

          {voucher.status === 'REJECTED' && voucher.rejectionReason && (
            <div className={`${s.rejectionBanner} ${p.printRejectionBanner}`}>
              <div className={s.rejectionTitle}>Voucher Rejected</div>
              <div className={s.rejectionText}>{voucher.rejectionReason}</div>
            </div>
          )}

          <div className={`${s.card} ${p.printCard}`}>
            <div className={`${s.sectionTitle} ${p.printSectionTitle}`}>Voucher Details</div>
            <div className={`${s.detailGrid} ${p.printGrid}`}>
              <DetailItem label="Voucher Number" value={voucher.voucherNumber} />
              <DetailItem label="Status" value={statusMeta.label} />
              <DetailItem label="Voucher Date" value={fmtDate(voucher.voucherDate)} />
              <DetailItem label="Expense Date" value={fmtDate(voucher.expenseDate)} />
              <DetailItem label="Department" value={voucher.departmentName} />
              <DetailItem label="Category" value={voucher.expenseCategory} />
              <DetailItem label="Expense Title" value={voucher.expenseTitle} />
              <DetailItem label="Amount" value={fmtAmount(voucher.amount)} />
              <DetailItem label="Description" value={voucher.expenseDescription} fullWidth />
            </div>
          </div>

          <div className={`${s.card} ${p.printCard}`}>
            <div className={`${s.sectionTitle} ${p.printSectionTitle}`}>Employee Information</div>
            <div className={`${s.detailGrid} ${p.printGrid}`}>
              <DetailItem label="Employee Name" value={voucher.employee?.name} />
              <DetailItem label="Employee Email" value={voucher.employee?.email} />
              <DetailItem label="Employee ID" value={voucher.employee?.employeeId} />
              <SignatureItem
                label="Employee Signature"
                filename={voucher.employeeSignature}
                fallback="Not provided"
              />
            </div>
          </div>

          <div className={`${s.card} ${p.printCard}`}>
            <div className={`${s.sectionTitle} ${p.printSectionTitle}`}>Approval Information</div>
            <div className={`${s.detailGrid} ${p.printGrid}`}>
              <DetailItem label="Director Name" value={voucher.director?.name} />
              <DetailItem label="Director Email" value={voucher.director?.email} />
              <DetailItem label="Approval Date" value={fmtDate(voucher.approvalDate)} />
              <SignatureItem
                label="Director Signature"
                filename={voucher.directorSignature}
                fallback="Not approved yet"
              />
            </div>
          </div>

          <div className={`${s.card} ${p.printCard}`}>
            <div className={`${s.sectionTitle} ${p.printSectionTitle}`}>Audit Timestamps</div>
            <div className={`${s.detailGrid} ${p.printGrid}`}>
              <DetailItem label="Created At" value={fmtDateTime(voucher.createdAt)} />
              <DetailItem label="Updated At" value={fmtDateTime(voucher.updatedAt)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsVoucherDetail;


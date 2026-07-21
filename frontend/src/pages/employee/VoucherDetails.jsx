import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import ImageModal from '../../components/ImageModal';
import {
  deleteEmployeeSignature,
  getVoucherById,
  submitVoucher,
  uploadEmployeeSignature,
} from '../../api/vouchers';
import s from './employee.module.css';


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

const fmtAmount = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const DetailItem = ({ label, value, fullWidth = false }) => (
  <div className={s.detailItem} style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
    <div className={s.detailLabel}>{label}</div>
    <div className={s.detailValue}>{value || '-'}</div>
  </div>
);

const VoucherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  const handleSignatureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPEG and PNG images are allowed' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be under 2 MB' });
      return;
    }

    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });
      const formData = new FormData();
      formData.append('signature', file);
      const { data } = await uploadEmployeeSignature(id, formData);
      setVoucher(data.voucher);
      setMessage({ type: 'success', text: 'Signature uploaded successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload signature' });
    } finally {
      setActionLoading(false);
      e.target.value = '';
    }
  };

  const handleDeleteSignature = async () => {
    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });
      const { data } = await deleteEmployeeSignature(id);
      setVoucher(data.voucher);
      setMessage({ type: 'success', text: 'Signature removed successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to remove signature' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitVoucher = async () => {
    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });
      const { data } = await submitVoucher(id);
      setVoucher(data.voucher);
      setMessage({ type: 'success', text: 'Voucher submitted for approval.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit voucher' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={s.page}>
        <TopBar />
        <div className={s.container}>
          <div className={s.card}><div className={s.loadingState}>Loading voucher...</div></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.page}>
        <TopBar />
        <div className={s.container}>
          <div className={s.alertError}>{error}</div>
          <button onClick={() => navigate('/employee/dashboard')} className={s.btnSecondary}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!voucher) return null;

  const isDraft = voucher.status === 'DRAFT';
  const statusMeta = STATUS_META[voucher.status] || { cls: s.badgeDraft, label: voucher.status };
  const employeeSignatureUrl = voucher.employeeSignature;
  const directorSignatureUrl = voucher.directorSignature;

  return (
    <div className={s.page}>
      <TopBar />
      <div className={s.container}>
        <div className={s.pageHeader}>
          <div>
            <h1 className={s.pageTitle}>{voucher.voucherNumber}</h1>
            <span className={`${s.badge} ${statusMeta.cls}`} style={{ marginTop: '0.25rem' }}>
              {statusMeta.label}
            </span>
          </div>
          <button onClick={() => navigate('/employee/dashboard')} className={s.btnSecondary}>
            Back to Dashboard
          </button>
        </div>

        {message.text && (
          <div className={message.type === 'success' ? s.alertSuccess : s.alertError}>
            {message.text}
          </div>
        )}

        {voucher.status === 'REJECTED' && voucher.rejectionReason && (
          <div className={s.rejectionBanner}>
            <div className={s.rejectionTitle}>Voucher Rejected</div>
            <div className={s.rejectionText}>{voucher.rejectionReason}</div>
          </div>
        )}

        <div className={s.card}>
          <div className={s.sectionTitle}>Voucher Details</div>
          <div className={s.detailGrid}>
            <DetailItem label="Voucher Number" value={voucher.voucherNumber} />
            <DetailItem label="Voucher Date" value={fmtDate(voucher.voucherDate)} />
            <DetailItem label="Expense Date" value={fmtDate(voucher.expenseDate)} />
            <DetailItem label="Department" value={voucher.departmentName} />
            <DetailItem label="Expense Title" value={voucher.expenseTitle} />
            <DetailItem label="Category" value={voucher.expenseCategory} />
            <DetailItem label="Amount" value={fmtAmount(voucher.amount)} />
            <DetailItem label="Description" value={voucher.expenseDescription} fullWidth />
          </div>

          {isDraft && (
            <div className={s.actionRow}>
              <button onClick={() => navigate(`/employee/vouchers/${id}/edit`)} className={s.btnSecondary}>
                Edit Draft
              </button>
              <button
                onClick={handleSubmitVoucher}
                className={s.btnPrimary}
                disabled={actionLoading || !voucher.employeeSignature}
                title={!voucher.employeeSignature ? 'Upload signature before submitting' : 'Submit voucher'}
              >
                {actionLoading ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          )}
        </div>

        <div className={s.card}>
          <div className={s.sectionTitle}>Signatures</div>
          <div className={s.detailGrid}>
            <div className={s.detailItemInlineSig}>
              <div className={s.detailLabel}>Employee Signature</div>
              {employeeSignatureUrl ? (
                <img
                  src={employeeSignatureUrl}
                  alt="Employee Signature"
                  className={`${s.signaturePreview} ${s.clickablePreview}`}
                  onClick={() => setPreviewImage({ imageUrl: employeeSignatureUrl, altText: 'Employee Signature' })}
                  title="Click to view signature"
                />
              ) : (
                <div className={s.detailValue} style={{ color: '#6b7280' }}>Not provided</div>
              )}
              {isDraft && (
                <div className={s.actionRow} style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className={s.btnSecondary}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={actionLoading}
                  >
                    {voucher.employeeSignature ? 'Replace Signature' : 'Upload Signature'}
                  </button>
                  {voucher.employeeSignature && (
                    <button
                      type="button"
                      className={s.btnDanger}
                      onClick={handleDeleteSignature}
                      disabled={actionLoading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className={s.fileInput}
                onChange={handleSignatureChange}
              />
            </div>

            <div className={s.detailItemInlineSig}>
              <div className={s.detailLabel}>Director Signature</div>
              {directorSignatureUrl ? (
                <img
                  src={directorSignatureUrl}
                  alt="Director Signature"
                  className={`${s.signaturePreview} ${s.clickablePreview}`}
                  onClick={() => setPreviewImage({ imageUrl: directorSignatureUrl, altText: 'Director Signature' })}
                  title="Click to view signature"
                />
              ) : (
                <div className={s.detailValue} style={{ color: '#6b7280' }}>Not approved yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ImageModal
        imageUrl={previewImage?.imageUrl}
        altText={previewImage?.altText || 'Signature Preview'}
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default VoucherDetails;

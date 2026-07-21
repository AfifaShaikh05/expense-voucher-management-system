import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import ImageModal from '../../components/ImageModal';
import { getVoucherById, approveVoucher, rejectVoucher } from '../../api/director';
import s from '../employee/employee.module.css';


const STATUS_META = {
  DRAFT:            { cls: s.badgeDraft,     label: 'Draft' },
  SUBMITTED:        { cls: s.badgeSubmitted,  label: 'Submitted' },
  PENDING_APPROVAL: { cls: s.badgePending,    label: 'Pending Approval' },
  APPROVED:         { cls: s.badgeApproved,   label: 'Approved' },
  REJECTED:         { cls: s.badgeRejected,   label: 'Rejected' },
};

const fmt = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const DirectorVoucherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Approval Signature State
  const [sigFile, setSigFile] = useState(null);
  const [sigPreview, setSigPreview] = useState(null);
  const [sigError, setSigError] = useState('');
  const fileInputRef = useRef();

  // Rejection State
  const [rejectionReason, setRejectionReason] = useState('');

  // Modal State: 'APPROVE' | 'REJECT' | null
  const [activeModal, setActiveModal] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchVoucher = async () => {
    try {
      setLoading(true);
      const { data } = await getVoucherById(id);
      setVoucher(data.voucher);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVoucher(); }, [id]);

  const closeModal = () => {
    setActiveModal(null);
    setSigFile(null);
    setSigPreview(null);
    setSigError('');
    setRejectionReason('');
  };

  const handleFileChange = (e) => {
    setSigError('');
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setSigError('Only JPEG and PNG images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSigError('File size must be under 2 MB');
      return;
    }
    setSigFile(file);
    setSigPreview(URL.createObjectURL(file));
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!sigFile) {
      setSigError('You must upload your signature to approve this voucher.');
      return;
    }
    try {
      setActionLoading(true);
      setActionMsg({ type: '', text: '' });
      const formData = new FormData();
      formData.append('signature', sigFile);
      const { data } = await approveVoucher(id, formData);
      setVoucher(data.voucher);
      setActionMsg({ type: 'success', text: 'Voucher approved successfully!' });
      closeModal();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Approval failed' });
      closeModal();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    try {
      setActionLoading(true);
      setActionMsg({ type: '', text: '' });
      const { data } = await rejectVoucher(id, { rejectionReason });
      setVoucher(data.voucher);
      setActionMsg({ type: 'success', text: 'Voucher rejected successfully.' });
      closeModal();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Rejection failed' });
      closeModal();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className={s.page}>
        <TopBar />
        <div className={s.container}><div className={s.loadingState}>Loading voucher…</div></div>
      </div>
    );

  if (error)
    return (
      <div className={s.page}>
        <TopBar />
        <div className={s.container}><div className={s.alertError}>{error}</div></div>
      </div>
    );

  if (!voucher) return null;

  const isPending = voucher.status === 'PENDING_APPROVAL';
  const statusMeta = STATUS_META[voucher.status] || { cls: s.badgeDraft, label: voucher.status };

  return (
    <div className={s.page}>
      <TopBar />
      <div className={s.container}>
        {/* Page header */}
        <div className={s.pageHeader}>
          <div>
            <h1 className={s.pageTitle}>{voucher.voucherNumber}</h1>
            <span className={`${s.badge} ${statusMeta.cls}`} style={{ marginTop: '0.25rem' }}>
              {statusMeta.label}
            </span>
          </div>
          <button onClick={() => navigate('/director/dashboard')} className={s.btnSecondary}>
            ← Dashboard
          </button>
        </div>

        {actionMsg.text && (
          <div className={actionMsg.type === 'success' ? s.alertSuccess : s.alertError}>
            {actionMsg.text}
          </div>
        )}

        {/* Rejection Banner */}
        {voucher.status === 'REJECTED' && voucher.rejectionReason && (
          <div className={s.rejectionBanner}>
            <div className={s.rejectionTitle}>❌ Voucher Rejected</div>
            <div className={s.rejectionText}>{voucher.rejectionReason}</div>
          </div>
        )}

        {/* Voucher Info — with Approve/Reject buttons at top right */}
        <div className={s.card}>
          <div className={s.cardHeaderWithActions}>
            <div className={s.sectionTitle} style={{ margin: 0, border: 'none', padding: 0 }}>
              Voucher Details
            </div>
            {isPending && (
              <div className={s.headerActions}>
                <button
                  onClick={() => setActiveModal('APPROVE')}
                  className={`${s.btnSuccess} ${s.btnSmall}`}
                  disabled={actionLoading}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => setActiveModal('REJECT')}
                  className={`${s.btnDanger} ${s.btnSmall}`}
                  disabled={actionLoading}
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>

          <div className={s.detailGrid}>
            <div className={s.detailItem}><div className={s.detailLabel}>Employee Name</div><div className={s.detailValue}>{voucher.employee?.name}</div></div>
            <div className={s.detailItem}><div className={s.detailLabel}>Employee Email</div><div className={s.detailValue}>{voucher.employee?.email}</div></div>
            <div className={s.detailItem}><div className={s.detailLabel}>Voucher Number</div><div className={s.detailValue}>{voucher.voucherNumber}</div></div>
            <div className={s.detailItem}><div className={s.detailLabel}>Voucher Date</div><div className={s.detailValue}>{fmt(voucher.voucherDate)}</div></div>
            <div className={s.detailItem}><div className={s.detailLabel}>Expense Date</div><div className={s.detailValue}>{fmt(voucher.expenseDate)}</div></div>
            <div className={s.detailItem}><div className={s.detailLabel}>Department</div><div className={s.detailValue}>{voucher.departmentName}</div></div>
            <div className={s.detailItem}><div className={s.detailLabel}>Expense Title</div><div className={s.detailValue}>{voucher.expenseTitle}</div></div>
            <div className={s.detailItem}><div className={s.detailLabel}>Category</div><div className={s.detailValue}>{voucher.expenseCategory}</div></div>
            <div className={s.detailItem}>
              <div className={s.detailLabel}>Amount</div>
              <div className={s.detailValue} style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                ₹{Number(voucher.amount).toLocaleString('en-IN')}
              </div>
            </div>
            {voucher.expenseDescription && (
              <div className={s.detailItem} style={{ gridColumn: '1 / -1' }}>
                <div className={s.detailLabel}>Description</div>
                <div className={s.detailValue}>{voucher.expenseDescription}</div>
              </div>
            )}
          </div>
        </div>

        {/* Signatures & Approval Info */}
        <div className={s.card}>
          <div className={s.sectionTitle}>Signatures & Approval</div>
          <div className={s.detailGrid}>
            <div className={s.detailItemInlineSig}>
              <div className={s.detailLabel}>Employee Signature</div>
              {voucher.employeeSignature ? (
                <img
                  src={voucher.employeeSignature}
                  alt="Employee Signature"
                  className={`${s.signaturePreview} ${s.clickablePreview}`}
                  onClick={() => setPreviewImage({ imageUrl: voucher.employeeSignature, altText: 'Employee Signature' })}
                  title="Click to view signature"
                />
              ) : (
                <div className={s.detailValue} style={{ color: '#6b7280' }}>Not provided</div>
              )}
            </div>

            <div className={s.detailItemInlineSig}>
              <div className={s.detailLabel}>Director Signature</div>
              {voucher.directorSignature ? (
                <img
                  src={voucher.directorSignature}
                  alt="Director Signature"
                  className={`${s.signaturePreview} ${s.clickablePreview}`}
                  onClick={() => setPreviewImage({ imageUrl: voucher.directorSignature, altText: 'Director Signature' })}
                  title="Click to view signature"
                />
              ) : (
                <div className={s.detailValue} style={{ color: '#6b7280' }}>Not approved yet</div>
              )}
            </div>

            {voucher.approvalDate && (
              <div className={s.detailItem}>
                <div className={s.detailLabel}>Approval Date</div>
                <div className={s.detailValue}>{fmt(voucher.approvalDate)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}
      {activeModal && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div
            className={s.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Approve Modal */}
            {activeModal === 'APPROVE' && (
              <form onSubmit={handleApproveSubmit}>
                <div className={s.modalHeader}>✅ Approve Voucher</div>
                <div className={s.modalBody}>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                    Please upload your signature image to approve this voucher.
                  </p>
                  <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                    {sigPreview && (
                      <img
                        src={sigPreview}
                        alt="Preview"
                        className={s.signaturePreview}
                        style={{ margin: '0 auto 1rem auto' }}
                      />
                    )}
                    {sigError && (
                      <div className={s.errorMsg} style={{ marginBottom: '0.5rem' }}>{sigError}</div>
                    )}
                    <button type="button" className={s.btnSecondary} onClick={() => fileInputRef.current.click()}>
                      📁 {sigFile ? 'Replace Signature' : 'Choose Signature Image'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className={s.fileInput}
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <div className={s.modalFooter}>
                  <button type="button" className={s.btnSecondary} onClick={closeModal} disabled={actionLoading}>
                    Cancel
                  </button>
                  <button type="submit" className={s.btnSuccess} disabled={actionLoading || !sigFile}>
                    {actionLoading ? 'Processing…' : 'Approve'}
                  </button>
                </div>
              </form>
            )}

            {/* Reject Modal */}
            {activeModal === 'REJECT' && (
              <form onSubmit={handleRejectSubmit}>
                <div className={s.modalHeader}>❌ Reject Voucher</div>
                <div className={s.modalBody}>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                    Please enter the reason for rejection. This is mandatory.
                  </p>
                  <div className={s.field}>
                    <textarea
                      className={s.textarea}
                      placeholder="Explain why this voucher is being rejected…"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className={s.modalFooter}>
                  <button type="button" className={s.btnSecondary} onClick={closeModal} disabled={actionLoading}>
                    Cancel
                  </button>
                  <button type="submit" className={s.btnDanger} disabled={actionLoading || !rejectionReason.trim()}>
                    {actionLoading ? 'Processing…' : 'Reject'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <ImageModal
        imageUrl={previewImage?.imageUrl}
        altText={previewImage?.altText || 'Signature Preview'}
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default DirectorVoucherDetail;

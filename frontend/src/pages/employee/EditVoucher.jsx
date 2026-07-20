import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { getVoucherById, updateVoucher } from '../../api/vouchers';
import s from './employee.module.css';

const CATEGORIES = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Entertainment', 'Medical', 'Training', 'Other'];

const validate = (form) => {
  const errors = {};
  if (!form.departmentName.trim()) errors.departmentName = 'Department is required';
  if (!form.expenseTitle.trim()) errors.expenseTitle = 'Expense title is required';
  if (!form.expenseCategory) errors.expenseCategory = 'Category is required';
  if (!form.expenseDate) errors.expenseDate = 'Expense date is required';
  if (!form.amount) {
    errors.amount = 'Amount is required';
  } else if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
    errors.amount = 'Amount must be a positive number';
  } else if (Number(form.amount) > 99999) {
    errors.amount = 'Amount cannot exceed ₹99,000';
  }
  return errors;
};

const EditVoucher = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null); // null until loaded
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        const { data } = await getVoucherById(id);
        const v = data.voucher;

        // Guard: redirect to detail view if not DRAFT
        if (v.status !== 'DRAFT') {
          navigate(`/employee/vouchers/${id}`, {
            replace: true,
            state: { message: 'Only DRAFT vouchers can be edited.' }
          });
          return;
        }

        setForm({
          departmentName: v.departmentName || '',
          expenseTitle: v.expenseTitle || '',
          expenseCategory: v.expenseCategory || '',
          expenseDescription: v.expenseDescription || '',
          // Convert ISO string to YYYY-MM-DD for the date input
          expenseDate: v.expenseDate ? v.expenseDate.split('T')[0] : '',
          amount: v.amount?.toString() || '',
        });
      } catch (err) {
        setServerError(err.response?.data?.message || 'Failed to load voucher');
      } finally {
        setLoading(false);
      }
    };
    fetchVoucher();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        expenseDate: new Date(form.expenseDate).toISOString(),
      };
      await updateVoucher(id, payload);
      navigate(`/employee/vouchers/${id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to update voucher');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={s.page}><TopBar /><div className={s.container}><div className={s.loadingState}>Loading…</div></div></div>;
  if (!form) return null;

  return (
    <div className={s.page}>
      <TopBar />
      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1 className={s.pageTitle}>Edit Draft Voucher</h1>
          <button onClick={() => navigate(`/employee/vouchers/${id}`)} className={s.btnSecondary}>← Cancel</button>
        </div>

        <div className={s.card}>
          {serverError && <div className={s.alertError}>{serverError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Department</label>
                <input name="departmentName" value={form.departmentName} onChange={handleChange}
                  className={`${s.input} ${errors.departmentName ? s.inputError : ''}`} disabled={saving} />
                {errors.departmentName && <span className={s.errorMsg}>{errors.departmentName}</span>}
              </div>

              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Expense Title</label>
                <input name="expenseTitle" value={form.expenseTitle} onChange={handleChange}
                  className={`${s.input} ${errors.expenseTitle ? s.inputError : ''}`} disabled={saving} />
                {errors.expenseTitle && <span className={s.errorMsg}>{errors.expenseTitle}</span>}
              </div>

              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Category</label>
                <select name="expenseCategory" value={form.expenseCategory} onChange={handleChange}
                  className={`${s.select} ${errors.expenseCategory ? s.inputError : ''}`} disabled={saving}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.expenseCategory && <span className={s.errorMsg}>{errors.expenseCategory}</span>}
              </div>

              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Expense Date</label>
                <input type="date" name="expenseDate" value={form.expenseDate} onChange={handleChange}
                  className={`${s.input} ${errors.expenseDate ? s.inputError : ''}`} disabled={saving} />
                {errors.expenseDate && <span className={s.errorMsg}>{errors.expenseDate}</span>}
              </div>

              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Amount (₹)</label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} min="0.01" max="99999" step="0.01"
                  className={`${s.input} ${errors.amount ? s.inputError : ''}`} disabled={saving} />
                {errors.amount && <span className={s.errorMsg}>{errors.amount}</span>}
              </div>

              <div className={`${s.field} ${s.fieldFull}`}>
                <label className={s.label}>Description (optional)</label>
                <textarea name="expenseDescription" value={form.expenseDescription} onChange={handleChange}
                  className={s.textarea} disabled={saving} />
              </div>
            </div>

            <div className={s.actionRow}>
              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditVoucher;

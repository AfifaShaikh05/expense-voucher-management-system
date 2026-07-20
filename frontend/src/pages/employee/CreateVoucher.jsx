import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { createVoucher } from '../../api/vouchers';
import s from './employee.module.css';

const CATEGORIES = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Entertainment', 'Medical', 'Training', 'Other'];

const initialForm = {
  departmentName: '',
  expenseTitle: '',
  expenseCategory: '',
  expenseDescription: '',
  expenseDate: '',
  amount: '',
};

const validate = (form) => {
  const errors = {};
  if (!form.departmentName.trim()) errors.departmentName = 'Department is required';
  if (!form.expenseTitle.trim()) errors.expenseTitle = 'Expense title is required';
  if (!form.expenseCategory) errors.expenseCategory = 'Category is required';
  if (!form.expenseDate) errors.expenseDate = 'Expense date is required';
  if (!form.amount) {
    errors.amount = 'Amount is required';
  } else if (Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
    errors.amount = 'Amount must be a positive number';
  } else if (Number(form.amount) > 99000) {
    errors.amount = 'Amount cannot exceed INR 99,000';
  }
  return errors;
};

const CreateVoucher = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
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
      const { data } = await createVoucher(payload);
      navigate(`/employee/vouchers/${data.voucher.id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to create voucher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.page}>
      <TopBar />
      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1 className={s.pageTitle}>Create Voucher</h1>
          <button onClick={() => navigate('/employee/dashboard')} className={s.btnSecondary}>
            Cancel
          </button>
        </div>

        <div className={s.card}>
          {serverError && <div className={s.alertError}>{serverError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Department</label>
                <input
                  name="departmentName"
                  value={form.departmentName}
                  onChange={handleChange}
                  className={`${s.input} ${errors.departmentName ? s.inputError : ''}`}
                  disabled={saving}
                />
                {errors.departmentName && <span className={s.errorMsg}>{errors.departmentName}</span>}
              </div>

              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Expense Title</label>
                <input
                  name="expenseTitle"
                  value={form.expenseTitle}
                  onChange={handleChange}
                  className={`${s.input} ${errors.expenseTitle ? s.inputError : ''}`}
                  disabled={saving}
                />
                {errors.expenseTitle && <span className={s.errorMsg}>{errors.expenseTitle}</span>}
              </div>

              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Category</label>
                <select
                  name="expenseCategory"
                  value={form.expenseCategory}
                  onChange={handleChange}
                  className={`${s.select} ${errors.expenseCategory ? s.inputError : ''}`}
                  disabled={saving}
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.expenseCategory && <span className={s.errorMsg}>{errors.expenseCategory}</span>}
              </div>

              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Expense Date</label>
                <input
                  type="date"
                  name="expenseDate"
                  value={form.expenseDate}
                  onChange={handleChange}
                  className={`${s.input} ${errors.expenseDate ? s.inputError : ''}`}
                  disabled={saving}
                />
                {errors.expenseDate && <span className={s.errorMsg}>{errors.expenseDate}</span>}
              </div>

              <div className={s.field}>
                <label className={`${s.label} ${s.required}`}>Amount (INR)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  min="0.01"
                  max="99000"
                  step="0.01"
                  className={`${s.input} ${errors.amount ? s.inputError : ''}`}
                  disabled={saving}
                />
                {errors.amount && <span className={s.errorMsg}>{errors.amount}</span>}
              </div>

              <div className={`${s.field} ${s.fieldFull}`}>
                <label className={s.label}>Description (optional)</label>
                <textarea
                  name="expenseDescription"
                  value={form.expenseDescription}
                  onChange={handleChange}
                  className={s.textarea}
                  disabled={saving}
                />
              </div>
            </div>

            <div className={s.actionRow}>
              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? 'Creating...' : 'Create Draft'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateVoucher;

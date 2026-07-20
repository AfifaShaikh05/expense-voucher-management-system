import { useParams } from 'react-router-dom';
import TopBar from '../../components/TopBar';
const EmployeeVoucherDetail = () => {
  const { id } = useParams();
  return (
    <>
      <TopBar />
      <div style={{ padding: '2rem' }}><h1>Employee Voucher Detail</h1><p>ID: {id}</p></div>
    </>
  );
};
export default EmployeeVoucherDetail;

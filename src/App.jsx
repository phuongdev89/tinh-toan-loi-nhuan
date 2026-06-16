import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ResultsTable from './components/ResultsTable';
import { calculateFullProject } from './utils/calculations';

function App() {
  const [inputs, setInputs] = useState({
    ngayBatDau: new Date().toISOString().split('T')[0],
    nguonTienGoc: [
      { id: Date.now(), amount: 3000000000, rate: 6 }
    ],
    giaBds: 2500000000,
    tienPhaiTra: 500000000,
    laiSuatNoLai: 12,
    thoiGianNo: 12,
    laiSuatDauTu: 2,
    tienDauTuBanDau: 1000000000,
    blockDauTu: 6,
    hinhThucTraLaiNo: 'thang'
  });

  const [manualWithdrawals, setManualWithdrawals] = useState({});

  const summary = useMemo(() => {
    return calculateFullProject(inputs, manualWithdrawals);
  }, [inputs, manualWithdrawals]);

  // Reset withdrawals if core inputs change (except initial investment)
  const handleInputsChange = (newInputs) => {
    const coreFieldsChanged = ['ngayBatDau', 'nguonTienGoc', 'giaBds', 'tienPhaiTra', 'laiSuatNoLai', 'thoiGianNo', 'hinhThucTraLaiNo', 'blockDauTu'].some(
      field => JSON.stringify(newInputs[field]) !== JSON.stringify(inputs[field])
    );
    
    if (coreFieldsChanged) {
      setManualWithdrawals({});
    }
    setInputs(newInputs);
  };

  const handleUpdateWithdrawal = (thang, value) => {
    setManualWithdrawals(prev => ({
      ...prev,
      [thang]: value
    }));
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        <div className="col-lg-3 col-md-4">
          <Sidebar 
            inputs={inputs} 
            setInputs={handleInputsChange} 
            summary={summary} 
          />
        </div>
        <div className="col-lg-9 col-md-8 p-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <h4 className="mb-0">Bảng Theo Dõi Dòng Tiền & Lợi Nhuận</h4>
            <div className="badge bg-primary p-2">
              <i className="fa-solid fa-calendar-days me-2"></i>
              Thời gian: {inputs.thoiGianNo} tháng
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="mb-0">Giả sử thị trường tăng giá 1% mỗi tháng cho tài sản đang mua</span>
          </div>
          
          <ResultsTable 
            results={summary.results}
            onUpdateWithdrawal={handleUpdateWithdrawal}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

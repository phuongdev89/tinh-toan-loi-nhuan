import React from 'react';
import MoneyInput from './MoneyInput';
import { formatMoneyStr } from '../utils/calculations';
import { PlusCircle, Trash2 } from 'lucide-react';

const Sidebar = ({ inputs, setInputs, summary }) => {
  const handleChange = (name, value) => {
    setInputs(prev => {
      return { ...prev, [name]: value };
    });
  };

  const handleNguonTienChange = (id, field, value) => {
    const newNguonTienGoc = inputs.nguonTienGoc.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    handleChange('nguonTienGoc', newNguonTienGoc);
  };

  const addNguonTien = () => {
    const newNguonTienGoc = [
      ...inputs.nguonTienGoc,
      { id: Date.now(), amount: 0, rate: 0 }
    ];
    handleChange('nguonTienGoc', newNguonTienGoc);
  };

  const removeNguonTien = (id) => {
    if (inputs.nguonTienGoc.length <= 1) return;
    const newNguonTienGoc = inputs.nguonTienGoc.filter(item => item.id !== id);
    handleChange('nguonTienGoc', newNguonTienGoc);
  };

  return (
    <div className="sidebar-wrapper">
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0"><i className="fa-solid fa-sliders me-2"></i>Thông Số Đầu Vào</h6>
        </div>
        <div className="card-body p-2">
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <div className="mb-2">
              <label className="form-label">Ngày bắt đầu thực hiện</label>
              <input 
                type="date" 
                className="form-control" 
                value={inputs.ngayBatDau}
                onChange={(e) => handleChange('ngayBatDau', e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold d-flex justify-content-between align-items-center">
                Số tiền gốc đang có
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-primary py-0 px-2"
                  onClick={addNguonTien}
                >
                  <PlusCircle size={14} className="me-1" /> Thêm nguồn
                </button>
              </label>
              
              {inputs.nguonTienGoc.map((nguon, index) => (
                <div key={nguon.id} className="bg-light p-2 rounded-2 mb-2 border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted fw-bold">Nguồn {index + 1}</small>
                    {inputs.nguonTienGoc.length > 1 && (
                      <button 
                        type="button" 
                        className="btn btn-link btn-sm p-0 text-danger"
                        onClick={() => removeNguonTien(nguon.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="row g-2">
                    <div className="col-7">
                      <MoneyInput 
                        value={nguon.amount}
                        onChange={(val) => handleNguonTienChange(nguon.id, 'amount', val)}
                        className="form-control-sm"
                        mb="mb-0"
                      />
                    </div>
                    <div className="col-5">
                      <div className="input-group input-group-sm">
                        <input 
                          type="number" 
                          className="form-control text-end" 
                          value={nguon.rate}
                          onChange={(e) => handleNguonTienChange(nguon.id, 'rate', e.target.value)}
                          step="0.1"
                          placeholder="Lãi suất"
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <MoneyInput 
              label="Giá trị sản phẩm đang mua"
              value={inputs.giaBds}
              onChange={(val) => handleChange('giaBds', val)}
            />

            <div className="row g-2 mb-2">
              <div className="col-6">
                <MoneyInput 
                  label="Số tiền phải trả ngay"
                  value={inputs.tienPhaiTra}
                  onChange={(val) => handleChange('tienPhaiTra', val)}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Còn nợ người bán</label>
                <input 
                  type="text" 
                  className="form-control readonly-money text-danger" 
                  value={formatMoneyStr(summary.tienNoLai)} 
                  readOnly 
                />
              </div>
            </div>

            <div className="row g-1 mb-2">
              <div className="col-4">
                <label className="form-label">Lãi nợ (%/năm)</label>
                <input 
                  type="number" 
                  className="form-control text-end" 
                  value={inputs.laiSuatNoLai}
                  onChange={(e) => handleChange('laiSuatNoLai', e.target.value)}
                  step="0.1"
                />
              </div>
              <div className="col-3">
                <label className="form-label">Hạn (tháng)</label>
                <input 
                  type="number" 
                  className="form-control text-end" 
                  value={inputs.thoiGianNo}
                  onChange={(e) => handleChange('thoiGianNo', e.target.value)}
                />
              </div>
              <div className="col-5">
                <label className="form-label text-primary">Phương án trả lãi</label>
                <select 
                  className="form-select border-primary fw-bold" 
                  style={{ fontSize: '0.78rem' }}
                  value={inputs.hinhThucTraLaiNo}
                  onChange={(e) => handleChange('hinhThucTraLaiNo', e.target.value)}
                >
                  <option value="thang">Trả từng tháng</option>
                  <option value="cuoi">Tất toán cuối</option>
                </select>
              </div>
            </div>

            <div className="alert alert-warning p-2 mb-2 rounded-3 border-0" style={{ fontSize: '0.8rem' }}>
              <div className="fw-bold text-warning-emphasis mb-1 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                <i className="fa-solid fa-calculator me-1"></i> Định mức lãi dự trù bình quân
              </div>
              <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                <span className="text-muted">Tổng các loại lãi / 1 tháng:</span>
                <span className="fw-bold text-dark">{formatMoneyStr(summary.lai1Thang)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold text-danger">
                <span>TỔNG LÃI DỰ TRÙ / 1 BLOCK:</span>
                <span style={{ fontSize: '0.9rem' }}>{formatMoneyStr(summary.lai1Block)}</span>
              </div>
            </div>

            <div className="border-top my-2"></div>

            <div className="mb-2">
              <label className="form-label d-flex justify-content-between align-items-center">
                <span>Số tiền mang đi đầu tư</span>
                <span className="hint-text text-end">Tối đa: {formatMoneyStr(summary.maxDauTu)}</span>
              </label>
              <MoneyInput 
                value={inputs.tienDauTuBanDau}
                onChange={(val) => handleChange('tienDauTuBanDau', val)}
                className="border-success"
              />
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label">Lãi đầu tư (%/tháng)</label>
                <input 
                  type="number" 
                  className="form-control text-end" 
                  value={inputs.laiSuatDauTu}
                  onChange={(e) => handleChange('laiSuatDauTu', e.target.value)}
                  step="0.1"
                />
              </div>
              <div className="col-6">
                <label className="form-label text-success">Kỳ hạn 1 Block</label>
                <select 
                  className="form-select border-success fw-bold"
                  value={inputs.blockDauTu}
                  onChange={(e) => handleChange('blockDauTu', parseInt(e.target.value) || 0)}
                >
                  <option value={6}>6 Tháng</option>
                  <option value={9}>9 Tháng</option>
                  <option value={12}>12 Tháng</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

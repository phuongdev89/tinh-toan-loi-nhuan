import React from 'react';
import { formatMoneyStr, parseMoney } from '../utils/calculations';
import {ArrowDownCircle, TrendingUp, Landmark} from 'lucide-react';

const ResultsTable = ({ results, onUpdateWithdrawal }) => {
  return (
    <div className="table-responsive shadow-sm rounded-3 overflow-hidden">
      <table className="table table-hover align-middle mb-0 table-results">
        <thead className="table-light">
          <tr>
            <th className="ps-4">Chu Kỳ</th>
            <th className="text-end">Vốn Đầu Tư</th>
            <th className="text-end text-primary">Lãi phải trả trong chu kỳ</th>
            <th className="text-end">Tiền mặt có sẵn đầu chu kỳ</th>
            <th className="text-end fw-bold">Gốc thực tế</th>
            {results[0]?.giaTriTaiSanCuoiChuKy > 0 && (
              <th className="text-end fw-bold">Giá trị tài sản cuối chu kỳ</th>
            )}
            <th className="text-end fw-bold">Tổng vốn ròng</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <React.Fragment key={row.thang}>
              <tr className="moc-row fw-bold border-top border-2 border-primary">
                <td className="ps-4">
                  <span className="text-primary">{row.label}</span>
                </td>
                <td className="text-end">{formatMoneyStr(row.vonDauTuDauChuKy)}</td>
                <td className="text-end text-primary">{formatMoneyStr(row.laiTiepTheo)}</td>
                <td className="text-end">{formatMoneyStr(row.tienMatDangGiutaiKet)}</td>
                <td className={`text-end fw-bold ${row.gocThucTe >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatMoneyStr(row.gocThucTe)}
                </td>
                {row.giaTriTaiSanCuoiChuKy > 0 && (
                  <td className="text-end fw-bold text-info">
                    {formatMoneyStr(row.giaTriTaiSanCuoiChuKy)}
                  </td>
                )}
                <td className={`text-end fw-bold ${row.tongVonThucTeRong >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatMoneyStr(row.tongVonThucTeRong)}
                </td>
              </tr>
              {row.subTable && (
                <tr className="detail-row">
                  <td colSpan={results[0]?.giaTriTaiSanCuoiChuKy > 0 ? "7" : "6"} className="p-0 border-0">
                    <div className="px-5 py-3">
                      <div className="sub-table p-3">
                        <div className="d-flex gap-4 mb-3 border-bottom pb-2">
                          <div className="d-flex align-items-center gap-2">
                            <TrendingUp size={18} className="text-success" />
                            <small className="text-muted">Giá trị đầu tư nhận về cuối chu kỳ:</small>
                            <span className="fw-bold">{formatMoneyStr(row.giaTriDauTuTichLuy)}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <ArrowDownCircle size={18} className="text-primary" />
                            <small className="text-muted">Cần rút về:</small>
                            <div className="input-group input-group-sm justify-content-end">
                              <input
                                  type="text"
                                  className="form-control text-end border-success text-success fw-bold"
                                  style={{ maxWidth: '140px' }}
                                  value={formatMoneyStr(row.rutVe).replace(' đ', '')}
                                  onChange={(e) => onUpdateWithdrawal(row.thang, parseMoney(e.target.value))}
                                  disabled={row.isLastBlock}
                              />
                              <span className="input-group-text bg-success text-white border-success">đ</span>
                            </div>
                          </div>
                          {row.isLastBlock && row.totalInterestNoAccumulated > 0 && (
                            <div className="d-flex align-items-center gap-2">
                              <Landmark size={18} className="text-danger" />
                              <small className="text-muted">Lãi phải trả cho người bán trên số tiền nợ lại:</small>
                              <span className="fw-bold text-danger">{formatMoneyStr(row.totalInterestNoAccumulated)}</span>
                            </div>
                          )}
                        </div>

                        <table className="table table-sm table-borderless mb-0" style={{ fontSize: '0.8rem' }}>
                          <thead>
                            <tr className="text-muted border-bottom">
                              <th>Tháng</th>
                              <th className="text-end">Tiền mặt đầu tháng</th>
                              <th className="text-end text-danger">Lãi trả trong tháng</th>
                              <th className="text-end">Tiền mặt cuối tháng</th>
                              <th className="text-end fw-bold">Gốc thực tế</th>
                              {row.subTable[0]?.giaTriTaiSan > 0 && (
                                <th className="text-end fw-bold">Giá trị tài sản</th>
                              )}
                              <th className="text-end fw-bold">Tổng vốn ròng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.subTable.map((sub, idx) => (
                              <tr key={idx} className="border-bottom-dashed">
                                <td className="fw-bold">Tháng {sub.month}</td>
                                <td className="text-end">{formatMoneyStr(sub.cashStart)}</td>
                                <td className="text-end text-danger">{formatMoneyStr(sub.interest)}</td>
                                <td className="text-end">{formatMoneyStr(sub.cashEnd)}</td>
                                <td className={`text-end fw-bold ${sub.gocThucTe >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {formatMoneyStr(sub.gocThucTe)}
                                </td>
                                {sub.giaTriTaiSan > 0 && (
                                  <td className="text-end fw-bold text-info">
                                    {formatMoneyStr(sub.giaTriTaiSan)}
                                  </td>
                                )}
                                <td className={`text-end fw-bold ${sub.totalNetCapital >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {formatMoneyStr(sub.totalNetCapital)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;

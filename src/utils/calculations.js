export const parseMoney = (valueStr) => {
  if (!valueStr) return 0;
  if (typeof valueStr === 'number') return valueStr;
  const clean = valueStr.toString().replace(/[^0-9-]/g, '');
  return parseInt(clean, 10) || 0;
};

export const formatMoneyStr = (num) => {
  const sign = num < 0 ? '-' : '';
    const absNum = Math.round(Math.abs(num));
  return sign + new Intl.NumberFormat('vi-VN').format(absNum) + ' đ';
};

export const getMonthData = (startDateStr, totalMonths) => {
  const monthList = [];
  const currDate = new Date(startDateStr);
  for (let i = 0; i < totalMonths; i++) {
    const year = currDate.getFullYear();
    const month = currDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDaysInYear = isLeapYear ? 366 : 365;
    monthList.push({
      monthIndex: i + 1,
      days: daysInMonth,
      daysInYear: totalDaysInYear,
      month: month + 1,
      year: year
    });
    currDate.setMonth(currDate.getMonth() + 1);
  }
  return monthList;
};

export const calculatePeriodInterest = (params) => {
  const {
    startMonth,
    duration,
    monthData,
    nguonTienGoc = [],
    tienNoLai,
    laiSuatNoLaiNam,
    hinhThucTraLaiNo,
    coThuLaiNo = true
  } = params;

  let totalInterestGoc = 0;
  let totalInterestNo = 0;

  for (let i = 0; i < duration; i++) {
    const index = startMonth + i;
    if (index >= monthData.length) break;
    const data = monthData[index];

    // Tính lãi cho từng nguồn tiền gốc
    nguonTienGoc.forEach(nguon => {
      const amount = parseFloat(nguon.amount) || 0;
      const rate = (parseFloat(nguon.rate) || 0) / 100;
      totalInterestGoc += (amount * rate / data.daysInYear) * data.days;
    });
    
    // Lãi nợ người bán tính chẵn theo tháng (1/12 năm)
    if (coThuLaiNo) {
      totalInterestNo += (tienNoLai * laiSuatNoLaiNam / 12);
    }
  }

  // tongPhaiTra phụ thuộc vào hình thức trả
  const tongPhaiTra = Math.round(totalInterestGoc + (hinhThucTraLaiNo === 'thang' && coThuLaiNo ? totalInterestNo : 0));

  return {
    goc: Math.round(totalInterestGoc),
    noChu: Math.round(totalInterestNo),
    tong: tongPhaiTra
  };
};

export const calculateFullProject = (inputs, manualWithdrawals = {}) => {
  const {
    ngayBatDau,
    nguonTienGoc,
    giaBds,
    tienPhaiTra,
    laiSuatNoLai,
    thoiGianNo,
    laiSuatDauTu,
    tienDauTuBanDau,
    blockDauTu,
    soChuKyDauTu,
    coThuLaiNo,
    coSanPhamDauTu,
    hinhThucTraLaiNo
  } = inputs;

  const soChuKy = parseInt(soChuKyDauTu) || 1;
  const block = parseInt(blockDauTu) || 6;
  const totalMonthsProject = soChuKy * block;

  const tongTienGoc = nguonTienGoc.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const laiSuatNoLaiNam = (parseFloat(laiSuatNoLai) || 0) / 100;
  const laiSuatDauTuThang = (parseFloat(laiSuatDauTu) || 0) / 100;
  const tienNoLai = coSanPhamDauTu ? Math.max(0, giaBds - tienPhaiTra) : 0;
  const giaBdsThucTe = coSanPhamDauTu ? giaBds : 0;

  const monthData = getMonthData(ngayBatDau, totalMonthsProject);
  
  const commonParams = {
    monthData,
    nguonTienGoc,
    tienNoLai,
    laiSuatNoLaiNam,
    hinhThucTraLaiNo,
    coThuLaiNo,
    totalMonths: totalMonthsProject
  };

  const lai1Thang = calculatePeriodInterest({ ...commonParams, startMonth: 0, duration: 1 });
  const lai1Block = calculatePeriodInterest({ ...commonParams, startMonth: 0, duration: block });

  const tienPhaiTraThucTe = coSanPhamDauTu ? tienPhaiTra : 0;
  const quyTienMatThuaBanDau = tongTienGoc - tienPhaiTraThucTe - tienDauTuBanDau;
  
  const results = [];
  const withdrawals = { ...manualWithdrawals };

  let currentCash = quyTienMatThuaBanDau;
  let currentInvested = tienDauTuBanDau;

  for (let thang = block; thang <= totalMonthsProject; thang += block) {
    const isLastBlock = (thang === totalMonthsProject || (thang + block) > totalMonthsProject);
    const startMonthIndex = thang - block;
    const actualDuration = isLastBlock ? (totalMonthsProject - startMonthIndex) : block;

    const currentCashStart = currentCash;
    const laiBlockNay = calculatePeriodInterest({ ...commonParams, startMonth: startMonthIndex, duration: actualDuration });

    // Tăng trưởng giá trị tài sản 1% mỗi tháng (tuyến tính theo yêu cầu: 1 + 0.01 * thang)
    const giaTriTaiSanCuoiChuKy = coSanPhamDauTu ? giaBdsThucTe * (1 + 0.01 * thang) : 0;

    const nextBlockDuration = Math.min(block, totalMonthsProject - thang);
    const laiBlockTiepTheo = isLastBlock ? { tong: 0 } : calculatePeriodInterest({ ...commonParams, startMonth: thang, duration: nextBlockDuration });

    const vonDauTuDauChuKy = currentInvested;
    const giaTriDauTuTichLuy = vonDauTuDauChuKy > 0 ? vonDauTuDauChuKy * (1 + (laiSuatDauTuThang * actualDuration)) : 0;

    let cashAtEndBeforeWithdraw = currentCash - laiBlockNay.tong;

    const minWithdraw = isLastBlock ? Math.round(giaTriDauTuTichLuy) : Math.max(0, laiBlockTiepTheo.tong - cashAtEndBeforeWithdraw);
    let userWithdraw = withdrawals[thang];
    
    if (userWithdraw === undefined || isLastBlock) {
      userWithdraw = Math.round(minWithdraw);
    }
    if (userWithdraw < minWithdraw && !isLastBlock) {
      userWithdraw = Math.round(minWithdraw);
    }
    if (userWithdraw > giaTriDauTuTichLuy) {
      userWithdraw = Math.round(giaTriDauTuTichLuy);
    }
    withdrawals[thang] = userWithdraw;

    if (isLastBlock) {
      let totalInterestNoAccumulated = 0;
      if (hinhThucTraLaiNo === 'cuoi' && coThuLaiNo) {
        totalInterestNoAccumulated = (tienNoLai * laiSuatNoLaiNam / 12) * totalMonthsProject;
      }
      cashAtEndBeforeWithdraw -= (tienNoLai + Math.round(totalInterestNoAccumulated));
    }

    const finalCashInPocket = isLastBlock ? (cashAtEndBeforeWithdraw + userWithdraw) : cashAtEndBeforeWithdraw;
    const noGocChuNhaHienTai = (isLastBlock || !coSanPhamDauTu) ? 0 : tienNoLai;
    const gocThucTe = finalCashInPocket - tongTienGoc - noGocChuNhaHienTai;
    const totalNetCapital = gocThucTe + giaTriTaiSanCuoiChuKy;

    // Sub table logic
    const subTable = [];
    let runningCash = currentCash;
    for (let t = 1; t <= actualDuration; t++) {
      const globalMonthIdx = startMonthIndex + t - 1;
      const data = monthData[globalMonthIdx];
      
      const currentMonthGlobal = startMonthIndex + t;
      const giaTriTaiSanThang = coSanPhamDauTu ? giaBdsThucTe * (1 + 0.01 * currentMonthGlobal) : 0;
      
      let laiGocThang = 0;
      nguonTienGoc.forEach(nguon => {
        const amount = parseFloat(nguon.amount) || 0;
        const rate = (parseFloat(nguon.rate) || 0) / 100;
        laiGocThang += (amount * rate / data.daysInYear) * data.days;
      });

      let laiNoThangThucTe = 0;
      if (hinhThucTraLaiNo === 'thang' && coThuLaiNo) {
        laiNoThangThucTe = (tienNoLai * laiSuatNoLaiNam / 12);
      }
      
      const interestPaidThisMonth = Math.round(laiGocThang + laiNoThangThucTe);
      
      const cashStart = runningCash;
      runningCash -= interestPaidThisMonth;
      let cashEnd = runningCash;

      let noGocChuNhaSub = tienNoLai;
      if ((isLastBlock && t === actualDuration) || !coSanPhamDauTu) {
        // Cuối dự án hoặc không có sản phẩm: không còn nợ gốc
        let totalInterestNoAccumulated = 0;
        if (isLastBlock && hinhThucTraLaiNo === 'cuoi' && coThuLaiNo) {
          totalInterestNoAccumulated = (tienNoLai * laiSuatNoLaiNam / 12) * totalMonthsProject;
        }
        if (isLastBlock) {
            cashEnd -= (tienNoLai + Math.round(totalInterestNoAccumulated));
        }
        noGocChuNhaSub = 0;
      }

      if (t === actualDuration) {
        cashEnd += userWithdraw;
      }

      const gocThucTeSub = cashEnd - tongTienGoc - noGocChuNhaSub;
      const totalNetCapitalSub = gocThucTeSub + giaTriTaiSanThang;

      subTable.push({
        month: startMonthIndex + t,
        cashStart,
        interest: interestPaidThisMonth,
        cashEnd,
        gocThucTe: gocThucTeSub,
        giaTriTaiSan: giaTriTaiSanThang,
        totalNetCapital: totalNetCapitalSub
      });
      runningCash = cashEnd;
    }

    results.push({
      label: `Mốc ${thang}`,
      thang,
      vonDauTuDauChuKy,
      giaTriDauTuTichLuy,
      laiTiepTheo: isLastBlock ? 0 : laiBlockTiepTheo.tong,
      tienMatDangGiutaiKet: currentCashStart,
      rutVe: userWithdraw,
      gocThucTe: gocThucTe,
      giaTriTaiSanCuoiChuKy: giaTriTaiSanCuoiChuKy,
      tongVonThucTeRong: totalNetCapital,
      subTable,
      isLastBlock,
      totalInterestNoAccumulated: isLastBlock && hinhThucTraLaiNo === 'cuoi' && coThuLaiNo ? Math.round(
        (tienNoLai * laiSuatNoLaiNam / 12) * totalMonthsProject
      ) : 0
    });

    currentCash = cashAtEndBeforeWithdraw + userWithdraw;
    currentInvested = giaTriDauTuTichLuy - userWithdraw;
  }

  return {
    results,
    withdrawals,
    tienNoLai,
    lai1Thang: lai1Thang.tong,
    lai1Block: lai1Block.tong,
    maxDauTu: Math.round(Math.max(0, tongTienGoc - (coSanPhamDauTu ? tienPhaiTra : 0) - lai1Block.tong))
  };
};

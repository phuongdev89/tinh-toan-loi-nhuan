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
    hinhThucTraLaiNo
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
    
    // Luôn tính lãi nợ chủ nhà theo tháng để có số liệu, 
    // nhưng việc có cộng vào tổng chi trả định kỳ hay không phụ thuộc vào hinhThucTraLaiNo
    totalInterestNo += (tienNoLai * laiSuatNoLaiNam / data.daysInYear) * data.days;
  }

  // tongPhaiTra phụ thuộc vào hình thức trả
  const tongPhaiTra = Math.round(totalInterestGoc + (hinhThucTraLaiNo === 'thang' ? totalInterestNo : 0));

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
    hinhThucTraLaiNo
  } = inputs;

  const tongTienGoc = nguonTienGoc.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const laiSuatNoLaiNam = (parseFloat(laiSuatNoLai) || 0) / 100;
  const laiSuatDauTuThang = (parseFloat(laiSuatDauTu) || 0) / 100;
  const tienNoLai = Math.max(0, giaBds - tienPhaiTra);

  const monthData = getMonthData(ngayBatDau, thoiGianNo);
  
  const commonParams = {
    monthData,
    nguonTienGoc,
    tienNoLai,
    laiSuatNoLaiNam,
    hinhThucTraLaiNo,
    totalMonths: thoiGianNo
  };

  const lai1Thang = calculatePeriodInterest({ ...commonParams, startMonth: 0, duration: 1 });
  const lai1Block = calculatePeriodInterest({ ...commonParams, startMonth: 0, duration: parseInt(blockDauTu) });

  const quyTienMatThuaBanDau = tongTienGoc - tienPhaiTra - tienDauTuBanDau;
  
  const results = [];
  const withdrawals = { ...manualWithdrawals };

  let currentCash = quyTienMatThuaBanDau;
  let currentInvested = tienDauTuBanDau;

  for (let thang = parseInt(blockDauTu); thang <= thoiGianNo; thang += parseInt(blockDauTu)) {
    const isLastBlock = (thang === thoiGianNo || (thang + parseInt(blockDauTu)) > thoiGianNo);
    const startMonthIndex = thang - parseInt(blockDauTu);
    const actualDuration = isLastBlock ? (thoiGianNo - startMonthIndex) : parseInt(blockDauTu);

    const currentCashStart = currentCash;
    const laiBlockNay = calculatePeriodInterest({ ...commonParams, startMonth: startMonthIndex, duration: actualDuration });

    // Tăng trưởng giá trị tài sản 1% mỗi tháng (tuyến tính theo yêu cầu: 1 + 0.01 * thang)
    const giaTriTaiSanCuoiChuKy = giaBds * (1 + 0.01 * thang);

    const nextBlockDuration = Math.min(parseInt(blockDauTu), thoiGianNo - thang);
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
      if (hinhThucTraLaiNo === 'cuoi') {
        for (let k = 0; k < monthData.length; k++) {
          totalInterestNoAccumulated += (tienNoLai * laiSuatNoLaiNam / monthData[k].daysInYear) * monthData[k].days;
        }
      }
      cashAtEndBeforeWithdraw -= (tienNoLai + Math.round(totalInterestNoAccumulated));
    }

    const finalCashInPocket = isLastBlock ? (cashAtEndBeforeWithdraw + userWithdraw) : cashAtEndBeforeWithdraw;
    const gocThucTe = finalCashInPocket - tongTienGoc - (isLastBlock ? 0 : tienNoLai);
    const totalNetCapital = gocThucTe + giaTriTaiSanCuoiChuKy;

    // Sub table logic
    const subTable = [];
    let runningCash = currentCash;
    for (let t = 1; t <= actualDuration; t++) {
      const globalMonthIdx = startMonthIndex + t - 1;
      const data = monthData[globalMonthIdx];
      
      const currentMonthGlobal = startMonthIndex + t;
      const giaTriTaiSanThang = giaBds * (1 + 0.01 * currentMonthGlobal);
      
      let laiGocThang = 0;
      nguonTienGoc.forEach(nguon => {
        const amount = parseFloat(nguon.amount) || 0;
        const rate = (parseFloat(nguon.rate) || 0) / 100;
        laiGocThang += (amount * rate / data.daysInYear) * data.days;
      });

      let laiNoThangThucTe = 0;
      if (hinhThucTraLaiNo === 'thang') {
        laiNoThangThucTe = (tienNoLai * laiSuatNoLaiNam / data.daysInYear) * data.days;
      }
      
      const interestPaidThisMonth = Math.round(laiGocThang + laiNoThangThucTe);
      
      const cashStart = runningCash;
      runningCash -= interestPaidThisMonth;
      let cashEnd = runningCash;

      let noGocChuNhaSub = tienNoLai;
      if (isLastBlock && t === actualDuration) {
        // Cuối dự án: trả gốc + toàn bộ lãi nợ tích lũy nếu chọn tất toán cuối
        let totalInterestNoAccumulated = 0;
        if (hinhThucTraLaiNo === 'cuoi') {
          for (let k = 0; k < monthData.length; k++) {
            totalInterestNoAccumulated += (tienNoLai * laiSuatNoLaiNam / monthData[k].daysInYear) * monthData[k].days;
          }
        }
        cashEnd -= (tienNoLai + Math.round(totalInterestNoAccumulated));
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
      totalInterestNoAccumulated: isLastBlock && hinhThucTraLaiNo === 'cuoi' ? Math.round(
        monthData.reduce((acc, data) => acc + (tienNoLai * laiSuatNoLaiNam / data.daysInYear) * data.days, 0)
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
    maxDauTu: Math.round(Math.max(0, tongTienGoc - tienPhaiTra - lai1Block.tong))
  };
};

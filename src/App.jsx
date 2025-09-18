import React, { useEffect, useState, useRef } from "react";

// Crossword mini-game với theme Pastel Bakery
const DATA = [
  { id: 1, question: "Kỹ thuật biến dữ liệu thành dạng không đọc được nếu không có khóa giải mã?", answer: "ENCRYPTION", hl: 3 },
  { id: 2, question: "Tập hợp quy tắc/hướng dẫn bảo mật trong tổ chức gọi là gì?", answer: "POLICY", hl: 6 },
  { id: 3, question: "Phần mềm/ứng dụng dùng để truy cập Internet (Chrome, Firefox…)?", answer: "BROWSER", hl: 1 },
  { id: 4, question: "Trong bộ ba CIA, nguyên tắc đảm bảo dữ liệu không bị sửa đổi trái phép?", answer: "INTEGRITY", hl: 4 },
  { id: 5, question: "Loại mã độc mã hóa dữ liệu và đòi tiền chuộc?", answer: "RANSOMWARE", hl: 1 },
  { id: 6, question: "Hình thức tấn công lừa đảo qua email hoặc web để lấy thông tin cá nhân?", answer: "PHISHING", hl: 4 },
  { id: 7, question: "Một loại phần mềm độc hại, ví dụ virus, worm, trojan… gọi chung là gì?", answer: "MALWARE", hl: 7 },
  { id: 8, question: "Ngành khoa học nghiên cứu mã hóa và giải mã thông tin?", answer: "CRYPTOGRAPHY", hl: 1 },
  { id: 9, question: "Phương pháp sao lưu dữ liệu để khôi phục khi gặp sự cố gọi là gì?", answer: "BACKUP", hl: 5 },
  { id: 10, question: "Thiết bị/phần mềm bảo vệ mạng nội bộ, lọc lưu lượng ra vào gọi là gì?", answer: "FIREWALL", hl: 3 },
  { id: 11, question: "Phần mềm gây hại, ví dụ virus, worm… gọi là gì?", answer: "VIRUS", hl: 2 },
  { id: 12, question: "Quá trình xác thực người dùng (ví dụ: mật khẩu + OTP) gọi là gì?", answer: "AUTHENTICATION", hl: 3 },
  { id: 13, question: "Một phần mềm độc hại theo dõi và thu thập dữ liệu cá nhân?", answer: "SPYWARE", hl: 3 }
];

function computeGeometry(data) {
  const maxCols = Math.max(...data.map((d) => d.answer.length));
  let centerCol = Math.floor(maxCols / 2);
  let minStart = Math.min(...data.map((d) => centerCol - (d.hl - 1)));
  if (minStart < 0) {
    centerCol += -minStart;
  }
  const totalCols = Math.max(...data.map((d) => centerCol - (d.hl - 1) + d.answer.length));
  return { centerCol, totalCols };
}

function useResponsiveLayout() {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    const debouncedResize = debounce(handleResize, 100);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  const isMobile = dimensions.width < 640;
  const isTablet = dimensions.width >= 640 && dimensions.width < 1024;
  const isDesktop = dimensions.width >= 1024;
  const isSmallScreen = dimensions.width < 480;
  const isLandscape = dimensions.width > dimensions.height;

  return { 
    ...dimensions, 
    isMobile, 
    isTablet, 
    isDesktop, 
    isSmallScreen,
    isLandscape,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function calculateOptimalCellSize(width, height, totalCols) {
  const availableWidth = width - 120;
  const maxCellWidth = Math.floor(availableWidth / (totalCols + 2));
  
  let baseSize;
  if (width < 360) baseSize = 18;
  else if (width < 480) baseSize = 20;
  else if (width < 640) baseSize = 24;
  else if (width < 768) baseSize = 28;
  else if (width < 1024) baseSize = 32;
  else baseSize = 38;

  return Math.min(baseSize, maxCellWidth, 45);
}

export default function App() {
  const { width, height, isMobile, isTablet, isSmallScreen, isLandscape } = useResponsiveLayout();
  const { centerCol, totalCols } = computeGeometry(DATA);
  const cellSize = calculateOptimalCellSize(width, height, totalCols);

  const [stateMap, setStateMap] = useState(() => {
    const s = {};
    DATA.forEach((d) => {
      s[d.id] = { solved: false, locked: false, filled: Array(d.answer.length).fill(null) };
    });
    return s;
  });
  const [currentRowId, setCurrentRowId] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [runningTimerFor, setRunningTimerFor] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const selectRow = (id) => {
    const st = stateMap[id];
    if (st.solved || st.locked) return;
    setCurrentRowId(id);
    setMessage('');
    setInputVal('');
    startTimer(45, id);
  };

  const startTimer = (secs, id) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRemaining(secs);
    setRunningTimerFor(id);
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setRunningTimerFor(null);
          setStateMap((prev) => ({ ...prev, [id]: { ...prev[id], locked: true } }));
          if (currentRowId === id) {
            setMessage('Hết giờ! Hàng đã bị khóa.');
            setCurrentRowId(null);
            setInputVal('');
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRunningTimerFor(null);
    setRemaining(0);
  };

  const handleCheck = () => {
    if (!currentRowId) return;
    const row = DATA.find((d) => d.id === currentRowId);
    const val = inputVal.trim().toUpperCase();
    if (!val) {
      setMessage('Nhập đáp án trước khi kiểm tra.');
      return;
    }
    if (val === row.answer.toUpperCase()) {
      setStateMap((prev) => ({
        ...prev,
        [row.id]: { ...prev[row.id], solved: true, filled: row.answer.split('') }
      }));
      setMessage('Tuyệt vời ông mặt trời 🌞');
      stopTimer();
      setCurrentRowId(null);
      setInputVal('');
    } else {
      setMessage('Ối dồi ôi sai rồi 😵');
      setInputVal('');
    }
  };

  const allSolved = DATA.every((d) => stateMap[d.id].solved);

  const getResponsiveStyles = () => {
    const gap = isSmallScreen ? 3 : isMobile ? 4 : isTablet ? 6 : 8;
    const padding = isSmallScreen ? 8 : isMobile ? 12 : isTablet ? 16 : 20;
    const borderRadius = isSmallScreen ? 12 : 16;

    return {
      app: {
        fontFamily: '"Be Vietnam Pro", "Roboto", "Helvetica Neue", Arial, sans-serif',
        padding: `${padding}px`,
        background: 'linear-gradient(135deg, #f0f8f7 0%, #e6f3f1 20%, #faf5f0 40%, #f4e8d6 60%, #e8f4f8 80%, #fef7ed 100%)',
        minHeight: '100vh',
        fontSize: isSmallScreen ? 13 : isMobile ? 15 : 16,
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative'
      },
      header: {
        fontSize: isSmallScreen ? 18 : isMobile ? 22 : isTablet ? 28 : 32,
        marginBottom: padding * 1.2,
        textAlign: 'center',
        fontWeight: 600,
        color: '#4a7c7e',
        wordBreak: 'break-word',
        textShadow: '2px 2px 4px rgba(74, 124, 126, 0.15)',
        letterSpacing: '1px'
      },
      subtitle: {
        fontSize: isSmallScreen ? 11 : isMobile ? 13 : 15,
        color: '#5a9ca0',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: -padding,
        marginBottom: padding,
        textShadow: '1px 1px 2px rgba(90, 156, 160, 0.1)'
      },
      container: {
        display: 'flex',
        gap: `${gap * 3}px`,
        alignItems: (isMobile && !isLandscape) ? 'stretch' : 'flex-start',
        flexDirection: (isMobile && !isLandscape) ? 'column' : 'row',
        maxWidth: '100%',
        height: (isMobile && !isLandscape) ? 'auto' : `calc(100vh - ${padding * 2 + 80}px)`,
        overflow: 'visible'
      },
      board: {
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 247, 0.9) 50%, rgba(255, 255, 255, 0.95) 100%)',
        padding: `${padding * 1.2}px`,
        borderRadius: borderRadius * 1.5,
        boxShadow: '0 8px 32px rgba(74, 124, 126, 0.12), 0 4px 16px rgba(90, 156, 160, 0.08)',
        flex: 1,
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid rgba(152, 216, 202, 0.3)',
        backdropFilter: 'blur(10px)'
      },
      boardContent: {
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        flex: 1,
        minHeight: 0,
        paddingBottom: gap * 1.5
      },
      labels: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: `${gap}px`, 
        marginRight: `${gap * 1.5}px`, 
        flexShrink: 0,
        alignItems: 'center'
      },
      rowBtn: (bg) => ({
        width: cellSize,
        height: cellSize,
        borderRadius: cellSize * 0.25,
        border: '2px solid rgba(152, 216, 202, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 600,
        background: bg,
        fontSize: Math.max(10, Math.min(14, cellSize / 3)),
        flexShrink: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(74, 124, 126, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        userSelect: 'none',
        color: '#4a7c7e',
        fontFamily: 'Georgia, serif',
        position: 'relative'
      }),
      cellsCol: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: `${gap}px`,
        flexShrink: 0
      },
      cellRow: { 
        display: 'flex', 
        gap: `${gap}px`, 
        flexShrink: 0 
      },
      cell: (extra = {}) => ({
        width: cellSize,
        height: cellSize,
        borderRadius: cellSize * 0.2,
        border: '2px solid rgba(152, 216, 202, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: Math.max(8, Math.min(14, cellSize / 3)),
        boxSizing: 'border-box',
        position: 'relative',
        flexShrink: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: 'Georgia, serif',
        boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.8), 0 2px 8px rgba(74, 124, 126, 0.15)',
        ...extra
      }),
      panel: {
        width: isMobile && !isLandscape ? '100%' : Math.min(380, width * 0.4),
        maxWidth: '100%',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 248, 247, 0.95) 50%, rgba(255, 255, 255, 0.98) 100%)',
        padding: `${padding * 1.2}px`,
        borderRadius: borderRadius * 1.5,
        boxShadow: '0 8px 32px rgba(74, 124, 126, 0.15), 0 4px 16px rgba(90, 156, 160, 0.1)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isMobile && !isLandscape ? 'auto' : `calc(100vh - ${padding * 4 + 80}px)`,
        overflow: 'auto',
        border: '2px solid rgba(152, 216, 202, 0.3)',
        backdropFilter: 'blur(10px)'
      },
      questionContainer: {
        marginBottom: `${padding}px`,
        color: '#4a7c7e',
        fontSize: isSmallScreen ? 13 : 15,
        fontWeight: 600,
        letterSpacing: '0.5px'
      },
      questionText: {
        minHeight: isSmallScreen ? 52 : isMobile ? 60 : 68,
        marginBottom: `${padding}px`,
        fontSize: isSmallScreen ? 14 : isMobile ? 15 : 16,
        lineHeight: 1.5,
        wordWrap: 'break-word',
        hyphens: 'auto',
        color: '#2f5f61',
        fontStyle: 'italic',
        padding: `${gap * 2}px`,
        background: 'linear-gradient(135deg, rgba(176, 224, 230, 0.3), rgba(240, 248, 247, 0.5))',
        borderRadius: borderRadius,
        border: '1px solid rgba(152, 216, 202, 0.4)',
        boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.8)'
      },
      timer: {
        fontWeight: 700,
        marginBottom: `${padding}px`,
        color: '#dc143c',
        fontSize: isSmallScreen ? 16 : isMobile ? 18 : 20,
        textAlign: 'center',
        padding: `${gap * 2}px`,
        background: 'linear-gradient(135deg, #ffe4e1 0%, #ffd1dc 100%)',
        borderRadius: borderRadius,
        border: '2px solid rgba(220, 20, 60, 0.2)',
        boxShadow: '0 4px 12px rgba(220, 20, 60, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        fontFamily: 'Georgia, serif'
      },
      inputGroup: {
        display: 'flex',
        gap: `${gap * 1.5}px`,
        flexDirection: isSmallScreen ? 'column' : 'row',
        alignItems: 'stretch',
        marginBottom: `${padding}px`
      },
      input: {
        flex: 1,
        padding: `${padding}px ${padding + 4}px`,
        fontSize: 16,
        textTransform: 'uppercase',
        border: '2px solid rgba(152, 216, 202, 0.5)',
        borderRadius: borderRadius,
        minWidth: 0,
        outline: 'none',
        transition: 'all 0.3s ease',
        fontFamily: 'Georgia, serif',
        fontWeight: 500,
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: 'inset 0 2px 4px rgba(152, 216, 202, 0.1), 0 2px 8px rgba(74, 124, 126, 0.05)',
        color: '#4a7c7e'
      },
      checkBtn: {
        padding: `${padding}px ${padding * 1.5}px`,
        background: 'linear-gradient(135deg, #5a9ca0 0%, #4a7c7e 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: borderRadius,
        fontWeight: 600,
        fontSize: isSmallScreen ? 14 : 16,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minWidth: isSmallScreen ? 'auto' : '100px',
        boxShadow: '0 4px 12px rgba(90, 156, 160, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        fontFamily: 'Georgia, serif',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
      },
      message: {
        minHeight: isSmallScreen ? 24 : 28,
        fontSize: isSmallScreen ? 13 : 15,
        color: '#4a7c7e',
        textAlign: 'center',
        marginBottom: `${gap * 1.5}px`,
        wordWrap: 'break-word',
        fontStyle: 'italic',
        fontWeight: 500
      },
      stats: {
        color: '#5a9ca0',
        fontSize: isSmallScreen ? 12 : 14,
        textAlign: 'center',
        padding: `${gap * 2}px`,
        background: 'linear-gradient(135deg, rgba(176, 224, 230, 0.4), rgba(240, 248, 247, 0.6))',
        borderRadius: borderRadius,
        margin: `${gap}px 0`,
        border: '1px solid rgba(152, 216, 202, 0.4)',
        boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.8)',
        fontWeight: 500
      },
      success: {
        marginTop: `${padding}px`,
        padding: `${padding * 1.2}px`,
        background: 'linear-gradient(135deg, #f0fff0 0%, #e6ffe6 100%)',
        borderRadius: borderRadius,
        fontWeight: 600,
        fontSize: isSmallScreen ? 14 : 16,
        textAlign: 'center',
        color: '#228b22',
        border: '2px solid rgba(34, 139, 34, 0.3)',
        wordWrap: 'break-word',
        boxShadow: '0 6px 20px rgba(34, 139, 34, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        textShadow: '1px 1px 2px rgba(34, 139, 34, 0.1)'
      },
      instruction: {
        marginTop: `${gap * 1.5}px`,
        color: '#5a9ca0',
        fontSize: isSmallScreen ? 11 : 13,
        textAlign: 'center',
        lineHeight: 1.4,
        wordWrap: 'break-word',
        fontStyle: 'italic',
        opacity: 0.9
      }
    };
  };

  const styles = getResponsiveStyles();

  const renderLabels = () => {
    return DATA.map((d) => {
      const st = stateMap[d.id];
      let bg = 'linear-gradient(135deg, #fff 0%, #f0f8f7 100%)';
      if (st.solved) bg = 'linear-gradient(135deg, #e6ffe6 0%, #b8e6d2 100%)';
      else if (st.locked) bg = 'linear-gradient(135deg, #ffe4e1 0%, #ffd1dc 100%)';
      
      return (
        <button
          key={d.id}
          style={{
            ...styles.rowBtn(bg),
            transform: st.solved || st.locked ? 'scale(0.95)' : 'scale(1)',
            opacity: st.locked ? 0.6 : 1
          }}
          onClick={() => selectRow(d.id)}
          disabled={st.solved || st.locked}
          title={`Chọn hàng ${d.id}`}
        >
          {d.id}
        </button>
      );
    });
  };

  const renderCells = () => {
    return DATA.map((d) => {
      const startCol = centerCol - (d.hl - 1);
      const rowCells = [];
      for (let c = 0; c < totalCols; c++) {
        if (c < startCol || c >= startCol + d.answer.length) {
          rowCells.push(
            <div key={`r${d.id}-c${c}`} style={styles.cell({ border: 'none', background: 'transparent', boxShadow: 'none' })}></div>
          );
        } else {
          const idx = c - startCol;
          const isCenter = c === centerCol;
          const st = stateMap[d.id];
          const letter = st.solved ? d.answer[idx] : '';
          let bg = 'linear-gradient(135deg, #fff 0%, #f0f8f7 100%)';
          let color = '#4a7c7e';

          if (st.solved) {
            if (isCenter) {
              bg = 'linear-gradient(135deg, #b8e6d2 0%, #98d8ca 100%)';
              color = '#2f5f61';
            } else {
              bg = 'linear-gradient(135deg, #e6ffe6 0%, #ccf2dc 100%)';
              color = '#228b22';
            }
          } else if (st.locked) {
            if (isCenter) {
              bg = 'linear-gradient(135deg, #ffe4e1 0%, #ffd1dc 100%)';
              color = '#dc143c';
            } else {
              bg = 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)';
              color = '#5a9ca0';
            }
          } else if (isCenter) {
            bg = 'linear-gradient(135deg, #b8e6d2 0%, #98d8ca 100%)';
            color = '#2f5f61';
          }

          const extraStyle = d.id === currentRowId ? { 
            border: '3px solid #5a9ca0', 
            boxShadow: '0 0 15px rgba(90, 156, 160, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
            transform: 'scale(1.05)'
          } : {};

          rowCells.push(
            <div 
              key={`r${d.id}-c${c}`} 
              style={{...styles.cell({ background: bg, color, ...extraStyle })}}
            >
              {letter}
            </div>
          );
        }
      }
      return (
        <div key={`row-${d.id}`} style={styles.cellRow}>
          {rowCells}
        </div>
      );
    });
  };

  return (
    <div style={styles.app}>
      <h1 style={styles.header}>
        🧁 CROSSWORD MINIGAME 🧁
      </h1>
      <div style={styles.subtitle}>
        Delicious puzzles baked fresh for your mind ✨
      </div>
      
      <div style={styles.container}>
        <div style={styles.board}>
          <div style={styles.boardContent}>
            <div style={styles.labels}>{renderLabels()}</div>
            <div style={styles.cellsCol}>{renderCells()}</div>
          </div>
          <div style={styles.instruction}>
            {isSmallScreen ? 
              'Tap số → trả lời trong 45s 🍪' : 
              'Click số hàng để chọn câu hỏi →  45s để trả lời 🍰'
            }
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.questionContainer}>
            {currentRowId ? `🍯 Câu hỏi ${currentRowId}:` : '🎂 Chọn một hàng để bắt đầu:'}
          </div>
          
          <div style={styles.questionText}>
            {currentRowId ? DATA.find((d) => d.id === currentRowId).question : 'Chào mừng đến với clb F-CSC! Hãy chọn một số để bắt đầu thử thách nhé! 🍮'}
          </div>
          
          <div style={styles.timer}>
            ⏰ {runningTimerFor === currentRowId ? `${remaining}s` : '00s'}
          </div>

          <div style={styles.inputGroup}>
            <input
              style={{
                ...styles.input,
                borderColor: !currentRowId ? 'rgba(152, 216, 202, 0.3)' : 'rgba(152, 216, 202, 0.6)'
              }}
              value={inputVal}
              onChange={(e) =>
                setInputVal(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))
              }
              disabled={!currentRowId}
              placeholder={isSmallScreen ? "Đáp án..." : "Nhập đáp án (tiếng Anh)"}
              maxLength={currentRowId ? DATA.find((d) => d.id === currentRowId).answer.length : 30}
            />
            <button
              onClick={handleCheck}
              disabled={!currentRowId}
              style={{
                ...styles.checkBtn,
                opacity: !currentRowId ? 0.6 : 1,
                transform: !currentRowId ? 'scale(0.95)' : 'scale(1)',
                background: !currentRowId ? 'linear-gradient(135deg, #d3d3d3 0%, #a9a9a9 100%)' : styles.checkBtn.background
              }}
            >
              {isSmallScreen ? '✓' : '🧁 Kiểm tra'}
            </button>
          </div>

          <div style={styles.message}>{message}</div>
          
          <div style={styles.stats}>
            🎯 Đã hoàn thành: {Object.values(stateMap).filter((s) => s.solved).length} / {DATA.length} câu
          </div>

          {allSolved && (
            <div style={styles.success}>
              🎉 Tuyệt vời! Bạn đã chinh phục tất cả các câu hỏi!
              <br />
              <strong>✨ Từ khóa bí mật: CYBERSECURITY ✨</strong>
              <br />
              <span style={{ fontSize: '0.9em', opacity: 0.8 }}>🧁 Chúc mừng Master Cybersecurity! 🧁</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState, useRef } from "react";
import bgImage from "./assets/Logo_CLB F-CSC (2).png";

// Crossword mini-game (React, JavaScript) - Fully Responsive Version

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

// Advanced responsive hook
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

// Debounce utility
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

// Dynamic cell size calculation with viewport consideration
function calculateOptimalCellSize(width, height, totalCols) {
  const availableWidth = width - 120; // Account for padding and labels
  const maxCellWidth = Math.floor(availableWidth / (totalCols + 2));
  
  let baseSize;
  if (width < 360) baseSize = 18;
  else if (width < 480) baseSize = 20;
  else if (width < 640) baseSize = 24;
  else if (width < 768) baseSize = 28;
  else if (width < 1024) baseSize = 32;
  else baseSize = 38;

  // Ensure cells fit within viewport
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
    startTimer(20, id);
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

  // Ultra-responsive styles with fluid scaling
  const getResponsiveStyles = () => {
    const gap = isSmallScreen ? 3 : isMobile ? 4 : isTablet ? 6 : 8;
    const padding = isSmallScreen ? 6 : isMobile ? 8 : isTablet ? 10 : 12;
    const borderRadius = isSmallScreen ? 6 : 8;

    return {
      app: {
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  padding: `${padding}px`,
  backgroundImage: `url(${bgImage})`,   // ảnh trong public
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  minHeight: '100vh',
  fontSize: isSmallScreen ? 12 : isMobile ? 14 : 16,
  boxSizing: 'border-box',
  overflow: 'hidden',
},


      header: {
        fontSize: isSmallScreen ? 14 : isMobile ? 16 : isTablet ? 18 : 20,
        marginBottom: padding,
        textAlign: 'center',
        fontWeight: 700,
        color: '#2d3748',
        wordBreak: 'break-word'
      },
     container: {
  display: 'flex',
  gap: `${gap * 2}px`,
  alignItems: (isMobile && !isLandscape) ? 'stretch' : 'flex-start',
  flexDirection: (isMobile && !isLandscape) ? 'column' : 'row',
  maxWidth: '100%',
  height: (isMobile && !isLandscape) ? 'auto' : `calc(100vh - ${padding * 2 + 60}px)`,
  overflow: 'visible'
},

      board: {
        background: 'white',
        padding: `${padding}px`,
        borderRadius: borderRadius,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        flex: 1,
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      },
      boardContent: {
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        flex: 1,
        minHeight: 0,
        paddingBottom: gap
      },
      labels: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: `${gap}px`, 
        marginRight: `${gap}px`, 
        flexShrink: 0,
        alignItems: 'center'
      },
      rowBtn: (bg) => ({
        width: cellSize,
        height: cellSize,
        borderRadius: Math.min(6, cellSize / 6),
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 700,
        background: bg,
        fontSize: Math.max(10, Math.min(14, cellSize / 3)),
        flexShrink: 0,
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        userSelect: 'none'
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
        borderRadius: Math.min(6, cellSize / 6),
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: Math.max(8, Math.min(14, cellSize / 3)),
        boxSizing: 'border-box',
        position: 'relative',
        flexShrink: 0,
        transition: 'all 0.2s ease',
        ...extra
      }),
      panel: {
        width: isMobile && !isLandscape ? '100%' : Math.min(360, width * 0.4),
        maxWidth: '100%',
        background: 'white',
        padding: `${padding}px`,
        borderRadius: borderRadius,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isMobile && !isLandscape ? 'auto' : `calc(100vh - ${padding * 4 + 60}px)`,
        overflow: 'auto'
      },
      questionContainer: {
        marginBottom: `${padding}px`,
        color: '#4a5568',
        fontSize: isSmallScreen ? 12 : 14
      },
      questionText: {
        minHeight: isSmallScreen ? 48 : isMobile ? 56 : 64,
        marginBottom: `${padding}px`,
        fontSize: isSmallScreen ? 13 : isMobile ? 14 : 15,
        lineHeight: 1.4,
        wordWrap: 'break-word',
        hyphens: 'auto',
        color: '#2d3748'
      },
      timer: {
        fontWeight: 700,
        marginBottom: `${padding}px`,
        color: '#e53e3e',
        fontSize: isSmallScreen ? 14 : isMobile ? 16 : 18,
        textAlign: 'center',
        padding: `${gap}px`,
        background: '#fed7d7',
        borderRadius: borderRadius,
        border: '1px solid #feb2b2'
      },
      inputGroup: {
        display: 'flex',
        gap: `${gap}px`,
        flexDirection: isSmallScreen ? 'column' : 'row',
        alignItems: 'stretch',
        marginBottom: `${padding}px`
      },
      input: {
        flex: 1,
        padding: `${padding}px ${padding + 2}px`,
        fontSize: 16,
        textTransform: 'uppercase',
        border: '2px solid #e2e8f0',
        borderRadius: borderRadius,
        minWidth: 0,
        outline: 'none',
        transition: 'border-color 0.2s ease',
        fontFamily: 'monospace, monospace'
      },
      checkBtn: {
        padding: `${padding}px ${padding + 4}px`,
        background: '#3182ce',
        color: 'white',
        border: 'none',
        borderRadius: borderRadius,
        fontWeight: 700,
        fontSize: isSmallScreen ? 14 : 16,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: isSmallScreen ? 'auto' : '80px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      message: {
        minHeight: isSmallScreen ? 20 : 24,
        fontSize: isSmallScreen ? 12 : 14,
        color: '#4a5568',
        textAlign: 'center',
        marginBottom: `${gap}px`,
        wordWrap: 'break-word'
      },
      stats: {
        color: '#718096',
        fontSize: isSmallScreen ? 11 : 13,
        textAlign: 'center',
        padding: `${gap}px`,
        background: '#f7fafc',
        borderRadius: borderRadius,
        margin: `${gap}px 0`
      },
      success: {
        marginTop: `${padding}px`,
        padding: `${padding}px`,
        background: '#c6f6d5',
        borderRadius: borderRadius,
        fontWeight: 700,
        fontSize: isSmallScreen ? 13 : 14,
        textAlign: 'center',
        color: '#22543d',
        border: '1px solid #9ae6b4',
        wordWrap: 'break-word'
      },
      instruction: {
        marginTop: `${gap}px`,
        color: '#718096',
        fontSize: isSmallScreen ? 10 : 12,
        textAlign: 'center',
        lineHeight: 1.3,
        wordWrap: 'break-word'
      }
    };
  };

  const styles = getResponsiveStyles();

  const renderLabels = () => {
    return DATA.map((d) => {
      const st = stateMap[d.id];
      const bg = st.solved ? '#c6f6d5' : st.locked ? '#f7fafc' : '#ffffff';
      return (
        <button
          key={d.id}
          style={styles.rowBtn(bg)}
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
          <div key={`r${d.id}-c${c}`} style={styles.cell({ border: 'none', background: 'transparent' })}></div>
        );
      } else {
        const idx = c - startCol;
        const isCenter = c === centerCol;
        const st = stateMap[d.id];
        const letter = st.solved ? d.answer[idx] : '';
        let bg = '#ffffff';
        let color = '#2d3748';

        if (st.solved) {
          if (isCenter) {
            bg = '#fef08a';
            color = '#365314';
          } else {
            bg = '#c6f6d5';
            color = '#22543d';
          }
        } else if (st.locked) {
          if (isCenter) {
            bg = '#fed7aa';
            color = '#9a3412';
          } else {
            bg = '#f1f5f9';
            color = '#64748b';
          }
        } else if (isCenter) {
          bg = '#fef08a';
          color = '#365314';
        }

        // 🔥 thêm border đen nếu hàng đang được chọn
        const extraStyle = d.id === currentRowId ? { border: '2px solid black' } : {};

        rowCells.push(
          <div 
            key={`r${d.id}-c${c}`} 
            style={styles.cell({ background: bg, color, ...extraStyle })}
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
      <h2 
  style={{
    fontSize: "clamp(1.5rem, 4vw, 3rem)", // chữ responsive
    fontWeight: "bold",
    textAlign: "center",
    margin: "10px 0", // giảm khoảng trống trên/dưới
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  }}
>
  🎯 CROSS MINIGAME 🎯
</h2>

<span 
  style={{ 
    fontSize: "clamp(0.7rem, 2vw, 1rem)", 
    color: "#718096", 
    textAlign: "center",
    display: "block",
    marginTop: "4px"
  }}
>
</span>



      
      <div style={styles.container}>
        <div style={styles.board}>
          <div style={styles.boardContent}>
            <div style={styles.labels}>{renderLabels()}</div>
            <div style={styles.cellsCol}>{renderCells()}</div>
          </div>
          <div style={styles.instruction}>
            {isSmallScreen ? 
              'Chọn số → trả lời trong 20s' : 
              'Click số hàng (1–13) để chọn → câu hỏi sẽ hiện và bắt đầu 20s đếm ngược.'
            }
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.questionContainer}>
            {currentRowId ? `Câu hỏi ${currentRowId}:` : 'Chọn một hàng (1→13) để bắt đầu:'}
          </div>
          
          <div style={styles.questionText}>
            {currentRowId ? DATA.find((d) => d.id === currentRowId).question : 'Sẵn sàng thử thách kiến thức bảo mật của bạn!'}
          </div>
          
          <div style={styles.timer}>
            ⏱️ {runningTimerFor === currentRowId ? `${remaining}s` : '00s'}
          </div>

          <div style={styles.inputGroup}>
            <input
              style={{
                ...styles.input,
                ':focus': { borderColor: '#3182ce' }
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
                transform: !currentRowId ? 'none' : 'translateY(0)',
                ':hover': !currentRowId ? {} : { background: '#2c5aa0' }
              }}
            >
              {isSmallScreen ? '✓' : 'Kiểm tra'}
            </button>
          </div>

          <div style={styles.message}>{message}</div>
          
          <div style={styles.stats}>
            Đã hoàn thành: {Object.values(stateMap).filter((s) => s.solved).length} / {DATA.length} câu
          </div>

          {allSolved && (
            <div style={styles.success}>
              🎉 Xuất sắc! Bạn đã chinh phục tất cả!
              <br />
              <strong>Từ khóa: CYBERSECURITY</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
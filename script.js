// ฟังก์ชันจัดรูปแบบสกุลเงินบาท
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2
    }).format(amount);
};

// ระบบ Categorize เบื้องต้น (จำลองการทำงานของ AI)
const autoCategorize = (desc) => {
    const d = desc.toLowerCase();
    if (d.includes('7-11') || d.includes('food') || d.includes('starbucks')) return '🍔 อาหาร/เครื่องดื่ม';
    if (d.includes('grab') || d.includes('taxi') || d.includes('ptt')) return '🚗 เดินทาง';
    if (d.includes('salary') || d.includes('เงินเดือน')) return '💰 รายรับ';
    return '📦 อื่นๆ';
};

// เชื่อมต่อ UI กับโค้ด
const fileInput = document.getElementById('csvFile');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const analyzeBtn = document.getElementById('analyzeBtn');

// อัปเดตชื่อไฟล์เมื่อ User เลือกไฟล์แล้ว
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileNameDisplay.textContent = `ไฟล์: ${e.target.files[0].name}`;
        fileNameDisplay.style.color = 'var(--primary)';
    } else {
        fileNameDisplay.textContent = 'ยังไม่ได้เลือกไฟล์...';
        fileNameDisplay.style.color = 'var(--text-muted)';
    }
});

// กดปุ่มวิเคราะห์
analyzeBtn.addEventListener('click', () => {
    const file = fileInput.files[0];

    if (!file) {
        alert("⚠️ กรุณาเลือกไฟล์ CSV ก่อนทำการวิเคราะห์ครับ");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            processData(e.target.result);
        } catch (error) {
            alert("❌ เกิดข้อผิดพลาดในการอ่านไฟล์: " + error.message);
        }
    };
    reader.readAsText(file);
});

// ฟังก์ชันหลัก: ประมวลผลข้อมูล
function processData(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error("ไฟล์ไม่มีข้อมูล หรือไม่ใช่ฟอร์แมตที่ถูกต้อง");

    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = ''; // ล้างตาราง

    let totalIncome = 0;
    let totalExpense = 0;

    // ลูปอ่านข้อมูล (เริ่มที่ 1 เพื่อข้าม Header บรรทัดแรก)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',');
        if (columns.length < 3) continue;

        const date = columns[0];
        const desc = columns[1];
        const amount = parseFloat(columns[2]);

        if (isNaN(amount)) continue;

        // แยกคำนวณรายรับ-รายจ่าย
        if (amount > 0) totalIncome += amount;
        else totalExpense += Math.abs(amount);

        // สร้างแถวตาราง
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${date}</td>
            <td>${desc}</td>
            <td><span class="badge">${autoCategorize(desc)}</span></td>
            <td class="${amount > 0 ? 'text-success' : 'text-danger'}">
                ${amount > 0 ? '+' : ''}${formatCurrency(amount)}
            </td>
        `;
        tbody.appendChild(tr);
    }

    // อัปเดต Dashboard
    document.getElementById('totalIncome').innerText = formatCurrency(totalIncome);
    document.getElementById('totalExpense').innerText = formatCurrency(totalExpense);
}
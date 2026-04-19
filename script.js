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
    if (!desc) return '📦 อื่นๆ';

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
function parseCSV(csvText) {
    const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
    });

    return result.data;
}

function processData(csvText) {
    const rawData = parseCSV(csvText);
    if (rawData.length < 1) throw new Error("ไฟล์ไม่มีข้อมูล หรือไม่ใช่ฟอร์แมตที่ถูกต้อง");

    const data = normalizeData(rawData);
    console.log(data);
    console.log("RAW:", rawData);
    console.log("NORMALIZED:", data);

    // 1. คำนวณ
    const summary = calculateSummary(data);

    // 2. render table
    renderTable(data);
    renderChart(data);

    // 3. update dashboard
    document.getElementById('totalIncome').innerText = formatCurrency(summary.totalIncome);
    document.getElementById('totalExpense').innerText = formatCurrency(summary.totalExpense);
}

// สร้าง function ทำข้อมูลกราฟ
function prepareChartData(data) {
    const categoryMap = {};

    data.forEach(item => {
        const amount = item.amount;
        if (amount >= 0) return; // เอาเฉพาะรายจ่าย

        const category = autoCategorize(item.desc);

        if (!categoryMap[category]) {
            categoryMap[category] = 0;
        }

        categoryMap[category] += Math.abs(amount);
    });

    return categoryMap;
}

// สร้าง function render chart
let chartInstance = null;

function renderChart(data) {
    const ctx = document.getElementById('expenseChart').getContext('2d');

    const chartData = prepareChartData(data);

    const labels = Object.keys(chartData);
    const values = Object.values(chartData);
    if (values.length === 0) {
    console.warn("ไม่มีข้อมูลรายจ่ายสำหรับกราฟ");
    return;
}

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#4f46e5',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#6366f1'
                ]
            }]
        }
    });
} // 

function calculateSummary(data) {
    let totalIncome = 0;
    let totalExpense = 0;

    data.forEach(item => {
        const amount = item.amount;

        if (isNaN(amount)) return;

        if (amount > 0) totalIncome += amount;
        else totalExpense += Math.abs(amount);
    });

    return { totalIncome, totalExpense };
}

function renderTable(data) {
    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const { date, desc, amount } = item;

        if (isNaN(amount)) return;

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
    });
}

function normalizeData(rawData) {
    return rawData.map(item => {
        const date = item["Date"] || item["วันที่"] || "-";
        const desc = item["Description"] || item["รายละเอียด"] || "-";

        const cleanNumber = (val) => parseFloat((val || "0").toString().replace(/,/g, ''));

        const debit = cleanNumber(item["Debit"] || item["ถอน"]);
        const credit = cleanNumber(item["Credit"] || item["ฝาก"]);

        return {
            date,
            desc,
            amount: credit - debit
        };
    });
} 
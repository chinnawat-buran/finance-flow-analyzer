document.getElementById('analyzeBtn').addEventListener('click', () => {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            processData(text);
        };
        reader.readAsText(file);
    } else {
        alert("กรุณาเลือกไฟล์ CSV ก่อนครับ");
    }
});

function processData(csvText) {
    const lines = csvText.split('\n');
    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = ''; // ล้างข้อมูลเก่า

    let income = 0;
    let expense = 0;

    // ข้าม Line แรกที่เป็น Header
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const [date, description, amount] = lines[i].split(',');
        const val = parseFloat(amount);

        // Logic พื้นฐาน: แยกรายรับ/รายจ่าย
        if (val > 0) income += val;
        else expense += Math.abs(val);

        // แสดงผลในตาราง
        const row = `<tr>
            <td>${date}</td>
            <td>${description}</td>
            <td>${autoCategorize(description)}</td>
            <td style="color: ${val > 0 ? 'green' : 'red'}">${val}</td>
        </tr>`;
        tbody.innerHTML += row;
    }

    document.getElementById('totalIncome').innerText = `฿${income.toLocaleString()}`;
    document.getElementById('totalExpense').innerText = `฿${expense.toLocaleString()}`;
}

// ระบบ Categorize เบื้องต้น (หัวใจของโปรเจกต์)
function autoCategorize(desc) {
    const d = desc.toLowerCase();
    if (d.includes('7-11') || d.includes('food')) return 'อาหาร';
    if (d.includes('grab') || d.includes('ptt')) return 'เดินทาง';
    return 'อื่นๆ';
}
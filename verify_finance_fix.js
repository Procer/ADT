
const axios = require('axios');

async function verify() {
    try {
        const tenantId = '8AF3423E-F36B-1410-8A7F-00A64490CC08';
        const url = `http://localhost:3000/api/finance-v3/report?tenantId=${tenantId}&month=3&year=2026`;

        console.log('Fetching report from:', url);
        const res = await axios.get(url);

        const data = res.data;
        console.log('--- REPORT SUMMARY ---');
        console.log('Total Despachos:', data.totalDespachos);
        console.log('Total Credits (Aggregated):', data.credits);
        console.log('Total Amount Owed (Tenant Balance):', data.totalAmountOwed);
        console.log('Tarifa Vigente:', data.costPerUnit);

        console.log('--- BREAKDOWN BY CLIENT ---');
        data.breakdown.forEach(b => {
            console.log(`Cliente: ${b.nombre} | CPs: ${b.totalCps} | Credits: ${b.credits} | Owed: ${b.amountOwed}`);
        });

        if (data.totalAmountOwed === 9000) {
            console.log('SUCCESS: Debt matches DB value ($9,000)');
        } else {
            console.warn('WARNING: Debt discrepancy detected. Expected 9000, got', data.totalAmountOwed);
        }

    } catch (e) {
        console.error('Connection error:', e.message);
    }
}
verify();

import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, BarChart, Bar, ResponsiveContainer } from "recharts";
import { fetchLatestExcel } from "./GraphConnector";
import submitApproval from "./submitApproval";

const initialCash = 1000000;
const payrollCap = 350000;

const genSampleData = (start, end) => {
  const arr = [];
  let current = new Date(start);
  let bal = initialCash;
  while (current <= end) {
    arr.push({
      date: current.toISOString().slice(0, 10),
      balance: bal,
    });
    current.setDate(current.getDate() + 7);
    bal -= Math.random() * 20000;
  }
  return arr;
};

const transactionTypes = [
  "Purchase", "Payroll", "Travel", "Contract"
];

export default function App() {
  const [tx, setTx] = useState({
    type: "Purchase", amount: "", requestDate: "", deliveryDate: "", paymentTerms: "",
    department: "", fundType: "", hireDate: "", payCycle: "Bi-Weekly", payrollDate: "",
  });
  const [fringe, setFringe] = useState(0);
  const [simData, setSimData] = useState(genSampleData(new Date("2025-05-01"), new Date("2025-07-31")));
  const [impactData, setImpactData] = useState([]);
  const [risk, setRisk] = useState({ cash: 0, budget: 0, overall: 0 });
  const [status, setStatus] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const handleChange = e => {
    const { name, value } = e.target;
    setTx(t => ({ ...t, [name]: value }));
    if ((tx.type === "Payroll" || name === "type") && (name === "amount" || name === "type")) {
      let val = name === "amount" ? value : tx.amount;
      if ((tx.type === "Payroll" && name === "amount") || (name === "type" && value === "Payroll")) {
        setFringe(Number(val) * 0.46);
      } else {
        setFringe(0);
      }
    }
  };

  const calcImpact = () => {
    let impact = [...simData];
    let amt = Number(tx.amount);
    let paymentDate = tx.requestDate;
    if (tx.type === "Payroll") {
      paymentDate = tx.payCycle === "Bi-Weekly" ? "2025-01-24" : "2025-01-31";
      amt = amt + amt * 0.46;
      setFringe(Number(tx.amount) * 0.46);
    } else if (tx.type === "Purchase" && tx.deliveryDate && tx.paymentTerms) {
      const d = new Date(tx.deliveryDate);
      d.setDate(d.getDate() + Number(tx.paymentTerms));
      paymentDate = d.toISOString().slice(0, 10);
    }
    impact = impact.map(row =>
      row.date === paymentDate ? { ...row, balance: row.balance - amt } : row
    );
    setImpactData(impact);

    const minBal = Math.min(...impact.map(d => d.balance));
    const cashRisk = minBal < 0 ? 100 : minBal < initialCash * 0.2 ? 75 : 25;
    const budgetRisk = amt > payrollCap ? 100 : 25;
    setRisk({
      cash: cashRisk,
      budget: budgetRisk,
      overall: Math.max(cashRisk, budgetRisk),
    });
  };

  const getExcel = async () => {
    const url = await fetchLatestExcel("https://ullafayette-my.sharepoint.com/:f:/r/personal/c00001003_louisiana_edu/Documents/Cash%20flow?csf=1&web=1&e=hrWAIi");
    setFileUrl(url);
  };

  const approve = async (decision) => {
    setStatus("Submitting...");
    const resp = await submitApproval({ ...tx, decision });
    setStatus(resp ? "Submitted!" : "Failed.");
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 rounded-2xl bg-white shadow-2xl">
      <h1 className="text-2xl font-bold mb-4">Cash Flow Impact Analyzer</h1>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label>Transaction Type
          <select name="type" value={tx.type} onChange={handleChange} className="block w-full">
            {transactionTypes.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </label>
        <label>Amount
          <input name="amount" type="number" value={tx.amount} onChange={handleChange} className="block w-full" />
        </label>
        <label>Request Date
          <input name="requestDate" type="date" value={tx.requestDate} onChange={handleChange} className="block w-full" />
        </label>
        {tx.type === "Purchase" && <>
          <label>Delivery Date
            <input name="deliveryDate" type="date" value={tx.deliveryDate} onChange={handleChange} className="block w-full" />
          </label>
          <label>Payment Terms (days)
            <input name="paymentTerms" type="number" value={tx.paymentTerms} onChange={handleChange} className="block w-full" />
          </label>
        </>}
        <label>Department
          <input name="department" value={tx.department} onChange={handleChange} className="block w-full" />
        </label>
        <label>Fund Type
          <input name="fundType" value={tx.fundType} onChange={handleChange} className="block w-full" />
        </label>
        {tx.type === "Payroll" && <>
          <label>Hire Date
            <input name="hireDate" type="date" value={tx.hireDate} onChange={handleChange} className="block w-full" />
          </label>
          <label>Pay Cycle
            <select name="payCycle" value={tx.payCycle} onChange={handleChange} className="block w-full">
              <option>Bi-Weekly</option>
              <option>Monthly</option>
            </select>
          </label>
          <div className="col-span-2">Fringe: <span className="font-bold">${fringe.toFixed(2)}</span></div>
        </>}
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-xl mr-2" onClick={calcImpact}>Simulate Impact</button>
      <button className="bg-green-600 text-white px-4 py-2 rounded-xl" onClick={getExcel}>Fetch Live Excel</button>
      {fileUrl && <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-700 underline">Download Excel</a>}

      <div className="mt-4">
        <p>Cash Risk: <b>{risk.cash}</b> | Budget Risk: <b>{risk.budget}</b> | Overall: <b>{risk.overall}</b></p>
        <button className="bg-indigo-700 text-white px-4 py-2 rounded-xl mt-2" onClick={() => approve("approve")}>Approve</button>
        <button className="bg-red-500 text-white px-4 py-2 rounded-xl mt-2 ml-2" onClick={() => approve("disapprove")}>Disapprove</button>
        <span className="ml-4 text-green-800">{status}</span>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Cash Balance (Before & After)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={impactData.length ? impactData : simData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="balance" stroke="#8884d8" name="Cash Balance" />
            <ReferenceLine y={payrollCap} label="Payroll Cap" stroke="red" />
          </LineChart>
        </ResponsiveContainer>
        <h2 className="text-lg font-semibold mb-2 mt-6">Budget Status</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={[risk]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cash" fill="#8884d8" name="Cash Risk" />
            <Bar dataKey="budget" fill="#82ca9d" name="Budget Risk" />
            <Bar dataKey="overall" fill="#ffc658" name="Overall Risk" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

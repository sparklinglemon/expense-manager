import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import '../styles/inputfix.css';
import ManageNavBar from "../components/ManageNavBar";
import { suggestReimbursements } from "../utils/suggestReimbursements";

const Balances = () => {

  const API_URL = import.meta.env.VITE_API_URL;
  const group_url = useParams().id;

  const [balances, setBalances] = useState([]);
  const [groupCurrency, setGroupCurrency] = useState("");
  const [pendingKey, setPendingKey] = useState(null);

  const fetchbalances = async () => {
    try {
      const response = await axios.get(`${API_URL}/groups/balances/${group_url}`);
      setBalances(response.data);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await axios.get(`${API_URL}/groups/${group_url}`);
        setGroupCurrency(response.data.group_currency);
      } catch (error) {
        console.error("Error fetching currency:", error);
      }
    };

    fetchbalances();
    fetchCurrency();
  }, [group_url]);

  const reimbursements = suggestReimbursements(balances);

  // A repayment is an expense paid by the debtor on behalf of the creditor.
  const markAsPaid = async ({ from, to, amount }, key) => {
    if (pendingKey) return;
    setPendingKey(key);
    try {
      await axios.post(`${API_URL}/expenses`, {
        title: `Repayment: ${from.user_name} to ${to.user_name}`,
        description: "",
        amount,
        paid_by: from.user_id,
        group_id: group_url,
        participantAmounts: {
          [from.user_id]: -amount,
          [to.user_id]: amount,
        },
        split: false,
      });
      await fetchbalances();
    } catch (error) {
      console.error("Error recording repayment:", error);
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="min-h-screen p-4">
    <div className="flex flex-col items-center">
      {/* Wrapper for aligning group name and ManageNavBar */}
      <div className="flex flex-none w-full max-w-3xl">
        <ManageNavBar />
      </div>
        {/* Green Section - Balances */}
        <div className="bg-gray-800 border border-gray-900 rounded-lg p-6 mb-4 max-w-3xl w-full">
          <h1 className="text-2xl font-bold mb-6 text-white">Balances</h1>
          <div className="space-y-4">
            {balances
            .filter((balance) => balance.total_amount != 0)
            .map((balance) => (

              <div key={balance.user_id} className="flex justify-between bg-gray-700 border border-gray-600 rounded-lg p-4">
                <span className="text-white">{balance.user_name}</span>
                <span className={` ${balance.total_amount < 0 ? 'text-green-500' : 'text-red-500'}`}>
                    { balance.total_amount < 0
                        ? `+${Math.abs(balance.total_amount).toFixed(2)}`
                        : `-${balance.total_amount}`
                    }
                </span>


              </div>
            ))}
          </div>
        </div>

        {/* Blue Section - Reimbursements */}
        <div className="bg-gray-800 border border-gray-900 rounded-lg p-6 mb-4 max-w-3xl w-full">
          <h2 className="text-2xl font-semibold mb-6 text-white">Suggested Reimbursement</h2>
          {reimbursements.length === 0 ? (
            <p className="text-gray-400 text-center">Everyone is settled up!</p>
          ) : (
            <div className="space-y-4">
              {reimbursements.map((reimbursement) => {
                const key = `${reimbursement.from.user_id}-${reimbursement.to.user_id}`;
                const isPending = pendingKey === key;
                return (
                  <div key={key} className="flex items-center justify-between gap-4 bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <span className="text-white min-w-0">
                      <span className="font-semibold">{reimbursement.from.user_name}</span>
                      <span className="text-gray-400"> owes </span>
                      <span className="font-semibold">{reimbursement.to.user_name}</span>
                    </span>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-white">
                        {reimbursement.amount.toFixed(2)} {groupCurrency}
                      </span>
                      <button
                        type="button"
                        onClick={() => markAsPaid(reimbursement, key)}
                        disabled={pendingKey !== null}
                        className="px-3 py-1 rounded-md text-sm text-white font-semibold bg-[#B065FF] hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending ? "Saving..." : "Mark as paid"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

}

export default Balances;

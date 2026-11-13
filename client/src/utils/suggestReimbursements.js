// Positive balance = owes money, negative = is owed (matches /groups/balances).
// Pairs debtors with creditors, largest first, which settles
// everyone in at most (members - 1) payments. Works in cents to avoid float drift.
export const suggestReimbursements = (balances) => {
  const toCents = (value) => Math.round(Number(value) * 100);

  const debtors = [];
  const creditors = [];
  for (const balance of balances) {
    const cents = toCents(balance.total_amount);
    const member = { user_id: balance.user_id, user_name: balance.user_name };
    if (cents > 0) debtors.push({ ...member, cents });
    else if (cents < 0) creditors.push({ ...member, cents: -cents });
  }

  const byLargest = (a, b) => b.cents - a.cents;
  debtors.sort(byLargest);
  creditors.sort(byLargest);

  const reimbursements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const cents = Math.min(debtor.cents, creditor.cents);

    reimbursements.push({
      from: { user_id: debtor.user_id, user_name: debtor.user_name },
      to: { user_id: creditor.user_id, user_name: creditor.user_name },
      amount: cents / 100,
    });

    debtor.cents -= cents;
    creditor.cents -= cents;
    if (debtor.cents === 0) debtorIndex++;
    if (creditor.cents === 0) creditorIndex++;
  }

  return reimbursements;
};

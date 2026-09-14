with open("src/app/dashboard/recovery/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add onSnapshot to imports
old_import = 'import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc } from "firebase/firestore";'
new_import = 'import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";'

if old_import in text:
    text = text.replace(old_import, new_import)

old_effect = """  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [custSnap, invSnap, recSnap] = await Promise.all([
        getDocs(query(collection(db, "customers"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "investors")),
        getDocs(query(collection(db, "recoveries"), orderBy("date", "desc"))),
      ]);

      const custData = custSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(custData);
      setInvestors(invSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Investor)));
      setRecoveryHistory(recSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RecoveryRecord)));
    } catch (err) {
      console.error("Error loading recovery data:", err);
    } finally {
      setLoadingData(false);
    }
  };"""

new_effect = """  useEffect(() => {
    // 1. Realtime Customers Listener
    const qCust = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsubCust = onSnapshot(qCust, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(data);
      setLoadingData(false);
    }, (err) => console.warn("Recovery cust sync warn:", err));

    // 2. Realtime Investors Listener
    const qInv = collection(db, "investors");
    const unsubInv = onSnapshot(qInv, (snap) => {
      setInvestors(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Investor)));
    }, (err) => console.warn("Recovery inv sync warn:", err));

    // 3. Realtime Recoveries Listener
    const qRec = query(collection(db, "recoveries"), orderBy("date", "desc"));
    const unsubRec = onSnapshot(qRec, (snap) => {
      setRecoveryHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecoveryRecord)));
    }, (err) => console.warn("Recovery rec sync warn:", err));

    return () => {
      unsubCust();
      unsubInv();
      unsubRec();
    };
  }, []);"""

if old_effect in text:
    text = text.replace(old_effect, new_effect)
    with open("src/app/dashboard/recovery/page.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Real-time Recovery page updated cleanly!")
else:
    print("WARNING: Exact old_effect not found in recovery page!")

def upgrade_investor_portal():
    with open("src/app/investor/portal/page.tsx", "r", encoding="utf-8") as f:
        text = f.read()

    text = text.replace(
        'import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc } from "firebase/firestore";',
        'import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";'
    )

    old_effect = """  useEffect(() => {
    if (!appUser) {
      router.push("/");
      return;
    }
    loadData();
  }, [appUser, router]);

  const loadData = async () => {
    if (!appUser) return;
    try {
      // Find investor by userId
      const invSnap = await getDocs(query(collection(db, "investors"), where("userId", "==", appUser.uid)));
      if (invSnap.empty) { setLoading(false); return; }
      const inv = { id: invSnap.docs[0].id, ...invSnap.docs[0].data() } as Investor;
      setInvestor(inv);

      // Load customers on this investor's capital
      const custSnap = await getDocs(query(collection(db, "customers"), where("investorId", "==", inv.id)));
      setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer)));

      // Load investments history
      const invHistSnap = await getDocs(query(collection(db, "investments"), where("investorId", "==", inv.id), orderBy("date", "desc")));
      setInvestments(invHistSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Investment)));

      // Load recoveries
      const recSnap = await getDocs(query(collection(db, "recoveries"), where("investorId", "==", inv.id), orderBy("date", "desc")));
      setRecoveries(recSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Recovery)));

      // Load notifications
      const notifSnap = await getDocs(query(collection(db, "notifications"), where("userId", "==", appUser.uid), orderBy("createdAt", "desc")));
      setNotifications(notifSnap.docs.map((d) => ({ id: d.id, ...d.data() } as NotifType)));

      // Show guide if first time
      if (!appUser.guideSeen) {
        setShowGuide(true);
      }
    } catch (err) {
      console.error("Error loading investor data:", err);
    } finally {
      setLoading(false);
    }
  };"""

    new_effect = """  useEffect(() => {
    if (!appUser) {
      router.push("/");
      return;
    }

    const qInv = query(collection(db, "investors"), where("userId", "==", appUser.uid));
    const unsubInv = onSnapshot(qInv, (snap) => {
      if (!snap.empty) {
        const inv = { id: snap.docs[0].id, ...snap.docs[0].data() } as Investor;
        setInvestor(inv);

        // Set up nested real-time listeners for this investor
        const unsubCust = onSnapshot(query(collection(db, "customers"), where("investorId", "==", inv.id)), (cSnap) => {
          setCustomers(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer)));
        });

        const unsubHist = onSnapshot(query(collection(db, "investments"), where("investorId", "==", inv.id), orderBy("date", "desc")), (hSnap) => {
          setInvestments(hSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Investment)));
        });

        const unsubRec = onSnapshot(query(collection(db, "recoveries"), where("investorId", "==", inv.id), orderBy("date", "desc")), (rSnap) => {
          setRecoveries(rSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Recovery)));
        });

        const unsubNotif = onSnapshot(query(collection(db, "notifications"), where("userId", "==", appUser.uid), orderBy("createdAt", "desc")), (nSnap) => {
          setNotifications(nSnap.docs.map((d) => ({ id: d.id, ...d.data() } as NotifType)));
        });
      }
      setLoading(false);
    }, (err) => {
      console.warn("Investor portal realtime sync error:", err);
      setLoading(false);
    });

    if (appUser && !appUser.guideSeen) {
      setShowGuide(true);
    }

    return () => unsubInv();
  }, [appUser, router]);"""

    if old_effect in text:
        text = text.replace(old_effect, new_effect)
        with open("src/app/investor/portal/page.tsx", "w", encoding="utf-8") as f:
            f.write(text)
        print("Investor portal realtime sync enabled!")
    else:
        print("WARNING: Investor portal old_effect not found!")

def upgrade_reseller_portal():
    with open("src/app/reseller/portal/page.tsx", "r", encoding="utf-8") as f:
        text = f.read()

    text = text.replace(
        'import { collection, getDocs, query, where } from "firebase/firestore";',
        'import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";'
    )

    old_effect = """  useEffect(() => {
    if (!appUser) {
      router.push("/");
      return;
    }
    loadData();
  }, [appUser, router]);

  const loadData = async () => {
    if (!appUser) return;
    try {
      const resSnap = await getDocs(query(collection(db, "resellers"), where("userId", "==", appUser.uid)));
      if (resSnap.empty) { setLoading(false); return; }
      const res = { id: resSnap.docs[0].id, ...resSnap.docs[0].data() } as Reseller;
      setReseller(res);

      const custSnap = await getDocs(query(collection(db, "customers"), where("resellerId", "==", res.id)));
      setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer)));

      if (!appUser.guideSeen) setShowGuide(true);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };"""

    new_effect = """  useEffect(() => {
    if (!appUser) {
      router.push("/");
      return;
    }

    const qRes = query(collection(db, "resellers"), where("userId", "==", appUser.uid));
    const unsubRes = onSnapshot(qRes, (snap) => {
      if (!snap.empty) {
        const res = { id: snap.docs[0].id, ...snap.docs[0].data() } as Reseller;
        setReseller(res);

        onSnapshot(query(collection(db, "customers"), where("resellerId", "==", res.id)), (cSnap) => {
          setCustomers(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer)));
        });
      }
      setLoading(false);
    }, (err) => {
      console.warn("Reseller portal realtime sync error:", err);
      setLoading(false);
    });

    if (appUser && !appUser.guideSeen) setShowGuide(true);

    return () => unsubRes();
  }, [appUser, router]);"""

    if old_effect in text:
        text = text.replace(old_effect, new_effect)
        with open("src/app/reseller/portal/page.tsx", "w", encoding="utf-8") as f:
            f.write(text)
        print("Reseller portal realtime sync enabled!")
    else:
        print("WARNING: Reseller portal old_effect not found!")

upgrade_investor_portal()
upgrade_reseller_portal()

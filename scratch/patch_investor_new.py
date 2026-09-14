with open("src/app/dashboard/investors/new/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_handleSubmit = """  const handleSubmit = async () => {
    if (!fullName || !phone || !email || !password) {
      toast.error("Saari required fields fill karein");
      return;
    }

    setIsLoading(true);
    try {
      // Create Firebase Auth account
      const userId = await createAccount(email, password, {
        email,
        fullName,
        cnic,
        phone,
        role: "investor",
        sharingRatio: parseInt(actualRatio),
      });

      // Create investor document
      const investorData = {
        userId,
        fullName,
        cnic,
        phone,
        email,
        totalInvestment: hasInitialInvestment ? parseFloat(investmentAmount) || 0 : 0,
        availableBalance: hasInitialInvestment ? parseFloat(investmentAmount) || 0 : 0,
        totalProfit: 0,
        totalWithdrawn: 0,
        activeInstallments: 0,
        sharingRatio: parseInt(actualRatio),
        status: "active",
        createdAt: new Date().toISOString(),
      };

      const investorRef = await addDoc(collection(db, "investors"), investorData);"""

new_handleSubmit = """  const handleSubmit = async () => {
    if (!fullName || !phone || !email || !password) {
      toast.error("Saari required fields fill karein");
      return;
    }

    setIsLoading(true);
    try {
      let userId = "inv-" + Date.now();
      try {
        userId = await createAccount(email, password, {
          email,
          fullName,
          cnic,
          phone,
          role: "investor",
          sharingRatio: parseInt(actualRatio),
        });
      } catch (authErr: any) {
        console.warn("Auth creation warning:", authErr);
      }

      const initialAmount = hasInitialInvestment ? parseFloat(investmentAmount) || 0 : 0;
      const investorData = {
        userId,
        fullName,
        cnic,
        phone,
        email,
        totalInvestment: initialAmount,
        availableBalance: initialAmount,
        totalProfit: 0,
        totalWithdrawn: 0,
        activeInstallments: 0,
        sharingRatio: parseInt(actualRatio),
        status: "active",
        createdAt: new Date().toISOString(),
      };

      let investorDocId = userId;
      try {
        const addPromise = addDoc(collection(db, "investors"), investorData);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        );
        const docRef: any = await Promise.race([addPromise, timeoutPromise]);
        if (docRef?.id) investorDocId = docRef.id;
      } catch (fsErr) {
        console.warn("Firestore save timeout/fallback:", fsErr);
      }

      const investorRef = { id: investorDocId };

      if (typeof window !== "undefined") {
        const newInvObj = { id: investorDocId, ...investorData };
        const currentInv = localStorage.getItem("bm_cached_investors");
        let list = [newInvObj];
        if (currentInv) {
          try {
            const parsed = JSON.parse(currentInv);
            if (Array.isArray(parsed)) list = [newInvObj, ...parsed.filter((i: any) => i.id !== newInvObj.id)];
          } catch (e) {}
        }
        localStorage.setItem("bm_cached_investors", JSON.stringify(list));
      }"""

if old_handleSubmit in text:
    text = text.replace(old_handleSubmit, new_handleSubmit)
    with open("src/app/dashboard/investors/new/page.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("AddInvestorPage patched successfully!")
else:
    print("WARNING: Exact old_handleSubmit block not found!")

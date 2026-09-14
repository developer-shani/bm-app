import os

with open("src/app/dashboard/users/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_code = """  // Submit Investor (Partner)
  const handleAddInvestor = async () => {
    if (!invName || !invPhone || !invEmail || !invPassword) {
      toast.error("Saari required fields fill karein");
      return;
    }

    setInvLoading(true);
    const actualRatio = parseInt(invCustomRatio || invRatio);

    try {
      let userId = "inv-" + Date.now();
      try {
        userId = await createAccount(invEmail, invPassword, {
          email: invEmail,
          fullName: invName,
          cnic: invCnic,
          phone: invPhone,
          role: "investor",
          sharingRatio: actualRatio,
        });
      } catch (authErr: any) {
        console.warn("Auth creation fallback:", authErr);
        toast.warning(authErr?.message || "Login account nahi bana, lekin data save ho raha hai");
      }

      const investorData = {
        userId,
        fullName: invName,
        cnic: invCnic,
        phone: invPhone,
        email: invEmail,
        totalInvestment: invHasInitial ? parseFloat(invAmount) || 0 : 0,
        availableBalance: invHasInitial ? parseFloat(invAmount) || 0 : 0,
        totalProfit: 0,
        totalWithdrawn: 0,
        activeInstallments: 0,
        sharingRatio: actualRatio,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      const investorRef = await addDoc(collection(db, "investors"), investorData);

      if (invHasInitial && invProofImage) {
        try {
          const imageRef = ref(storage, `investments/${investorRef.id}/${Date.now()}_proof`);
          await uploadBytes(imageRef, invProofImage);
          const imageUrl = await getDownloadURL(imageRef);
          await addDoc(collection(db, "investments"), {
            investorId: investorRef.id,
            investorName: invName,
            amount: parseFloat(invAmount),
            type: "initial",
            imageProof: imageUrl,
            date: new Date().toISOString(),
            note: "Initial investment",
          });
        } catch (imgErr: any) {
          console.warn("Storage upload warn:", imgErr);
          toast.warning("Investment proof image upload nahi ho saki");
        }
      }

      toast.success(`Investor Partner (${invName}) add ho gaya!`);
      
      const createdInv = { name: invName, email: invEmail, password: invPassword, role: "investor", phone: invPhone };
      // Reset Form
      setInvName(""); setInvCnic(""); setInvPhone(""); setInvEmail(""); setInvPassword("");
      setInvHasInitial(false); setInvAmount(""); setInvProofImage(null); setInvProofPreview("");
      setActiveTab("all");
      loadUsers();
      setShareCredsUser(createdInv);
    } catch (err: any) {
      toast.error(err.message || "Investor account add nahi ho saka");
    } finally {
      setInvLoading(false);
    }
  };

  // Submit Reseller (Member)
  const handleAddReseller = async () => {
    if (!resName || !resPhone) {
      toast.error("Reseller ka naam aur phone zaruri hai");
      return;
    }

    setResLoading(true);
    try {
      let userId = "res-" + Date.now();
      if (resEmail && resPassword) {
        try {
          userId = await createAccount(resEmail, resPassword, {
            email: resEmail,
            fullName: resName,
            phone: resPhone,
            role: "reseller",
          });
        } catch (authErr: any) {
          console.warn("Auth creation fallback:", authErr);
          toast.warning(authErr?.message || "Login account nahi bana, lekin data save ho raha hai");
        }
      }

      await addDoc(collection(db, "resellers"), {
        userId,
        fullName: resName,
        phone: resPhone,
        email: resEmail || "",
        shopName: resShopName || "",
        commissionRate: parseFloat(resCommissionRate) || 5,
        totalCommission: 0,
        pendingCommission: 0,
        totalReferrals: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      });

      toast.success(`Reseller Member (${resName}) add ho gaya!`);
      const createdRes = { name: resName, email: resEmail || resPhone, password: resPassword || "N/A", role: "reseller", phone: resPhone };
      setResName(""); setResPhone(""); setResEmail(""); setResPassword(""); setResShopName("");
      setActiveTab("all");
      loadUsers();
      setShareCredsUser(createdRes);
    } catch (err: any) {
      toast.error(err.message || "Reseller add nahi ho saka");
    } finally {
      setResLoading(false);
    }
  };"""

new_code = """  // Submit Investor (Partner)
  const handleAddInvestor = async () => {
    if (!invName || !invPhone || !invEmail || !invPassword) {
      toast.error("Saari required fields (Name, Phone, Email, Password) fill karein");
      return;
    }

    setInvLoading(true);
    const actualRatio = parseInt(invCustomRatio || invRatio) || 50;

    try {
      let userId = "inv-" + Date.now();
      try {
        userId = await createAccount(invEmail, invPassword, {
          email: invEmail,
          fullName: invName,
          cnic: invCnic,
          phone: invPhone,
          role: "investor",
          sharingRatio: actualRatio,
        });
      } catch (authErr: any) {
        console.warn("Auth creation warning:", authErr);
      }

      const initialAmount = invHasInitial ? parseFloat(invAmount) || 0 : 0;
      const investorData = {
        userId,
        fullName: invName,
        cnic: invCnic || "",
        phone: invPhone,
        email: invEmail,
        totalInvestment: initialAmount,
        availableBalance: initialAmount,
        totalProfit: 0,
        totalWithdrawn: 0,
        activeInstallments: 0,
        sharingRatio: actualRatio,
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

      if (invHasInitial && invProofImage) {
        try {
          const imageRef = ref(storage, `investments/${investorDocId}/${Date.now()}_proof`);
          await uploadBytes(imageRef, invProofImage);
          const imageUrl = await getDownloadURL(imageRef);
          await addDoc(collection(db, "investments"), {
            investorId: investorDocId,
            investorName: invName,
            amount: initialAmount,
            type: "initial",
            imageProof: imageUrl,
            date: new Date().toISOString(),
            note: "Initial investment",
          });
        } catch (imgErr: any) {
          console.warn("Storage upload warning:", imgErr);
        }
      }

      const newInvUser: SystemUser = {
        id: investorDocId,
        name: invName,
        email: invEmail,
        phone: invPhone,
        role: "investor",
        cnic: invCnic,
        sharingRatio: actualRatio,
        totalInvestment: initialAmount,
        createdAt: new Date().toISOString(),
        status: "active",
      };

      setUsersList((prev) => [newInvUser, ...prev.filter((u) => u.id !== newInvUser.id)]);

      if (typeof window !== "undefined") {
        const currentCachedUsers = localStorage.getItem("bm_cached_users");
        let list = [newInvUser];
        if (currentCachedUsers) {
          try {
            const parsed = JSON.parse(currentCachedUsers);
            if (Array.isArray(parsed)) list = [newInvUser, ...parsed.filter((u: any) => u.id !== newInvUser.id)];
          } catch (e) {}
        }
        localStorage.setItem("bm_cached_users", JSON.stringify(list));
      }

      toast.success(`Investor Partner (${invName}) add ho gaya!`);

      const createdInv = { name: invName, email: invEmail, password: invPassword, role: "investor", phone: invPhone };
      
      setInvName(""); setInvCnic(""); setInvPhone(""); setInvEmail(""); setInvPassword("");
      setInvHasInitial(false); setInvAmount(""); setInvProofImage(null); setInvProofPreview("");
      setActiveTab("all");
      setShareCredsUser(createdInv);
    } catch (err: any) {
      toast.error(err.message || "Investor account add nahi ho saka");
    } finally {
      setInvLoading(false);
    }
  };

  // Submit Reseller (Member)
  const handleAddReseller = async () => {
    if (!resName || !resPhone) {
      toast.error("Reseller ka naam aur phone zaruri hai");
      return;
    }

    setResLoading(true);
    try {
      let userId = "res-" + Date.now();
      if (resEmail && resPassword) {
        try {
          userId = await createAccount(resEmail, resPassword, {
            email: resEmail,
            fullName: resName,
            phone: resPhone,
            role: "reseller",
          });
        } catch (authErr: any) {
          console.warn("Auth creation warning:", authErr);
        }
      }

      const resellerData = {
        userId,
        fullName: resName,
        phone: resPhone,
        email: resEmail || "",
        shopName: resShopName || "",
        commissionRate: parseFloat(resCommissionRate) || 5,
        totalCommission: 0,
        pendingCommission: 0,
        totalReferrals: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      let resellerDocId = userId;
      try {
        const addPromise = addDoc(collection(db, "resellers"), resellerData);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        );
        const docRef: any = await Promise.race([addPromise, timeoutPromise]);
        if (docRef?.id) resellerDocId = docRef.id;
      } catch (fsErr) {
        console.warn("Firestore save timeout/fallback:", fsErr);
      }

      const newResUser: SystemUser = {
        id: resellerDocId,
        name: resName,
        email: resEmail || resPhone,
        phone: resPhone,
        role: "reseller",
        totalCommission: 0,
        createdAt: new Date().toISOString(),
        status: "active",
      };

      setUsersList((prev) => [newResUser, ...prev.filter((u) => u.id !== newResUser.id)]);

      if (typeof window !== "undefined") {
        const currentCachedUsers = localStorage.getItem("bm_cached_users");
        let list = [newResUser];
        if (currentCachedUsers) {
          try {
            const parsed = JSON.parse(currentCachedUsers);
            if (Array.isArray(parsed)) list = [newResUser, ...parsed.filter((u: any) => u.id !== newResUser.id)];
          } catch (e) {}
        }
        localStorage.setItem("bm_cached_users", JSON.stringify(list));
      }

      toast.success(`Reseller Member (${resName}) add ho gaya!`);
      const createdRes = { name: resName, email: resEmail || resPhone, password: resPassword || "N/A", role: "reseller", phone: resPhone };

      setResName(""); setResPhone(""); setResEmail(""); setResPassword(""); setResShopName("");
      setActiveTab("all");
      setShareCredsUser(createdRes);
    } catch (err: any) {
      toast.error(err.message || "Reseller add nahi ho saka");
    } finally {
      setResLoading(false);
    }
  };"""

if old_code in text:
    text = text.replace(old_code, new_code)
    with open("src/app/dashboard/users/page.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("3. users/page.tsx submit handlers patched successfully!")
else:
    print("WARNING: Exact old_code block not matched in users/page.tsx")

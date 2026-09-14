with open("src/app/dashboard/customers/new/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_block = """      const docRef = await addDoc(collection(db, "investors"), investorData);
      const newInvestorObj: Investor = {
        id: docRef.id,
        ...investorData,
      };

      setInvestors((prev) => [newInvestorObj, ...prev]);
      setSelectedInvestorId(docRef.id);"""

new_block = """      let investorDocId = userId;
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

      const newInvestorObj: Investor = {
        id: investorDocId,
        ...investorData,
      };

      setInvestors((prev) => [newInvestorObj, ...prev.filter((i) => i.id !== newInvestorObj.id)]);
      setSelectedInvestorId(investorDocId);
      
      if (typeof window !== "undefined") {
        const currentInv = localStorage.getItem("bm_cached_investors");
        let list = [newInvestorObj];
        if (currentInv) {
          try {
            const parsed = JSON.parse(currentInv);
            if (Array.isArray(parsed)) list = [newInvestorObj, ...parsed.filter((i: any) => i.id !== newInvestorObj.id)];
          } catch (e) {}
        }
        localStorage.setItem("bm_cached_investors", JSON.stringify(list));
      }"""

if old_block in text:
    text = text.replace(old_block, new_block)
    with open("src/app/dashboard/customers/new/page.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("New sale page inline investor creation patched successfully!")
else:
    print("WARNING: Exact old_block not found in new sale page!")

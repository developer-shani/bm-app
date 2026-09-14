def upgrade_investors():
    with open("src/app/dashboard/investors/page.tsx", "r", encoding="utf-8") as f:
        text = f.read()

    text = text.replace(
        'import { collection, getDocs, query, orderBy } from "firebase/firestore";',
        'import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";'
    )

    old_effect = """  useEffect(() => {
    loadInvestors();
  }, []);

  const loadInvestors = async () => {
    try {
      const q = query(collection(db, "investors"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Investor));
      setInvestors(data);
    } catch (err) {
      console.error("Error loading investors:", err);
    } finally {
      setLoading(false);
    }
  };"""

    new_effect = """  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bm_cached_investors");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInvestors(parsed);
            setLoading(false);
          }
        } catch (e) {}
      }
    }

    const q = query(collection(db, "investors"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Investor));
        setInvestors(data);
        setLoading(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("bm_cached_investors", JSON.stringify(data));
        }
      },
      (err) => {
        console.warn("Investors realtime sync error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);"""

    if old_effect in text:
        text = text.replace(old_effect, new_effect)
        with open("src/app/dashboard/investors/page.tsx", "w", encoding="utf-8") as f:
            f.write(text)
        print("Investors page realtime sync enabled!")
    else:
        print("WARNING: Investors old_effect not found!")

def upgrade_resellers():
    with open("src/app/dashboard/resellers/page.tsx", "r", encoding="utf-8") as f:
        text = f.read()

    text = text.replace(
        'import { collection, getDocs, query, orderBy } from "firebase/firestore";',
        'import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";'
    )

    old_effect = """  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "resellers"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setResellers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reseller)));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);"""

    new_effect = """  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bm_cached_resellers");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setResellers(parsed);
            setLoading(false);
          }
        } catch (e) {}
      }
    }

    const q = query(collection(db, "resellers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Reseller));
        setResellers(data);
        setLoading(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("bm_cached_resellers", JSON.stringify(data));
        }
      },
      (err) => {
        console.warn("Resellers realtime sync error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);"""

    if old_effect in text:
        text = text.replace(old_effect, new_effect)
        with open("src/app/dashboard/resellers/page.tsx", "w", encoding="utf-8") as f:
            f.write(text)
        print("Resellers page realtime sync enabled!")
    else:
        print("WARNING: Resellers old_effect not found!")

upgrade_investors()
upgrade_resellers()

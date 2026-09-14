with open("src/app/dashboard/customers/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Make sure onSnapshot is imported from firebase/firestore
old_import = 'import { collection, getDocs, query, orderBy } from "firebase/firestore";'
new_import = 'import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";'

if old_import in text:
    text = text.replace(old_import, new_import)

old_effect = """  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bm_cached_customers");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomers(parsed);
            setLoading(false);
          }
        } catch (e) {}
      }
    }
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject("timeout"), 300));
      const snapshot: any = await Promise.race([fetchPromise, timeoutPromise]).catch(() => null);

      if (snapshot && snapshot.docs) {
        const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Customer));
        setCustomers(data);
        if (typeof window !== "undefined") {
          localStorage.setItem("bm_cached_customers", JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };"""

new_effect = """  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bm_cached_customers");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomers(parsed);
            setLoading(false);
          }
        } catch (e) {}
      }
    }

    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Customer));
        setCustomers(data);
        setLoading(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("bm_cached_customers", JSON.stringify(data));
        }
      },
      (err) => {
        console.warn("Realtime customers sync error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);"""

if old_effect in text:
    text = text.replace(old_effect, new_effect)
    with open("src/app/dashboard/customers/page.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Real-time Customers page updated cleanly!")
else:
    print("WARNING: Exact old_effect not found in customers page!")

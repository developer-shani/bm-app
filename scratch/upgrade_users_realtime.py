with open("src/app/dashboard/users/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    'import { collection, getDocs, addDoc } from "firebase/firestore";',
    'import { collection, getDocs, addDoc, onSnapshot } from "firebase/firestore";'
)

old_effect = """  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bm_cached_users");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsersList(parsed);
            setLoading(false);
          }
        } catch (e) {}
      }
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const fetchPromise = Promise.all([
        getDocs(collection(db, "investors")),
        getDocs(collection(db, "resellers")),
      ]);
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject("timeout"), 10000));
      const [invSnap, resSnap]: any = await Promise.race([fetchPromise, timeoutPromise]).catch(() => [null, null]);

      if (invSnap && resSnap) {
        const investors: SystemUser[] = invSnap.docs.map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.fullName || data.name || "Investor",
            email: data.email || "",
            phone: data.phone || "",
            role: "investor",
            cnic: data.cnic || "",
            sharingRatio: data.sharingRatio || 50,
            totalInvestment: data.totalInvestment || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || "active",
          };
        });

        const resellers: SystemUser[] = resSnap.docs.map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.fullName || data.name || "Reseller",
            email: data.email || "",
            phone: data.phone || "",
            role: "reseller",
            totalCommission: data.totalCommission || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || "active",
          };
        });

        const adminUser: SystemUser = {
          id: "admin-1",
          name: "Brother Mobiles Admin",
          email: "admin@brothermobiles.com",
          phone: "0300-0000000",
          role: "admin",
          createdAt: new Date().toISOString(),
          status: "active",
        };

        const fullList = [adminUser, ...investors, ...resellers];
        setUsersList(fullList);
        if (typeof window !== "undefined") {
          localStorage.setItem("bm_cached_users", JSON.stringify(fullList));
        }
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };"""

new_effect = """  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bm_cached_users");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsersList(parsed);
            setLoading(false);
          }
        } catch (e) {}
      }
    }

    let invList: SystemUser[] = [];
    let resList: SystemUser[] = [];

    const adminUser: SystemUser = {
      id: "admin-1",
      name: "Brother Mobiles Admin",
      email: "admin@brothermobiles.com",
      phone: "0300-0000000",
      role: "admin",
      createdAt: new Date().toISOString(),
      status: "active",
    };

    const updateFullList = () => {
      const combined = [adminUser, ...invList, ...resList];
      setUsersList(combined);
      setLoading(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("bm_cached_users", JSON.stringify(combined));
      }
    };

    const unsubInv = onSnapshot(collection(db, "investors"), (snap) => {
      invList = snap.docs.map((d: any) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.fullName || data.name || "Investor",
          email: data.email || "",
          phone: data.phone || "",
          role: "investor",
          cnic: data.cnic || "",
          sharingRatio: data.sharingRatio || 50,
          totalInvestment: data.totalInvestment || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || "active",
        };
      });
      updateFullList();
    });

    const unsubRes = onSnapshot(collection(db, "resellers"), (snap) => {
      resList = snap.docs.map((d: any) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.fullName || data.name || "Reseller",
          email: data.email || "",
          phone: data.phone || "",
          role: "reseller",
          totalCommission: data.totalCommission || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || "active",
        };
      });
      updateFullList();
    });

    return () => {
      unsubInv();
      unsubRes();
    };
  }, []);"""

if old_effect in text:
    text = text.replace(old_effect, new_effect)
    with open("src/app/dashboard/users/page.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Users page realtime sync enabled!")
else:
    print("WARNING: Users old_effect not found!")

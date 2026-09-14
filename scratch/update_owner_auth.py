with open("src/hooks/use-auth.tsx", "r", encoding="utf-8") as f:
    text = f.read()

super_admin_const = 'const SUPER_ADMIN_UID = "EtIGZIxms6hrS5uR96fmxksjEDv1";\n'

if "SUPER_ADMIN_UID" not in text:
    text = super_admin_const + text

old_on_auth = """    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocPromise = getDoc(doc(db, "users", firebaseUser.uid));
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject("timeout"), 5000));
          const userDoc: any = await Promise.race([userDocPromise, timeoutPromise]).catch(() => null);

          if (userDoc && userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            setAppUser(userData);
            if (typeof window !== "undefined") {
              localStorage.setItem("bm_app_user", JSON.stringify(userData));
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }"""

new_on_auth = """    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Super Admin Owner UID check -> Always grant Full Admin Access
        if (firebaseUser.uid === SUPER_ADMIN_UID) {
          const ownerUser: AppUser = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "Gulshaan Khan (Owner)",
            email: firebaseUser.email || "gulshaankhan2@gmail.com",
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            guideSeen: true,
          };
          saveUserCache(ownerUser);
          setDoc(doc(db, "users", firebaseUser.uid), ownerUser, { merge: true }).catch(() => {});
          setLoading(false);
          return;
        }

        try {
          const userDocPromise = getDoc(doc(db, "users", firebaseUser.uid));
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject("timeout"), 5000));
          const userDoc: any = await Promise.race([userDocPromise, timeoutPromise]).catch(() => null);

          if (userDoc && userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            saveUserCache(userData);
          } else {
            saveUserCache({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Admin User",
              email: firebaseUser.email || "",
              role: "admin",
              status: "active",
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              guideSeen: true,
            });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }"""

if old_on_auth in text:
    text = text.replace(old_on_auth, new_on_auth)

old_signin = """      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userDocPromise = getDoc(doc(db, "users", result.user.uid));"""

new_signin = """      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (result.user.uid === SUPER_ADMIN_UID) {
          const ownerUser: AppUser = {
            uid: result.user.uid,
            name: result.user.displayName || "Gulshaan Khan (Owner)",
            email: result.user.email || email,
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            guideSeen: true,
          };
          saveUserCache(ownerUser);
          setDoc(doc(db, "users", result.user.uid), ownerUser, { merge: true }).catch(() => {});
          setLoading(false);
          return;
        }
        const userDocPromise = getDoc(doc(db, "users", result.user.uid));"""

if old_signin in text:
    text = text.replace(old_signin, new_signin)

with open("src/hooks/use-auth.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Super Admin Owner UID authorization added cleanly!")

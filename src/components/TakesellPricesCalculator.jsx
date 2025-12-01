import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from "firebase/firestore";

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";

import toast, { Toaster } from "react-hot-toast";
import packageJson from "../../package.json";

export default function TakesellPricesCalculator() {
  const [copied, setCopied] = useState(false); // Copy Button state
  const [isRotating, setIsRotating] = useState(false); // Reset Button state
  const [tooltipVisible, setTooltipVisible] = useState({}); //  Tooltip Auto Hider state
  const [resetLoading, setResetLoading] = useState(false); // Reset Link Sending Loading State

  const [fabrics, setFabrics] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [priceMode, setPriceMode] = useState("retail");
  const [quantities, setQuantities] = useState({});
  const [showAll, setShowAll] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false); // Add Modal
  const [showEditModal, setShowEditModal] = useState(false); // Edit Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Delete Modal

    // ---------------- AUTH SYSTEM Start ----------------
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState("");

      // --- Tooltip Component Start ---
    function Tooltip({ text, children }) {
      return (
        <div className="relative group inline-block">
          {children}

          <div className="
            absolute left-1/2 -translate-x-1/2 -top-10 
            hidden group-hover:flex flex-col
            bg-gray-800 text-white text-xs px-2 py-1 rounded
            shadow-lg whitespace-nowrap z-50
            transition-all duration-200 opacity-0 group-hover:opacity-100
          ">
            {text}
          </div>
        </div>
      );
    }

    function formatTimestamp(ts) {
      if (!ts) return "";

      const d = ts.toDate();

      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2); // last 2 digits

      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";

      hours = hours % 12 || 12;
      hours = String(hours).padStart(2, "0");

      return `${day}/${month}/${year} – ${hours}:${minutes} ${ampm}`;
    }

    // --- Tooltip Component End ---

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      // Firestore থেকে fullName fetch করা
      const q = query(
        collection(db, "users"),
        where("uid", "==", currentUser.uid)
      );
      const snapshot = await getDocs(q);

      let fullName = currentUser.email; // default
      if (!snapshot.empty) {
        fullName = snapshot.docs[0].data().fullName;
      }

      setUser({
        email: currentUser.email,
        fullName: fullName,
      });
    } else {
      setUser(null);
    }
  });

  return () => unsubscribe();
}, []);

    /* ---------------- Auth Functions Start ---------------- */
  const handleAuthAction = async () => {
    setAuthError("");
    try {
      if (authMode === "signup") {
        // await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        // toast.success("Account created successfully!");
        toast.error(
          <span className="text-center">
            প্লিজ <br /> মডারেটর হিসেবে{" "}
            <span className="text-xl text-green-600">SIGNUP</span> করার জন্য{" "}
            <br /> এডমিন এর সাথে যোগাযোগ করুন। <br /> ধন্যবাদ
          </span>
        );
      } else {
        let emailToUse = authEmail;

        // If input is username, then find email
        if (!authEmail.includes("@")) {
          const q = query(
            collection(db, "users"),
            where("username", "==", authEmail)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            emailToUse = snapshot.docs[0].data().email;
          }
        }

        await signInWithEmailAndPassword(auth, emailToUse, authPassword);
        toast.success("Logged in successfully!");
      }

      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
    } catch (error) {
      setAuthError(error.message);
      toast.error("Authentication failed!");
    }
  };

  /* ---------------- Auth Functions End ---------------- */
    // Forgot Password Start
  const handleForgotPassword = async () => {
    if (!authEmail) {
      toast.error("Please enter your email or username first");
      return;
    }

    setResetLoading(true);  // ⬅️ ADD THIS (loading start)

    let emailToUse = authEmail;

    if (!authEmail.includes("@")) {
      const q = query(collection(db, "users"), where("username", "==", authEmail));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setResetLoading(false); // ⬅️ stop
        toast.error("Username not found");
        return;
      }

      emailToUse = snapshot.docs[0].data().email;
    }

    if (authEmail.includes("@")) {
      const q = query(collection(db, "users"), where("email", "==", authEmail));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setResetLoading(false); // ⬅️ stop
        toast.error("No account found with this email");
        return;
      }
    }

    try {
      await sendPasswordResetEmail(auth, emailToUse);
      toast.success("Password reset link sent to your email!");
    } catch (err) {
      toast.error("Too many reset requests. Try again later.");
    }

    setResetLoading(false); // ⬅️ ADD THIS (loading end)
  };
  // Forgot Password End

  // ---------------- Logout Functions Start ----------------
  const handleLogout = async () => {
    await signOut(auth);
    toast("Logged out successfully!", { icon: "👋" });
  }; 
  // ---------------- Logout Functions End ----------------

    const handleReset = () => {
    setQuantities({});            // Qty is Reset
    toast.success("All values have been reset!");
    setIsRotating(true);          // Rotate Reset Icon
    setTimeout(() => setIsRotating(false), 600); // 0.6 Second
  }; // ---------------- Reset Button End ----------------



  const products = [
    { key: "sofa", label: "Sofa Cover" },
    { key: "corner", label: "Corner Cover" },
    { key: "chair", label: "Chair Cover" },
    { key: "table", label: "T-Table Cover" },
    { key: "cushion_16_16", label: "Cushion 16×16" },
    { key: "cushion_18_18", label: "Cushion 18×18" },
    { key: "cushion_20_20", label: "Cushion 20×20" },
    { key: "cushion_24_24", label: "Cushion 24×24" },
    { key: "cushion_30_30", label: "Cushion 30×30" },
    { key: "bed", label: "Bed Cover" },
    { key: "dining", label: "Dining Table Cover" },
    { key: "tul", label: "Tul/Mora Cover" },
    { key: "box", label: "Box Cover" },
    { key: "tv", label: "TV Cover" },
    { key: "ac", label: "AC Cover" },
    { key: "foam", label: "Foam Cover" },
    { key: "divan", label: "Divan Cover" },
  ];

  const emptyPrices = products.reduce((acc, p) => {
    acc[p.key] = { retail: 0, wholesale: 0 };
    return acc;
  }, {});
  const [formValues, setFormValues] = useState({
    name: "",
    prices: { ...emptyPrices },
  });

  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "fabrics"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFabrics(data);
      if (data.length === 0) setSelectedIndex(0);
      else if (selectedIndex >= data.length)
        setSelectedIndex(data.length - 1);
    });
    return unsub;
  }, []);

  const selectedFabric = fabrics[selectedIndex] || null;

  async function updatePrice(product, field, value) {
    if (!selectedFabric) return;
    const parsed = parseFloat(value);
    const sanitized = Number.isNaN(parsed) ? 0 : parsed;
    const updatedPrices = {
      ...selectedFabric.prices,
      [product]: {
        ...selectedFabric.prices?.[product],
        [field]: sanitized,
      },
    };
    await updateDoc(doc(db, "fabrics", selectedFabric.id), {
      prices: updatedPrices,
    });
    setFabrics((old) =>
      old.map((f, i) =>
        i === selectedIndex ? { ...f, prices: updatedPrices } : f
      )
    );
  }

  function updateQuantity(product, value) {
    const parsed = parseInt(value, 10);
    setQuantities((q) => ({
      ...q,
      [product]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  }

  function openAddModal() {
    setFormValues({ name: "", prices: { ...emptyPrices } });
    setShowAddModal(true);
  }

  async function saveNewFabric() {
    const name = (formValues.name || "").trim();
    if (!name) {
      toast.error("Please provide a fabric name.");
      return;
    }
    const prices = {};
    for (const k of Object.keys(formValues.prices)) {
      prices[k] = {
        retail: Number(formValues.prices[k].retail) || 0,
        wholesale: Number(formValues.prices[k].wholesale) || 0,
      };
    }
    await addDoc(collection(db, "fabrics"), { name, prices });
    toast.success("Fabric added successfully!");
    setShowAddModal(false);
    setFormValues({ name: "", prices: { ...emptyPrices } });
    setTimeout(() => {
      setSelectedIndex((prev) => Math.max(0, fabrics.length));
    }, 300);
  }

  function openEditModal() {
    if (!selectedFabric) return;
    const clonePrices = {};
    for (const k of Object.keys(emptyPrices)) {
      clonePrices[k] = {
        retail: selectedFabric.prices?.[k]?.retail ?? 0,
        wholesale: selectedFabric.prices?.[k]?.wholesale ?? 0,
      };
    }
    setFormValues({ name: selectedFabric.name, prices: clonePrices });
    setShowEditModal(true);
  }

  // Fabrics Update Section Start

  // Get User Fullname from Users collection function
  async function getLoggedInUserFullName() {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return "Unknown";

    const q = query(collection(db, "users"), where("email", "==", userEmail));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data().fullName || "Unknown"; // <-- fullName used here
    }

    return "Unknown";
  }

  async function saveEditFabric() {
    if (!selectedFabric) return;

    const name = (formValues.name || "").trim();
    if (!name) {
      toast.error("Fabric name cannot be empty.");
      return;
    }

    const userName = await getLoggedInUserFullName();
    const now = new Date();

    const prices = {};

    for (const key of Object.keys(formValues.prices)) {
      const oldItem = selectedFabric.prices[key] || {};
      const newRetail = Number(formValues.prices[key].retail) || 0;
      const newWholesale = Number(formValues.prices[key].wholesale) || 0;

      const oldRetail = oldItem.retail ?? 0;
      const oldWholesale = oldItem.wholesale ?? 0;

      prices[key] = {
        retail: newRetail,
        wholesale: newWholesale,

        // 🔥 Retail changed?
        ...(newRetail !== oldRetail
          ? {
              retailUpdatedBy: userName,
              retailUpdatedAt: now,
            }
          : {
              retailUpdatedBy: oldItem.retailUpdatedBy || null,
              retailUpdatedAt: oldItem.retailUpdatedAt || null,
            }),

        // 🔥 Wholesale changed?
        ...(newWholesale !== oldWholesale
          ? {
              wholesaleUpdatedBy: userName,
              wholesaleUpdatedAt: now,
            }
          : {
              wholesaleUpdatedBy: oldItem.wholesaleUpdatedBy || null,
              wholesaleUpdatedAt: oldItem.wholesaleUpdatedAt || null,
            }),
      };
    }

    await updateDoc(doc(db, "fabrics", selectedFabric.id), { name, prices });
    toast.success("Fabric updated successfully!");
    setShowEditModal(false);
  }

  // Fabrics Update Section End

  function openDeleteModal() {
    setDeletePasswordInput("");
    setDeleteError("");
    setShowDeleteModal(true);
  }

  async function confirmDeleteFabric() {
    if (!selectedFabric) return;
    if (deletePasswordInput !== selectedFabric.name) {
      setDeleteError("Password does not match the fabric full name.");
      return;
    }
    await deleteDoc(doc(db, "fabrics", selectedFabric.id));
    toast.success("Fabric deleted successfully!");
    setShowDeleteModal(false);
    setFabrics((old) => old.filter((_, i) => i !== selectedIndex));
    setSelectedIndex((s) => Math.max(0, s - 1));
  }

  function productTotal(productKey) {
    const price = selectedFabric?.prices?.[productKey]?.[priceMode] || 0;
    const qty = quantities[productKey] || 0;
    return price * qty;
  }

  const grandTotal = products.reduce((s, p) => s + productTotal(p.key), 0);
  const visibleProducts = showAll ? products : products.slice(0, 4);

  if (!selectedFabric)
    return (
      <div className="text-center mt-10 text-gray-600">
        {/* Loading Screen Animation */}
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100 z-50">
          {/* Main Title */}
          <span className="text-xl font-extrabold text-green-600 animate-bounce mb-2">
            FABRICS PRICING TOOL
          </span>

          {/* Subtitle */}
          <span className="text-xl font-semibold text-gray-300 rotate-6 animate-pulse mb-2">
            BY
          </span>

          {/* Author Name */}
          <span className="text-2xl font-bold text-blue-400 animate-pulse">
            MD OBAYDULLAH
          </span>

          {/* Spinner */}
          <br/>
          <div className="w-10 h-10 border-2 border-blue-200 border-t-transparent rounded-full animate-spin mb-4"></div>
            {/* Version at bottom center */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-400 text-sm">
            Version v{packageJson.version}
          </div>
        </div>
      </div>
    );

    // Profit Calculate Start
    function productProfit(productKey) {
      const retail = selectedFabric?.prices?.[productKey]?.retail || 0;
      const wholesale = selectedFabric?.prices?.[productKey]?.wholesale || 0;
      return retail - wholesale;
    }

    function totalProfit() {
      return products.reduce((sum, p) => {
        const qty = quantities[p.key] || 0;
        const profitPerUnit = productProfit(p.key);
        return sum + profitPerUnit * qty;
      }, 0);
    } // Profit Calculate End

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <h1 className="text-2xl text-center text-gray-500 font-bold mb-4">TAKESELL PRICING TOOL</h1>

                {/* ---------- Auth Section Start ---------- */}
          <div className="mb-3 flex items-center justify-between">
            {user ? (
              <>
                <div className="text-sm text-green-600 font-semibold">
                  Welcome, <span className="text-green-700">{user?.fullName || user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 active:translate-y-[0.5px] transition-all duration-200"
              >
                Login / Signup
              </button>
            )}
          </div> {/* ---------- Auth Section End ---------- */}


      <div className="flex gap-4 flex-col md:flex-row items-start">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700">
            Select Fabric
          </label>
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="mt-2 w-full p-2 border rounded"
          >
            {fabrics.map((f, i) => (
              <option key={f.id || f.name} value={i}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Replaced quick input with three buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* ---------- Add Edit Delete Button With Login Condition Start---------- */}
            <button
              onClick={user ? openAddModal : () => toast.error(<span>Please login to <span className="text-green-700 font-semibold">Add</span> a fabric.</span>)}
              
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add
            </button>
            <button
              onClick={user ? openEditModal : () => toast.error(<span>Please login to <span className="text-blue-700 font-semibold">Edit</span> this fabric.</span>)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!selectedFabric}
            >
              Edit
            </button>
            <button
              onClick={user ? openDeleteModal : () => toast.error(<span>Please login to <span className="text-red-700 font-semibold">Delete</span> this fabric.</span>)}
              className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={fabrics.length === 1}
            >
              Delete
            </button> {/* ---------- Add Edit Delete Button With Login Condition End ---------- */}

          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">Price Mode</label>
            <div className="mt-2 flex gap-2 items-center">
              <button
                onClick={() => setPriceMode("retail")}
                className={`px-3 py-2 rounded ${
                  priceMode === "retail" ? "bg-green-600 text-white" : "border"
                }`}
              >
                Retail
              </button>
              <button
                onClick={() => setPriceMode("wholesale")}
                className={`px-3 py-2 rounded ${
                  priceMode === "wholesale" ? "bg-green-600 text-white" : "border"
                }`}
              >
                Wholesale
              </button>

              {/* --- Grand Total Sidebar --- */}
              <div className="ml-auto text-right">
                <div className="text-xs text-gray-500">Grand Total</div>
                <div className="font-bold text-lg">
                  Tk {grandTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>


          {/* --- Itemized Breakdown --- */}
          {products.some((p) => (quantities[p.key] || 0) > 0) && (
            <div className="mt-4 border-t border-gray-200 pt-2 relative">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-semibold text-gray-700">
                  Itemized Price Summary
                </h4>

                {/* --- Copy Button --- */}
                <button
                  onClick={() => {
                    const lines = [];
                    let totalSum = 0;
                    let activeCount = 0;

                    products.forEach((p) => {
                      const qty = quantities[p.key] || 0;
                      if (qty === 0) return;

                      activeCount++;
                      const price = selectedFabric.prices?.[p.key]?.[priceMode] || 0;
                      const total = price * qty;
                      totalSum += total;

                      const unitLabel =
                        p.key === "sofa"
                          ? qty === 1
                            ? "Seat"
                            : "Seats"
                          : qty === 1
                          ? "Pc"
                          : "Pcs";

                      lines.push(
                        `${selectedFabric.name} ${p.label} ${qty} ${unitLabel} = Tk ${total.toLocaleString()}`
                      );
                    });

                    if (activeCount > 1) {
                      lines.push(`Total Price = Tk ${totalSum.toLocaleString()}`);
                    }

                    navigator.clipboard.writeText(lines.join("\n"));
                    toast.success("Copied to clipboard!");

                    // ✓ icon animation
                    setCopied(true);
                    setTimeout(() => setCopied(false), 5000); // Show ⧉ Icon After 5 Second 
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border text-gray-600"
                >
                  {copied ? "✓ Copied" : "⧉ Copy"}
                </button>

              </div>

              <div className="max-h-40 overflow-auto text-sm">
                {(() => {
                  const activeItems = products.filter(
                    (p) => (quantities[p.key] || 0) > 0
                  );

                  return (
                    <>
                      {activeItems.map((p) => {
                        const qty = quantities[p.key] || 0;
                        const price = selectedFabric.prices?.[p.key]?.[priceMode] || 0;
                        const total = price * qty;

                        const unitLabel =
                          p.key === "sofa"
                            ? qty === 1
                              ? "Seat"
                              : "Seats"
                            : qty === 1
                            ? "Pc"
                            : "Pcs";

                        return (
                          <div key={p.key}
                               onClick={() => {
                                  setQuantities((prev) => ({ ...prev, [p.key]: 0 }));
                                  toast.success(`${selectedFabric.name} ${p.label} removed!`);
                                }}
                               className="flex justify-between items-center mb-1 cursor-pointer rounded transition-colors duration-200 hover:bg-red-100 hover:text-red-600"
                               >
                            <span>
                              {selectedFabric.name} {p.label} {qty} {unitLabel}
                            </span>
                            <span className="font-medium text-gray-700">
                              Tk {total.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}

                      {/* --- Grand Total: show only if more than 1 item --- */}

                      {activeItems.length > 1 && (
                        <div
                          className="flex justify-between border-t border-gray-300 mt-2 pt-1 font-semibold text-blue-900 cursor-pointer"
                          onClick={() => {
                            //  Calculate the total price
                            const total = activeItems.reduce((sum, p) => {
                              const qty = quantities[p.key] || 0;
                              const price = selectedFabric.prices?.[p.key]?.[priceMode] || 0;
                              return sum + qty * price;
                            }, 0);

                            // Copy only Total Price Line
                            navigator.clipboard.writeText(`Total Price = Tk ${total.toLocaleString()}`);
                            toast.success("Total Price copied!");
                          }}
                        >
                          <span>Total Price</span>
                          <span>
                            Tk{" "}
                            {activeItems
                              .reduce((sum, p) => {
                                const qty = quantities[p.key] || 0;
                                const price = selectedFabric.prices?.[p.key]?.[priceMode] || 0;
                                return sum + qty * price;
                              }, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      )}

                      {priceMode === "retail" && (
                        <p className="flex justify-between border-t border-gray-300 mt-2 pt-1 font-semibold text-green-900">
                          <span>Total Profit</span> <span>Tk {totalProfit().toLocaleString()}</span>
                        </p>
                      )}

                    </>
                  );
                })()}
              </div>
            </div>
          )}

        </div>

        {/* Main Section */}
        <div className="flex-1 bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-3 flex items-center justify-between">
            <span>
              Prices for:{" "}
              <span className="text-indigo-600">{selectedFabric.name}</span>
            </span>

            {/* --- Reset Qty Button --- */}

            <button
              onClick={handleReset}
              disabled={Object.keys(quantities).length === 0}
              className={`${Object.keys(quantities).length === 0 ? "opacity-50 pointer-events-none text-sm px-3 py-1 bg-gray-100" 
                  : "text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 active:scale-95 transition"
                }`}
            >
              <i
                className={`fa-solid fa-rotate-right text-blue-900 transition-transform duration-500 ${
                  isRotating ? "animate-spin" : ""
                }`}
              ></i> <span className="text-blue-900" >Reset</span>
            </button>

          </h2>


          <div className="space-y-4">
            {visibleProducts.map((p) => (
              <div
                key={p.key}
                className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center"
              >
                <div className="md:col-span-2 font-medium">{p.label}</div>

                <div className="flex gap-2 items-center md:col-span-2">
                  <div className="flex-1">

                    {/* --- Retail Tooltip Start --- */}
                    <div
                      className="relative group w-fit"
                      onMouseEnter={() => {
                        setTooltipVisible(prev => ({
                          ...prev,
                          [p.key]: { ...prev[p.key], retail: true }
                        }));

                        clearTimeout(window[`tooltipTimer_${p.key}_retail`]);
                        window[`tooltipTimer_${p.key}_retail`] = setTimeout(() => {
                          setTooltipVisible(prev => ({
                            ...prev,
                            [p.key]: { ...prev[p.key], retail: false }
                          }));
                        }, 1200);
                      }}
                      onMouseLeave={() => {
                        clearTimeout(window[`tooltipTimer_${p.key}_retail`]);
                        window[`tooltipTimer_${p.key}_retail`] = setTimeout(() => {
                          setTooltipVisible(prev => ({
                            ...prev,
                            [p.key]: { ...prev[p.key], retail: false }
                          }));
                        }, 0);
                      }}
                    >
                      <label
                        className="text-xs cursor-pointer"
                        aria-label={`Retail price updated by ${selectedFabric.prices[p.key]?.retailUpdatedBy}`}
                      >
                        Retail (Tk)
                      </label>

                      {selectedFabric.prices[p.key]?.retailUpdatedBy && (
                        <div
                          className={`
                            absolute left-1/2 -translate-x-1/2 -top-10
                            bg-white text-gray-500 px-3 py-1 rounded text-xs shadow
                            pointer-events-none whitespace-nowrap text-center
                            transition-all duration-300 ease-out
                            ${
                              tooltipVisible[p.key]?.retail
                                ? "opacity-100 scale-100 translate-y-0"
                                : "opacity-0 scale-95 translate-y-2"
                            }
                          `}
                        >
                          <span className="font-semibold">Updated :</span> {selectedFabric.prices[p.key].retailUpdatedBy} <br />
                          <span className="text-gray-400"> {formatTimestamp(selectedFabric.prices[p.key].retailUpdatedAt)} </span>
                        </div>
                      )}
                    </div>
                    {/* --- Retail Tooltip End --- */}

                    <input
                      type="number"
                      value={selectedFabric.prices[p.key]?.retail ?? 0}
                      onChange={(e) =>
                        updatePrice(p.key, "retail", e.target.value)
                      }
                      className="w-full p-2 border rounded"
                      disabled
                    />
                    
                  </div>

                  <div className="flex-1">

                    {/* --- Wholesale Tooltip Start --- */}
                    <div
                      className="relative group w-fit"
                      onMouseEnter={() => {
                        setTooltipVisible(prev => ({
                          ...prev,
                          [p.key]: { ...prev[p.key], wholesale: true }
                        }));

                        clearTimeout(window[`tooltipTimer_${p.key}_wholesale`]);
                        window[`tooltipTimer_${p.key}_wholesale`] = setTimeout(() => {
                          setTooltipVisible(prev => ({
                            ...prev,
                            [p.key]: { ...prev[p.key], wholesale: false }
                          }));
                        }, 1200);
                      }}
                      onMouseLeave={() => {
                        clearTimeout(window[`tooltipTimer_${p.key}_wholesale`]);
                        window[`tooltipTimer_${p.key}_wholesale`] = setTimeout(() => {
                          setTooltipVisible(prev => ({
                            ...prev,
                            [p.key]: { ...prev[p.key], wholesale: false }
                          }));
                        }, 100);
                      }}
                    >
                      <label
                        className="text-xs cursor-pointer"
                        aria-label={`Wholesale price updated by ${selectedFabric.prices[p.key]?.wholesaleUpdatedBy}`}
                      >
                        Wholesale (Tk)
                      </label>

                      {selectedFabric.prices[p.key]?.wholesaleUpdatedBy && (
                        <div
                          className={`
                            absolute left-1/2 -translate-x-1/2 -top-10
                            bg-white text-gray-500 px-3 py-1 rounded text-xs shadow
                            pointer-events-none whitespace-nowrap text-center
                            transition-all duration-300 ease-out
                            ${
                              tooltipVisible[p.key]?.wholesale
                                ? "opacity-100 scale-100 translate-y-0"
                                : "opacity-0 scale-95 translate-y-2"
                            }
                          `}
                        >
                          <span className="font-semibold">Updated :</span> {selectedFabric.prices[p.key].wholesaleUpdatedBy} <br/>
                          <span className="text-gray-400">{formatTimestamp(selectedFabric.prices[p.key].wholesaleUpdatedAt)}</span>
                        </div>
                      )}
                    </div>
                    {/* --- Wholesale Tooltip End --- */}

                    <input
                      type="number"
                      value={selectedFabric.prices[p.key]?.wholesale ?? 0}
                      onChange={(e) =>
                        updatePrice(p.key, "wholesale", e.target.value)
                      }
                      className="w-full p-2 border rounded"
                      disabled
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs">Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={quantities[p.key] || ""}
                    onChange={(e) => updateQuantity(p.key, e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="md:col-span-1 text-right font-semibold">
                  Tk {productTotal(p.key).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {products.length > 4 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll((p) => !p)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                {showAll ? "Hide Extra Items" : "Show More Items"}
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-white rounded shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Selected price mode</div>
              <div className="font-bold text-xl">
                {priceMode === "retail" ? "Retail" : "Wholesale"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">Grand Total</div>
              <div className="font-bold text-2xl">
                Tk {grandTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-10 border-t border-gray-200 bg-gray-50 text-center py-4 text-sm text-gray-600">
        <p>
          © {new Date().getFullYear()} | Developed by{" "}
          <span className="font-semibold text-gray-800"><a href="https://www.facebook.com/obaydullah.obaydullah.3">MD Obaydullah</a></span>
        </p>
        <div className="mt-2 flex justify-center space-x-4 text-gray-500">
          <a
            href="https://github.com/devobaydullah94"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 transition-colors"
          >
          <i className="fa-brands fa-github" style={{ margin: "0 5px" }}></i>
            GitHub
          </a>
          <a
            href="https://www.facebook.com/obaydullah.obaydullah.3"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 transition-colors"
          >
          <i className="fa-brands fa-facebook" style={{ margin: "0 5px" }}></i>
            Facebook
          </a>
          <a
            href="https://devobaydullah.netlify.app"
            target="_blank"
            className="hover:text-gray-800 transition-colors"
            rel="noreferrer"
          >
          <i className="fa-solid fa-laptop-code" style={{ margin: "0 5px" }}></i>
            Portfolio
          </a>
          <a
            href="https://creatario.net"
            target="_blank"
            className="hover:text-gray-800 transition-colors"
            rel="noreferrer"
          >
          <i className="fa-solid fa-globe" style={{ margin: "0 5px" }}></i>
            Website
          </a>
        </div>
      </footer>

      <Toaster position="top-center" reverseOrder={false} />

      {/* ---------------- Add Modal ---------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Add New Fabric</h3>

            <label className="block text-sm mb-1">Fabric Name</label>
            <input
              value={formValues.name}
              onChange={(e) =>
                setFormValues({ ...formValues, name: e.target.value })
              }
              className="w-full p-2 border rounded mb-4"
            />

            {/* Table heading */}
            <div className="grid grid-cols-3 font-semibold text-gray-700 border-b pb-1 mb-2">
              <div>Fabric Item</div>
              <div className="text-center">Retail (Tk)</div>
              <div className="text-center">Wholesale (Tk)</div>
            </div>

            <div className="max-h-72 overflow-auto space-y-3">
              {products.map((p) => (
                <div
                  key={p.key}
                  className="grid grid-cols-3 gap-2 items-center"
                >
                  <div className="font-medium">{p.label}</div>
                  <input
                    type="number"
                    placeholder="Retail"
                    value={formValues.prices[p.key].retail}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        prices: {
                          ...formValues.prices,
                          [p.key]: {
                            ...formValues.prices[p.key],
                            retail: e.target.value,
                          },
                        },
                      })
                    }
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Wholesale"
                    value={formValues.prices[p.key].wholesale}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        prices: {
                          ...formValues.prices,
                          [p.key]: {
                            ...formValues.prices[p.key],
                            wholesale: e.target.value,
                          },
                        },
                      })
                    }
                    className="p-2 border rounded"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={saveNewFabric}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Fabric
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Edit Modal ---------------- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Edit Fabric</h3>

            <label className="block text-sm mb-1">Fabric Name</label>
            <input
              value={formValues.name}
              onChange={(e) =>
                setFormValues({ ...formValues, name: e.target.value })
              }
              className="w-full p-2 border rounded mb-4"
            />

            {/* Table heading */}
            <div className="grid grid-cols-3 font-semibold text-gray-700 border-b pb-1 mb-2">
              <div>Fabric Item</div>
              <div className="text-center">Retail (Tk)</div>
              <div className="text-center">Wholesale (Tk)</div>
            </div>

            <div className="max-h-72 overflow-auto space-y-3">
              {products.map((p) => (
                <div
                  key={p.key}
                  className="grid grid-cols-3 gap-2 items-center"
                >
                  <div className="font-medium">{p.label}</div>
                  <input
                    type="number"
                    placeholder="Retail"
                    value={formValues.prices[p.key].retail}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        prices: {
                          ...formValues.prices,
                          [p.key]: {
                            ...formValues.prices[p.key],
                            retail: e.target.value,
                          },
                        },
                      })
                    }
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Wholesale"
                    value={formValues.prices[p.key].wholesale}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        prices: {
                          ...formValues.prices,
                          [p.key]: {
                            ...formValues.prices[p.key],
                            wholesale: e.target.value,
                          },
                        },
                      })
                    }
                    className="p-2 border rounded"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={saveEditFabric}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Delete Modal ---------------- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2 text-red-700">
              Delete Fabric: {selectedFabric.name}
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Type the full fabric name to confirm deletion:
            </p>
            <input
              type="text"
              value={deletePasswordInput}
              onChange={(e) => setDeletePasswordInput(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="Enter fabric name"
            />
            {deleteError && (
              <p className="text-sm text-red-600 mb-2">{deleteError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFabric}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

          {/* ---------- Login / Signup Modal Start ---------- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-sm p-6 rounded-lg shadow-lg relative">
            <h2 className="text-xl font-semibold mb-3 text-center">
              {authMode === "login" ? "Login" : "Sign Up"}
            </h2>

            <input
              type="text"
              placeholder={authMode === "login" ? "Username or Email" : "Email"}
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />

            {authError && (
              <p className="text-sm text-red-600 mb-2">{authError}</p>
            )}

          <div className="flex justify-between items-center mt-2">
            {/* Login/Signup Button*/}
            <button
              onClick={handleAuthAction}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {authMode === "login" ? "Login" : "Sign Up"}
            </button>

            <div className="flex flex-col items-end">
              {/* Login/Signup Toggle Button*/}
              <button
                onClick={() =>
                  setAuthMode(authMode === "login" ? "signup" : "login")
                }
                className="text-sm text-blue-600"
              >
                {authMode === "login" ? (
                  "Create new account"
                ) : (
                  <>
                    Already have account?{" "}
                    <span className="text-green-600 font-semibold hover:text-green-900">
                      Login
                    </span>
                  </>
                )}
              </button>
              
              {/* Forgot Password Button*/}
              {authMode === "login" && (
                <button
                  onClick={handleForgotPassword}
                  className="text-xs text-red-500 hover:text-red-900 mt-1"
                >
                  {resetLoading ? "Reset Link Sending" : "Forgot Password?"}
                </button>
              )}
            </div>
          </div>
          {/* Close Button */}
          <button
            onClick={() => setShowAuthModal(false)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center 
                      bg-gray-200 hover:bg-red-500 hover:text-white text-gray-700 
                      rounded-full shadow-md transition"
          >
            ✕
          </button>

          </div>
        </div>
      )}
          {/* ---------- Login / Signup Modal End ---------- */}

    </div>
  );
}

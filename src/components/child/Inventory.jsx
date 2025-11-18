// "use client";

// import { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";
// import axios from "axios";
// import {
//   Button,
//   Modal,
//   Form,
//   Table,
//   Alert,
//   Spinner,
//   Card,
// } from "react-bootstrap";
// import { Dumbbell, Cog, Weight, Activity, Box } from "lucide-react";

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// export default function Inventory() {
//   const { getToken, isLoaded } = useAuth();

//   const [gymCode, setGymCode] = useState("");
//   const [items, setItems] = useState([]);
//   const [summary, setSummary] = useState({
//     dumbbell: 0,
//     weight: 0,
//     machine: 0,
//     treadmill: 0,
//     other: 0,
//   });

//   const [loading, setLoading] = useState(false);
//   const [alert, setAlert] = useState({ type: "", message: "" });
//   const [showAdd, setShowAdd] = useState(false);

//   // 👉 NEW — For category image modal
//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState("");

//   // Add Item Form
//   const [form, setForm] = useState({
//     itemName: "",
//     category: "",
//     quantity: "",
//     status: "Available",
//   });

//   // 👉 IMAGE COLLECTION FOR EACH CATEGORY
//   // DYNAMIC IMAGES FROM PUBLIC FOLDER
//   const categoryImages = {
//     dumbbell: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
//     weight: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
//     machine: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
//     treadmill: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
//     other: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
//   };

//   // Load gym
//   useEffect(() => {
//     const loadGym = async () => {
//       if (!isLoaded) return;

//       try {
//         const token = await getToken();
//         const res = await axios.get(`${API_BASE}/api/gym/my-gym`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const code = res.data?.gym?.gymCode;
//         if (code) {
//           setGymCode(code);
//           fetchInventory(code);
//         }
//       } catch {
//         setAlert({ type: "danger", message: "Failed to load gym details." });
//       }
//     };

//     loadGym();
//   }, [isLoaded, getToken]);

//   // Fetch inventory
//   const fetchInventory = async (code = gymCode) => {
//     try {
//       setLoading(true);
//       const res = await axios.get(`${API_BASE}/api/inventory/by-gym`, {
//         params: { gymCode: code },
//       });

//       const list = res.data.items || [];
//       setItems(list);

//       const totals = {
//         dumbbell: 0,
//         weight: 0,
//         machine: 0,
//         treadmill: 0,
//         other: 0,
//       };
//       list.forEach((i) => {
//         totals[i.category] += Number(i.quantity);
//       });

//       setSummary(totals);
//     } catch (err) {
//       setAlert({ type: "danger", message: "Failed to fetch inventory." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Add item
//   const saveItem = async () => {
//     if (!form.itemName || !form.category || !form.quantity) {
//       return setAlert({
//         type: "danger",
//         message: "Please fill all required fields.",
//       });
//     }

//     try {
//       setLoading(true);
//       await axios.post(`${API_BASE}/api/inventory`, {
//         ...form,
//         gymCode,
//       });

//       setShowAdd(false);
//       setForm({
//         itemName: "",
//         category: "",
//         quantity: "",
//         status: "Available",
//       });

//       fetchInventory();
//       setAlert({ type: "success", message: "Item added successfully." });
//     } catch (err) {
//       setAlert({ type: "danger", message: "Failed to add item." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Summary Icons
//   const iconMap = {
//     dumbbell: <Dumbbell size={28} />,
//     weight: <Weight size={28} />,
//     machine: <Cog size={28} />,
//     treadmill: <Activity size={28} />,
//     other: <Box size={28} />,
//   };

//   return (
//     <div className="container py-4">
//       {/* Page Header */}
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <div>
//           <h2 className="fw-bold">Inventory</h2>
//           <p className="text-muted mb-0">Manage gym equipment and items</p>
//         </div>
//         <Button size="lg" onClick={() => setShowAdd(true)}>
//           + Add Item
//         </Button>
//       </div>

//       {alert.message && <Alert variant={alert.type}>{alert.message}</Alert>}

//       {/* SUMMARY CARDS */}
//       {/* SUMMARY CARDS */}
//       <div className="row g-3 mb-4">
//         {Object.keys(summary).map((cat) => {
//           const bgColor =
//             cat === "dumbbell"
//               ? "#4C7EFF"
//               : cat === "weight"
//               ? "#34C759"
//               : cat === "machine"
//               ? "#AF52DE"
//               : cat === "treadmill"
//               ? "#FF9F0A"
//               : "#8E8E93";

//           return (
//             <div className="col-6 col-md-4 col-lg-3" key={cat}>
//               <Card
//                 className="summary-card p-3 shadow-sm"
//                 style={{
//                   background: "#ffffff", // default white
//                   borderRadius: "14px",
//                   cursor: "pointer",
//                   transition: "0.3s ease",
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.background = bgColor;
//                   e.currentTarget.style.color = "#fff";
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.background = "#ffffff";
//                   e.currentTarget.style.color = "#000";
//                 }}
//                 onClick={() => {
//                   setSelectedCategory(cat);
//                   setShowCategoryModal(true);
//                 }}
//               >
//                 <Card.Body className="text-center">
//                   <div
//                     className="mb-2 icon-container"
//                     style={{ transition: "0.3s" }}
//                   >
//                     {iconMap[cat]}
//                   </div>
//                   <h6 className="text-uppercase small mb-1">{cat}</h6>
//                   <h3 className="fw-bold">{summary[cat]}</h3>
//                 </Card.Body>
//               </Card>
//             </div>
//           );
//         })}
//       </div>

//       {/* IMAGE POPUP MODAL */}
//       {/* IMAGE POPUP MODAL */}
//       <Modal
//         show={showCategoryModal}
//         onHide={() => setShowCategoryModal(false)}
//         centered
//         size="lg"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>
//             {selectedCategory && selectedCategory.toUpperCase()} Gallery
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <div className="image-strip-container">
//             <div className="image-strip">
//               {categoryImages[selectedCategory]?.map((img, index) => (
//                 <img
//                   key={index}
//                   src={`/assets/images/inventory/${selectedCategory}/${img}`}
//                   className="strip-img"
//                 />
//               ))}

//               {/* Duplicate images to create infinite loop scrolling */}
//               {categoryImages[selectedCategory]?.map((img, index) => (
//                 <img
//                   key={`dup-${index}`}
//                   src={`/assets/images/inventory/${selectedCategory}/${img}`}
//                   className="strip-img"
//                 />
//               ))}
//             </div>
//           </div>
//         </Modal.Body>

//         <Modal.Footer>
//           <Button onClick={() => setShowCategoryModal(false)}>Close</Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Inventory Table */}
//       <div className="card shadow-sm border-0 rounded-4 mt-4">
//         <div className="card-body">
//           <h5 className="mb-3">Inventory List</h5>

//           <div className="table-responsive">
//             <Table hover>
//               <thead className="table-light">
//                 <tr>
//                   <th>Item Name</th>
//                   <th>Category</th>
//                   <th>Quantity</th>
//                   <th>Status</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {items.length === 0 && (
//                   <tr>
//                     <td colSpan={4} className="text-center text-muted py-4">
//                       No items found.
//                     </td>
//                   </tr>
//                 )}

//                 {items.map((i) => (
//                   <tr key={i._id}>
//                     <td>{i.itemName}</td>
//                     <td className="text-capitalize">{i.category}</td>
//                     <td>{i.quantity}</td>
//                     <td>
//                       <span
//                         className={`badge px-3 py-2 ${
//                           i.status === "Available"
//                             ? "bg-success"
//                             : i.status === "In Use"
//                             ? "bg-warning text-dark"
//                             : "bg-danger"
//                         }`}
//                       >
//                         {i.status}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           </div>
//         </div>
//       </div>

//       {/* ADD ITEM MODAL */}
//       <Modal show={showAdd} onHide={() => setShowAdd(false)} centered size="md">
//         <Modal.Header closeButton>
//           <Modal.Title>Add Inventory Item</Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <Form>
//             <Form.Group className="mb-3">
//               <Form.Label>Item Name</Form.Label>
//               <Form.Control
//                 placeholder="e.g., Dumbbell 2kg"
//                 value={form.itemName}
//                 onChange={(e) => setForm({ ...form, itemName: e.target.value })}
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Category</Form.Label>
//               <Form.Select
//                 value={form.category}
//                 onChange={(e) => setForm({ ...form, category: e.target.value })}
//               >
//                 <option value="">Select category</option>
//                 <option value="dumbbell">Dumbbell</option>
//                 <option value="weight">Weight Plate</option>
//                 <option value="machine">Machine</option>
//                 <option value="treadmill">Treadmill</option>
//                 <option value="other">Other</option>
//               </Form.Select>
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Quantity</Form.Label>
//               <Form.Control
//                 type="number"
//                 value={form.quantity}
//                 onChange={(e) => setForm({ ...form, quantity: e.target.value })}
//               />
//             </Form.Group>

//             <Form.Group>
//               <Form.Label>Status</Form.Label>
//               <Form.Select
//                 value={form.status}
//                 onChange={(e) => setForm({ ...form, status: e.target.value })}
//               >
//                 <option value="Available">Available</option>
//                 <option value="In Use">In Use</option>
//                 <option value="Damaged">Damaged</option>
//               </Form.Select>
//             </Form.Group>
//           </Form>
//         </Modal.Body>

//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowAdd(false)}>
//             Cancel
//           </Button>
//           <Button variant="primary" onClick={saveItem}>
//             Save Item
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// }

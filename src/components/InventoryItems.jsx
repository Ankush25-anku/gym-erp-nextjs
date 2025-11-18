"use client";

import { useState } from "react";
import { Modal, Button, Form, Table, Alert } from "react-bootstrap";
import axios from "axios";
import { FaPen, FaTrash } from "react-icons/fa";
import Papa from "papaparse";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function InventoryItems({ gymCode, items, fetchInventory }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    itemName: "",
    category: "",
    quantity: "",
    status: "Available",
    date: "", // ⭐ add this
  });

  const [editForm, setEditForm] = useState({
    _id: "",
    itemName: "",
    category: "",
    quantity: "",
    status: "Available",
    date: "", // ⭐ add this
  });

  // ======================================================
  // ADD ITEM
  // ======================================================
  const saveItem = async () => {
    if (!gymCode || gymCode.trim() === "") {
      return setAlert({
        type: "danger",
        message: "Gym not loaded. Please wait...",
      });
    }

    if (!form.itemName || !form.category || !form.quantity) {
      return setAlert({ type: "danger", message: "Fill all fields." });
    }

    try {
      setLoading(true);

      await axios.post(`${API_BASE}/api/inventory`, {
        ...form,
        gymCode,
      });

      setAlert({ type: "success", message: "Item added successfully." });
      setShowAdd(false);

      setForm({
        itemName: "",
        category: "",
        quantity: "",
        status: "Available",
      });

      fetchInventory(gymCode);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.response?.data?.message || "Failed to add item.",
      });
    }

    setLoading(false);
  };

  // ======================================================
  // OPEN EDIT MODAL
  // ======================================================
  const openEditModal = (item) => {
    setEditForm(item); // preload fields
    setShowEdit(true);
  };

  // ======================================================
  // UPDATE ITEM
  // ======================================================
  const updateItem = async () => {
    try {
      setLoading(true);

      await axios.put(`${API_BASE}/api/inventory/${editForm._id}`, editForm);

      setAlert({ type: "success", message: "Item updated successfully." });
      setShowEdit(false);

      fetchInventory(gymCode);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.response?.data?.message || "Failed to update item.",
      });
    }

    setLoading(false);
  };

  // ======================================================
  // DELETE ITEM
  // ======================================================
  const deleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete(`${API_BASE}/api/inventory/${id}`);

      setAlert({ type: "success", message: "Item deleted successfully." });

      fetchInventory(gymCode);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.response?.data?.message || "Failed to delete item.",
      });
    }
  };

  // ===============================
  // EXPORT CSV
  // ===============================
  const exportXLSX = () => {
    if (!items || items.length === 0) {
      return setAlert({ type: "danger", message: "No items to export." });
    }

    const worksheetData = [
      ["Gym Code", "Item Name", "Category", "Quantity", "Status", "Date"],

      ...items.map((i) => [
        i.gymCode + "   ", // ⭐ Pad Gym Code to auto-expand
        i.itemName + "        ", // ⭐ Pad Item Name for clean view
        i.category,
        i.quantity,
        i.status,
        i.date
          ? new Date(i.date).toLocaleDateString("en-GB").replace(/\//g, "-")
          : "",
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    // ⭐ AUTO COLUMN WIDTH FIX (full correct logic)
    const columnWidths = worksheetData[0].map((_, colIndex) => ({
      wch: Math.max(
        ...worksheetData.map((row) =>
          row[colIndex] ? row[colIndex].toString().length + 2 : 10
        )
      ),
    }));
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, "inventory_items.xlsx");
  };

  // ===============================
  // EXPORT PDF
  // ===============================
  const exportPDF = async () => {
    if (!items || items.length === 0) {
      return setAlert({ type: "danger", message: "No items to export." });
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 760;

    // Title
    page.drawText("Inventory Items Report", {
      x: 180,
      y,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 40;

    // Column positions
    const colX = {
      item: 30,
      category: 160,
      qty: 270,
      status: 330,
      date: 420, // ⭐ Added date column
    };

    // Header background
    page.drawRectangle({
      x: 20,
      y: y - 5,
      width: 560,
      height: 25,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Header text
    page.drawText("Item", { x: colX.item, y, size: 12, font });
    page.drawText("Category", { x: colX.category, y, size: 12, font });
    page.drawText("Qty", { x: colX.qty, y, size: 12, font });
    page.drawText("Status", { x: colX.status, y, size: 12, font });
    page.drawText("Date", { x: colX.date, y, size: 12, font });

    y -= 30;

    // Rows
    items.forEach((i) => {
      if (y < 50) {
        page = pdfDoc.addPage([600, 800]);
        y = 760;
      }

      page.drawRectangle({
        x: 20,
        y: y - 5,
        width: 560,
        height: 20,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      page.drawText(i.itemName, { x: colX.item, y, size: 11, font });
      page.drawText(i.category, { x: colX.category, y, size: 11, font });
      page.drawText(String(i.quantity), { x: colX.qty, y, size: 11, font });
      page.drawText(i.status, { x: colX.status, y, size: 11, font });

      // ⭐ Add formatted date
      const dateText = i.date
        ? new Date(i.date).toLocaleDateString("en-GB")
        : "";

      page.drawText(dateText, { x: colX.date, y, size: 11, font });

      y -= 25;
    });

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_items.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {alert.message && <Alert variant={alert.type}>{alert.message}</Alert>}

      <div className="d-flex justify-content-between align-items-center my-3">
        <h5 className="fw-bold">Inventory List</h5>

        <div className="d-flex gap-2">
          <Button variant="outline-success" onClick={exportXLSX}>
            Export CSV
          </Button>

          <Button variant="outline-danger" onClick={exportPDF}>
            Export PDF
          </Button>

          <Button disabled={!gymCode} onClick={() => setShowAdd(true)}>
            + Add Item
          </Button>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No items found
                  </td>
                </tr>
              )}

              {items.map((i) => (
                <tr key={i._id}>
                  <td>{i.itemName}</td>
                  <td className="text-capitalize">{i.category}</td>
                  <td>{i.quantity}</td>
                  <td>
                    <span
                      className={`badge px-3 py-2 ${
                        i.status === "Available"
                          ? "bg-success"
                          : i.status === "In Use"
                          ? "bg-warning text-dark"
                          : "bg-danger"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td>{new Date(i.date).toLocaleDateString()}</td>

                  {/* ACTION ICONS */}
                  <td>
                    <FaPen
                      size={18}
                      className="text-primary me-3"
                      style={{ cursor: "pointer" }}
                      onClick={() => openEditModal(i)}
                    />
                    <FaTrash
                      size={18}
                      className="text-danger"
                      style={{ cursor: "pointer" }}
                      onClick={() => deleteItem(i._id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* ======================================================
          ADD ITEM MODAL
      ======================================================= */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Inventory Item</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="dumbbell">Dumbbell</option>
                <option value="weight">Weight</option>
                <option value="machine">Machine</option>
                <option value="treadmill">Treadmill</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="Damaged">Damaged</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
          <Button disabled={!gymCode} onClick={saveItem}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ======================================================
          EDIT ITEM MODAL
      ======================================================= */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Inventory Item</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                value={editForm.itemName}
                onChange={(e) =>
                  setEditForm({ ...editForm, itemName: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
              >
                <option value="dumbbell">Dumbbell</option>
                <option value="weight">Weight</option>
                <option value="machine">Machine</option>
                <option value="treadmill">Treadmill</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={editForm.quantity}
                onChange={(e) =>
                  setEditForm({ ...editForm, quantity: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={editForm.date?.split("T")[0]} // convert ISO date → yyyy-mm-dd
                onChange={(e) =>
                  setEditForm({ ...editForm, date: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value })
                }
              >
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="Damaged">Damaged</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>
            Cancel
          </Button>

          <Button onClick={updateItem}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

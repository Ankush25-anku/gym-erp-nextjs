"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import axios from "axios";
import InventorySummary from "../../components/InventorySummary";
import InventoryItems from "../../components/InventoryItems";
import MasterLayout from "../../masterLayout/MasterLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function InventoryPage() {
  const { getToken, isLoaded } = useAuth();

  const [gymCode, setGymCode] = useState("");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    dumbbell: 0,
    weight: 0,
    machine: 0,
    treadmill: 0,
    other: 0,
  });

  // Fetch Gym
  useEffect(() => {
    const loadGym = async () => {
      if (!isLoaded) return;

      const token = await getToken();

      const res = await axios.get(`${API_BASE}/api/gym/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const code = res.data?.gym?.gymCode;
      setGymCode(code);

      if (code) fetchInventory(code);
    };

    loadGym();
  }, [isLoaded]);

  // Fetch Inventory
  const fetchInventory = async (code = gymCode) => {
    const res = await axios.get(`${API_BASE}/api/inventory/by-gym`, {
      params: { gymCode: code },
    });

    const list = res.data.items || [];
    setItems(list);

    const totals = {
      dumbbell: 0,
      weight: 0,
      machine: 0,
      treadmill: 0,
      other: 0,
    };

    list.forEach((i) => (totals[i.category] += Number(i.quantity)));

    setSummary(totals);
  };

  return (
    <MasterLayout>
      <div className="container py-4">
        <h2 className="fw-bold mb-3">Inventory</h2>
        <p className="text-muted mb-4">Manage your gym equipment</p>

        {/* Summary section */}
        <InventorySummary summary={summary} />

        {/* Items section */}
        <InventoryItems
          gymCode={gymCode}
          items={items}
          fetchInventory={fetchInventory}
        />
      </div>
    </MasterLayout>
  );
}

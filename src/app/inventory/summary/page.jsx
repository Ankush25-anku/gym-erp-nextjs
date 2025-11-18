"use client";

import MasterLayout from "../../../masterLayout/MasterLayout";
import InventorySummary from "../../../components/InventorySummary";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function InventorySummaryPage() {
  const { getToken, isLoaded } = useAuth();

  const [gymCode, setGymCode] = useState("");
  const [summary, setSummary] = useState({
    dumbbell: 0,
    weight: 0,
    machine: 0,
    treadmill: 0,
    other: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!isLoaded) return;

      const token = await getToken();
      const res = await axios.get(`${API_BASE}/api/gym/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const code = res.data?.gym?.gymCode;
      setGymCode(code);

      if (code) fetchInventory(code);
    };

    loadData();
  }, [isLoaded]);

  const fetchInventory = async (code) => {
    const res = await axios.get(`${API_BASE}/api/inventory/by-gym`, {
      params: { gymCode: code },
    });

    const list = res.data.items || [];

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
        <h2 className="fw-bold mb-3">Inventory Summary</h2>

        <InventorySummary summary={summary} />
      </div>
    </MasterLayout>
  );
}

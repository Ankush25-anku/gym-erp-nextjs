"use client";

import MasterLayout from "../../../masterLayout/MasterLayout";
import InventoryItems from "../../../components/InventoryItems";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function InventoryItemsPage() {
  const { getToken, isLoaded } = useAuth();

  const [gymCode, setGymCode] = useState("");
  const [items, setItems] = useState([]);

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

    setItems(res.data.items || []);
  };

  return (
    <MasterLayout>
      <div className="container py-4">
        <h2 className="fw-bold mb-3">Inventory Items</h2>

        <InventoryItems
          gymCode={gymCode}
          items={items}
          fetchInventory={fetchInventory}
        />
      </div>
    </MasterLayout>
  );
}

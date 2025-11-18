"use client";

import { useState } from "react";
import { Modal, Card, Button } from "react-bootstrap";
import { Dumbbell, Cog, Weight, Activity, Box } from "lucide-react";

export default function InventorySummary({ summary }) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Image list (public folder)
  const categoryImages = {
    dumbbell: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
    weight: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
    machine: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
    treadmill: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
    other: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
  };

  const iconMap = {
    dumbbell: <Dumbbell size={28} />,
    weight: <Weight size={28} />,
    machine: <Cog size={28} />,
    treadmill: <Activity size={28} />,
    other: <Box size={28} />,
  };

  const colors = {
    dumbbell: "#4C7EFF",
    weight: "#34C759",
    machine: "#AF52DE",
    treadmill: "#FF9F0A",
    other: "#8E8E93",
  };

  return (
    <>
      <div className="row g-3 mb-4">
        {Object.keys(summary).map((cat) => (
          <div className="col-6 col-md-4 col-lg-3" key={cat}>
            <Card
              className="p-3 shadow-sm"
              style={{
                background: "#fff",
                borderRadius: "14px",
                cursor: "pointer",
                transition: "0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors[cat];
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#000";
              }}
              onClick={() => {
                setSelectedCategory(cat);
                setShowCategoryModal(true);
              }}
            >
              <Card.Body className="text-center">
                <div className="mb-2">{iconMap[cat]}</div>
                <h6 className="text-uppercase small mb-1">{cat}</h6>
                <h3 className="fw-bold">{summary[cat]}</h3>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* IMAGE POPUP MODAL */}
      <Modal centered size="lg" show={showCategoryModal} onHide={() => setShowCategoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedCategory?.toUpperCase()} Gallery</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="image-strip-container">
            <div className="image-strip">
              {categoryImages[selectedCategory]?.map((img, i) => (
                <img
                  key={i}
                  className="strip-img"
                  src={`/assets/images/inventory/${selectedCategory}/${img}`}
                />
              ))}

              {/* Duplicate for infinite scroll effect */}
              {categoryImages[selectedCategory]?.map((img, i) => (
                <img
                  key={`dup-${i}`}
                  className="strip-img"
                  src={`/assets/images/inventory/${selectedCategory}/${img}`}
                />
              ))}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setShowCategoryModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

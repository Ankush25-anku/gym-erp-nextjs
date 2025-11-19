"use client";
import { useState, useEffect } from "react";
import "remixicon/fonts/remixicon.css";
import axios from "axios";

// Helper to format date nicely
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

const UnitCountSeven = () => {
  // ✅ Load date from localStorage or default
  const [selectedDate, setSelectedDate] = useState("2025-06-19");

  useEffect(() => {
    const storedDate = localStorage.getItem("selectedDate");
    if (storedDate) {
      setSelectedDate(storedDate);
    }
  }, []);

  const [events, setEvents] = useState([]);

  // ✅ Store selectedDate to localStorage on change
  useEffect(() => {
    localStorage.setItem("selectedDate", selectedDate);
  }, [selectedDate]);

  // Fetch events when selectedDate changes
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/events?date=${selectedDate}`
        );
        setEvents(response.data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, [selectedDate]);

  const totalEvents = events.length;
  const classes = events.filter((e) => e.type === "class").length;
  const ptSessions = events.filter((e) => e.type === "pt").length;

  const cardStyle = {
    minHeight: "130px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "#fff",
  };

  const iconBoxStyle = (bgColor, textColor) => ({
    backgroundColor: bgColor,
    color: textColor,
    borderRadius: "50%",
    padding: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "40px",
    height: "40px",
  });

  return (
    <div className="container py-4">
      {/* Row for Stats */}
      <div className="row g-3">
        {/* Select Date */}
        <div className="col-md-3 col-sm-6">
          <div style={cardStyle}>
            <div style={{ width: "100%" }}>
              <span className="text-muted fw-medium d-block mb-2">
                Select Date
              </span>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <div style={iconBoxStyle("#cfe2ff", "#084298")}>
                  <i className="ri-calendar-2-line fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Events */}
        <div className="col-md-3 col-sm-6">
          <div style={cardStyle}>
            <div>
              <span className="text-muted fw-medium d-block">Total Events</span>
              <h5 className="fw-bold mt-2">{totalEvents}</h5>
            </div>
            <div style={iconBoxStyle("#cfe2ff", "#084298")}>
              <i className="ri-calendar-event-fill fs-5"></i>
            </div>
          </div>
        </div>

        {/* Classes */}
        <div className="col-md-3 col-sm-6">
          <div style={cardStyle}>
            <div>
              <span className="text-muted fw-medium d-block">Classes</span>
              <h5 className="fw-bold mt-2">{classes}</h5>
            </div>
            <div style={iconBoxStyle("#cfe2ff", "#084298")}>
              <i className="ri-group-fill fs-5"></i>
            </div>
          </div>
        </div>

        {/* PT Sessions */}
        <div className="col-md-3 col-sm-6">
          <div style={cardStyle}>
            <div>
              <span className="text-muted fw-medium d-block">PT Sessions</span>
              <h5 className="fw-bold mt-2">{ptSessions}</h5>
            </div>
            <div style={iconBoxStyle("#fff3cd", "#664d03")}>
              <i className="ri-time-line fs-5"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule View */}
      <div className="card mt-4">
        <div className="card-body text-center py-5">
          <h5 className="text-start mb-4">
            Schedule for {formatDate(selectedDate)}
          </h5>

          {events.length === 0 ? (
            <div className="d-flex flex-column align-items-center mt-4">
              <i className="ri-calendar-line text-secondary fs-1 mb-2"></i>
              <h6 className="fw-semibold">No events scheduled</h6>
              <p className="text-muted mb-0">
                No events found for the selected date.
              </p>
            </div>
          ) : (
            <ul className="list-group text-start">
              {events.map((event, idx) => (
                <li className="list-group-item" key={idx}>
                  <strong>{event.title}</strong> — {event.time} ({event.type})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitCountSeven;

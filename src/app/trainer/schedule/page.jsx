"use client";

import React, { useState } from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import { format } from "date-fns";

export default function TrainerSchedulePage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(format(today, "yyyy-MM-dd"));

  return (
    <MasterLayout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold">Schedule Management</h2>
            <p className="text-muted">
              Manage classes, training sessions, and facility schedules
            </p>
          </div>
          <button className="btn btn-dark">
            <i className="bi bi-plus me-2"></i> Add Event
          </button>
        </div>

        {/* Top Section - Date + Stats */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <label className="form-label">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 text-center">
              <div className="card-body">
                <div className="text-primary mb-2 fs-4">
                  <i className="bi bi-calendar-event"></i>
                </div>
                <p className="mb-1 text-muted">Total Events</p>
                <h5 className="fw-bold">0</h5>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 text-center">
              <div className="card-body">
                <div className="text-purple mb-2 fs-4">
                  <i className="bi bi-people"></i>
                </div>
                <p className="mb-1 text-muted">Classes</p>
                <h5 className="fw-bold">0</h5>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 text-center">
              <div className="card-body">
                <div className="text-warning mb-2 fs-4">
                  <i className="bi bi-clock-history"></i>
                </div>
                <p className="mb-1 text-muted">PT Sessions</p>
                <h5 className="fw-bold">0</h5>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Event Display */}
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h5 className="fw-bold">
              Schedule for {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
            </h5>
            <p className="text-muted">0 events scheduled for this day</p>

            <div className="text-muted mt-5">
              <i className="bi bi-calendar2-x fs-1"></i>
              <h6 className="mt-3">No events scheduled</h6>
              <p>No events found for the selected date.</p>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}

"use client";

import MasterLayout from "../../../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import { useState } from "react";

export default function MemberSchedule() {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold">Schedule Management</h2>
        <p className="text-muted mb-4">
          Manage classes, training sessions, and facility schedules
        </p>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <label className="form-label fw-medium">Select Date</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <div className="bg-light rounded-3 p-3 d-flex align-items-center gap-3">
              <Icon icon="mdi:calendar" width={32} className="text-primary" />
              <div>
                <div className="fw-semibold small">Total Events</div>
                <div className="fs-5 fw-bold">0</div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-light rounded-3 p-3 d-flex align-items-center gap-3">
              <Icon
                icon="mdi:account-group"
                width={32}
                className="text-purple"
              />
              <div>
                <div className="fw-semibold small">Classes</div>
                <div className="fs-5 fw-bold">0</div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-light rounded-3 p-3 d-flex align-items-center gap-3">
              <Icon
                icon="mdi:clock-outline"
                width={32}
                className="text-warning"
              />
              <div>
                <div className="fw-semibold small">PT Sessions</div>
                <div className="fs-5 fw-bold">0</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm p-4">
          <h5 className="fw-bold mb-1">
            Schedule for {dayjs(selectedDate).format("dddd, MMMM D, YYYY")}
          </h5>
          <p className="text-muted small mb-4">
            0 events scheduled for this day
          </p>

          <div className="text-center text-muted py-5">
            <Icon icon="mdi:calendar-remove" width={48} className="mb-3" />
            <h6 className="fw-semibold">No events scheduled</h6>
            <p className="small">No events found for the selected date.</p>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}

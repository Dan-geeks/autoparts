import React, { useState, useEffect } from "react";
import {
  addVehicleMake,
  addModelToMake,
  removeModelFromMake,
  deleteVehicleMake,
  subscribeToVehicleMakes
} from "../services/vehicleService";
import { migrateVehicleData, displayMigrationReport } from "../scripts/migrateVehicleData";

const VehicleManagement = () => {
  const [vehicleMakes, setVehicleMakes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newMakeName, setNewMakeName] = useState("");
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [newModelName, setNewModelName] = useState("");

  // Status messages
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState(""); // 'success' or 'error'

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false);

  // Subscribe to vehicle makes
  useEffect(() => {
    const unsubscribe = subscribeToVehicleMakes((makes) => {
      setVehicleMakes(makes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show status message temporarily
  const showStatus = (message, type = "success") => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage("");
      setStatusType("");
    }, 3000);
  };

  // Handle adding a new make
  const handleAddMake = async (e) => {
    e.preventDefault();
    if (!newMakeName.trim()) return;

    try {
      await addVehicleMake(newMakeName);
      setNewMakeName("");
      showStatus(`Vehicle make "${newMakeName}" added successfully!`, "success");
    } catch (error) {
      showStatus(error.message || "Error adding vehicle make", "error");
    }
  };

  // Handle adding a model to an existing make
  const handleAddModel = async (e) => {
    e.preventDefault();
    if (!selectedMakeId || !newModelName.trim()) return;

    try {
      await addModelToMake(selectedMakeId, newModelName);
      setNewModelName("");
      showStatus(`Model "${newModelName}" added successfully!`, "success");
    } catch (error) {
      showStatus(error.message || "Error adding model", "error");
    }
  };

  // Handle deleting a model
  const handleDeleteModel = async (makeId, model) => {
    if (!window.confirm(`Are you sure you want to delete the model "${model}"?`)) return;

    try {
      await removeModelFromMake(makeId, model);
      showStatus(`Model "${model}" deleted successfully!`, "success");
    } catch (error) {
      showStatus(error.message || "Error deleting model", "error");
    }
  };

  // Handle deleting an entire make
  const handleDeleteMake = async (makeId, makeName) => {
    if (!window.confirm(
      `Are you sure you want to delete "${makeName}" and ALL its models? This cannot be undone.`
    )) return;

    try {
      await deleteVehicleMake(makeId);
      showStatus(`Vehicle make "${makeName}" deleted successfully!`, "success");
    } catch (error) {
      showStatus(error.message || "Error deleting vehicle make", "error");
    }
  };

  // Handle data migration
  const handleMigration = async () => {
    if (!window.confirm(
      "This will populate the database with 20 popular vehicle makes and their models. " +
      "Existing makes will not be duplicated. Continue?"
    )) return;

    setIsMigrating(true);
    try {
      const report = await migrateVehicleData();
      const reportMessage = displayMigrationReport(report);
      alert(reportMessage);

      if (report.added > 0) {
        showStatus(`Successfully added ${report.added} vehicle make(s)!`, "success");
      } else if (report.skipped > 0) {
        showStatus("All vehicle makes already exist in the database.", "success");
      }
    } catch (error) {
      showStatus("Migration failed: " + error.message, "error");
      alert("Migration failed: " + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
        Loading vehicle data...
      </div>
    );
  }

  return (
    <div className="admin-grid">
      {/* LEFT PANEL: Add New Make & Add Model to Existing Make */}
      <div className="admin-panel form-panel">
        <h3>Manage Vehicle Makes & Models</h3>

        {/* Status Message */}
        {statusMessage && (
          <div
            style={{
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "6px",
              background: statusType === "success" ? "#2ecc71" : "#e74c3c",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: "500"
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Initial Data Migration */}
        {vehicleMakes.length === 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              color: "#fff"
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", fontSize: "1rem" }}>
              Quick Setup
            </h4>
            <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem", opacity: 0.9 }}>
              Get started quickly by importing 20 popular vehicle makes with their models
            </p>
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              style={{
                background: "#fff",
                color: "#667eea",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: isMigrating ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                fontWeight: "600",
                width: "100%",
                opacity: isMigrating ? 0.6 : 1
              }}
            >
              {isMigrating ? "Importing Data..." : "Import Initial Vehicle Data"}
            </button>
          </div>
        )}

        {/* Add New Make */}
        <div style={{ marginBottom: "30px" }}>
          <h4 style={{ color: "#ccc", fontSize: "0.95rem", marginBottom: "15px" }}>
            Add New Vehicle Make
          </h4>
          <form onSubmit={handleAddMake}>
            <div className="form-group">
              <label>Make Name *</label>
              <input
                className="admin-input"
                type="text"
                placeholder="e.g., Toyota, BMW, Mercedes"
                value={newMakeName}
                onChange={(e) => setNewMakeName(e.target.value)}
                required
              />
              <small style={{ color: "#888", fontSize: "0.75rem" }}>
                Enter the vehicle manufacturer name
              </small>
            </div>
            <button type="submit" className="admin-btn">
              Add Make
            </button>
          </form>
        </div>

        {/* Add Model to Existing Make */}
        <div
          style={{
            borderTop: "1px solid #333",
            paddingTop: "20px",
            marginTop: "20px"
          }}
        >
          <h4 style={{ color: "#ccc", fontSize: "0.95rem", marginBottom: "15px" }}>
            Add Model to Existing Make
          </h4>
          <form onSubmit={handleAddModel}>
            <div className="form-group">
              <label>Select Make *</label>
              <select
                className="admin-input"
                value={selectedMakeId}
                onChange={(e) => setSelectedMakeId(e.target.value)}
                required
              >
                <option value="">Choose a Make</option>
                {vehicleMakes.map((make) => (
                  <option key={make.id} value={make.id}>
                    {make.make} ({make.models?.length || 0} models)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Model Name *</label>
              <input
                className="admin-input"
                type="text"
                placeholder="e.g., Corolla, X5, C-Class"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                required
              />
              <small style={{ color: "#888", fontSize: "0.75rem" }}>
                Enter the specific model name
              </small>
            </div>

            <button
              type="submit"
              className="admin-btn"
              disabled={!selectedMakeId}
              style={{ opacity: selectedMakeId ? 1 : 0.5 }}
            >
              Add Model
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: View & Manage Existing Makes and Models */}
      <div className="admin-panel list-panel">
        <h3>All Vehicle Makes & Models ({vehicleMakes.length})</h3>

        {vehicleMakes.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", padding: "40px 20px" }}>
            No vehicle makes added yet. Add your first make using the form on the left.
          </p>
        ) : (
          <div className="inventory-list">
            {vehicleMakes.map((make) => (
              <div
                key={make.id}
                style={{
                  background: "#111",
                  padding: "15px",
                  marginBottom: "15px",
                  borderRadius: "8px",
                  border: "1px solid #333"
                }}
              >
                {/* Make Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px"
                  }}
                >
                  <div>
                    <h4
                      style={{
                        color: "var(--primary)",
                        fontSize: "1.1rem",
                        marginBottom: "4px"
                      }}
                    >
                      {make.make}
                    </h4>
                    <div style={{ fontSize: "0.8rem", color: "#888" }}>
                      {make.models?.length || 0} model(s)
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMake(make.id, make.make)}
                    className="icon-btn delete"
                    title={`Delete ${make.make}`}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>

                {/* Models List */}
                {make.models && make.models.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "10px"
                    }}
                  >
                    {make.models.sort().map((model, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#1a1a1a",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #444"
                        }}
                      >
                        <span style={{ color: "#ccc", fontSize: "0.85rem" }}>
                          {model}
                        </span>
                        <button
                          onClick={() => handleDeleteModel(make.id, model)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#e74c3c",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            padding: "0",
                            marginLeft: "4px",
                            display: "flex",
                            alignItems: "center"
                          }}
                          title={`Delete ${model}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      fontStyle: "italic",
                      margin: "8px 0 0 0"
                    }}
                  >
                    No models added yet
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleManagement;

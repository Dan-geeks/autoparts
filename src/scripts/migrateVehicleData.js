/**
 * Vehicle Data Migration Script
 *
 * This script populates the vehicleMakes collection with initial vehicle makes and models.
 * Run this once to seed your database with common vehicle makes and their models.
 *
 * Usage:
 * 1. Import this file in your app (e.g., in AdminPage.jsx)
 * 2. Call migrateVehicleData() from a button click or on initial load
 * 3. Remove the import after migration is complete
 */

import { collection, getDocs, query, where } from "firebase/firestore";
import { addVehicleMake } from "../services/vehicleService";
import { db } from "../firebaseConfig";

// Initial vehicle data: Popular makes with their common models
const INITIAL_VEHICLE_DATA = [
  {
    make: "Audi",
    models: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "TT", "R8", "e-tron"]
  },
  {
    make: "BMW",
    models: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "i8", "iX"]
  },
  {
    make: "Mercedes",
    models: ["A-Class", "B-Class", "C-Class", "CLA", "CLS", "E-Class", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "S-Class", "SL", "SLC", "AMG GT", "EQC", "EQS"]
  },
  {
    make: "Toyota",
    models: ["Corolla", "Camry", "Prius", "RAV4", "Highlander", "4Runner", "Tacoma", "Tundra", "Sequoia", "Land Cruiser", "Prado", "Hilux", "Avalon", "Sienna", "Yaris", "C-HR", "Supra"]
  },
  {
    make: "Honda",
    models: ["Accord", "Civic", "CR-V", "HR-V", "Pilot", "Odyssey", "Ridgeline", "Passport", "Fit", "Insight", "Clarity"]
  },
  {
    make: "Ford",
    models: ["F-150", "F-250", "F-350", "Mustang", "Explorer", "Escape", "Edge", "Expedition", "Ranger", "Bronco", "Bronco Sport", "Maverick", "EcoSport", "Transit"]
  },
  {
    make: "Chevrolet",
    models: ["Silverado", "Colorado", "Camaro", "Corvette", "Malibu", "Equinox", "Traverse", "Tahoe", "Suburban", "Blazer", "Trailblazer", "Bolt"]
  },
  {
    make: "Nissan",
    models: ["Altima", "Maxima", "Sentra", "Versa", "Rogue", "Murano", "Pathfinder", "Armada", "Frontier", "Titan", "Kicks", "GT-R", "370Z", "Leaf"]
  },
  {
    make: "Volkswagen",
    models: ["Golf", "Jetta", "Passat", "Tiguan", "Atlas", "Arteon", "ID.4", "Taos", "Beetle", "GTI", "Polo"]
  },
  {
    make: "Hyundai",
    models: ["Elantra", "Sonata", "Accent", "Veloster", "Tucson", "Santa Fe", "Palisade", "Kona", "Venue", "Ioniq", "Genesis"]
  },
  {
    make: "Kia",
    models: ["Forte", "Optima", "Stinger", "Soul", "Sportage", "Sorento", "Telluride", "Seltos", "Niro", "Carnival", "K5"]
  },
  {
    make: "Mazda",
    models: ["Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5", "CX-9", "MX-5 Miata", "CX-50"]
  },
  {
    make: "Subaru",
    models: ["Impreza", "Legacy", "Outback", "Forester", "Crosstrek", "Ascent", "WRX", "BRZ"]
  },
  {
    make: "Lexus",
    models: ["IS", "ES", "GS", "LS", "RC", "LC", "UX", "NX", "RX", "GX", "LX"]
  },
  {
    make: "Land Rover",
    models: ["Range Rover", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar", "Discovery", "Discovery Sport", "Defender"]
  },
  {
    make: "Jeep",
    models: ["Wrangler", "Cherokee", "Grand Cherokee", "Compass", "Renegade", "Gladiator", "Grand Wagoneer"]
  },
  {
    make: "Porsche",
    models: ["911", "Cayenne", "Macan", "Panamera", "Taycan", "718 Boxster", "718 Cayman"]
  },
  {
    make: "Volvo",
    models: ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40"]
  },
  {
    make: "Mitsubishi",
    models: ["Mirage", "Outlander", "Eclipse Cross", "Outlander Sport", "Outlander PHEV"]
  },
  {
    make: "Isuzu",
    models: ["D-Max", "MU-X", "Trooper", "Rodeo"]
  }
];

/**
 * Check if a vehicle make already exists in the database
 */
const checkIfMakeExists = async (makeName) => {
  const q = query(collection(db, "vehicleMakes"), where("make", "==", makeName));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Main migration function
 * Returns a report of what was added
 */
export const migrateVehicleData = async () => {
  console.log("Starting vehicle data migration...");

  const report = {
    total: INITIAL_VEHICLE_DATA.length,
    added: 0,
    skipped: 0,
    errors: [],
    details: []
  };

  for (const vehicleData of INITIAL_VEHICLE_DATA) {
    try {
      // Check if make already exists
      const exists = await checkIfMakeExists(vehicleData.make);

      if (exists) {
        console.log(`Skipping ${vehicleData.make} - already exists`);
        report.skipped++;
        report.details.push({
          make: vehicleData.make,
          status: "skipped",
          reason: "already exists"
        });
        continue;
      }

      // Add the vehicle make with its models
      await addVehicleMake(vehicleData.make, vehicleData.models);
      console.log(`Added ${vehicleData.make} with ${vehicleData.models.length} models`);

      report.added++;
      report.details.push({
        make: vehicleData.make,
        status: "added",
        modelCount: vehicleData.models.length
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error adding ${vehicleData.make}:`, error);
      report.errors.push({
        make: vehicleData.make,
        error: error.message
      });
    }
  }

  console.log("Migration complete!");
  console.log(`Added: ${report.added}, Skipped: ${report.skipped}, Errors: ${report.errors.length}`);

  return report;
};

/**
 * Helper function to display migration results
 */
export const displayMigrationReport = (report) => {
  let message = `Migration Complete!\n\n`;
  message += `Total Makes: ${report.total}\n`;
  message += `Successfully Added: ${report.added}\n`;
  message += `Skipped (already exist): ${report.skipped}\n`;
  message += `Errors: ${report.errors.length}\n`;

  if (report.errors.length > 0) {
    message += `\nErrors:\n`;
    report.errors.forEach(err => {
      message += `- ${err.make}: ${err.error}\n`;
    });
  }

  return message;
};

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Add a new vehicle make to Firebase
 * @param {string} make - The vehicle make name (e.g., "Toyota")
 * @param {Array<string>} models - Optional initial models array
 * @returns {Promise<string>} - The ID of the created document
 */
export const addVehicleMake = async (make, models = []) => {
  try {
    // Check if make already exists
    const q = query(collection(db, "vehicleMakes"), where("make", "==", make));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error(`Vehicle make "${make}" already exists`);
    }

    const docRef = await addDoc(collection(db, "vehicleMakes"), {
      make: make.trim(),
      models: models.map(m => m.trim()).filter(m => m !== ""),
      createdAt: new Date()
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding vehicle make:", error);
    throw error;
  }
};

/**
 * Add a model to an existing vehicle make
 * @param {string} makeId - The document ID of the vehicle make
 * @param {string} model - The model name to add
 */
export const addModelToMake = async (makeId, model) => {
  try {
    const makeRef = doc(db, "vehicleMakes", makeId);
    await updateDoc(makeRef, {
      models: arrayUnion(model.trim())
    });
  } catch (error) {
    console.error("Error adding model:", error);
    throw error;
  }
};

/**
 * Remove a model from a vehicle make
 * @param {string} makeId - The document ID of the vehicle make
 * @param {string} model - The model name to remove
 */
export const removeModelFromMake = async (makeId, model) => {
  try {
    const makeRef = doc(db, "vehicleMakes", makeId);
    await updateDoc(makeRef, {
      models: arrayRemove(model)
    });
  } catch (error) {
    console.error("Error removing model:", error);
    throw error;
  }
};

/**
 * Delete an entire vehicle make
 * @param {string} makeId - The document ID of the vehicle make to delete
 */
export const deleteVehicleMake = async (makeId) => {
  try {
    await deleteDoc(doc(db, "vehicleMakes", makeId));
  } catch (error) {
    console.error("Error deleting vehicle make:", error);
    throw error;
  }
};

/**
 * Get all vehicle makes
 * @returns {Promise<Array>} - Array of vehicle makes with their IDs
 */
export const getAllVehicleMakes = async () => {
  try {
    const q = query(collection(db, "vehicleMakes"), orderBy("make"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting vehicle makes:", error);
    throw error;
  }
};

/**
 * Subscribe to vehicle makes changes in real-time
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToVehicleMakes = (callback) => {
  const q = query(collection(db, "vehicleMakes"), orderBy("make"));
  return onSnapshot(q, (snapshot) => {
    const makes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(makes);
  });
};

/**
 * Get models for a specific make
 * @param {string} makeName - The name of the make
 * @returns {Promise<Array<string>>} - Array of model names
 */
export const getModelsForMake = async (makeName) => {
  try {
    const q = query(collection(db, "vehicleMakes"), where("make", "==", makeName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const makeDoc = snapshot.docs[0];
    return makeDoc.data().models || [];
  } catch (error) {
    console.error("Error getting models:", error);
    throw error;
  }
};

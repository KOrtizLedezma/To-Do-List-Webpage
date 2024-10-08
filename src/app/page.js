"use client";
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';

import LoginForm from "@/Components/LoginForm";
import ParticleBackground from "@/Components/ParticleBackground";
import Dates from "@/Components/Dates";
import Tasks from "@/Components/Tasks";

// API KEYS & DATA
const firebaseApiKey = process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_REACT_APP_authDomain;
const firebaseProjectID = process.env.NEXT_PUBLIC_REACT_APP_projectId;
const firebaseStorageBucket = process.env.NEXT_PUBLIC_REACT_APP_storageBucket;
const firebaseMessagingSenderId = process.env.NEXT_PUBLIC_REACT_APP_messagingSenderId;
const firebaseAppId = process.env.NEXT_PUBLIC_REACT_APP_appId;

// Firebase configuration
const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectID,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
};

// Initialize Firebase app
console.log("Initializing Firebase app...");
const app = initializeApp(firebaseConfig);
console.log("Firebase app initialized.");

// Get the Auth instance
console.log("Getting Auth instance...");
const auth = getAuth(app);
console.log("Auth instance obtained:", auth);

// Get the Firestore instance
console.log("Initializing Firestore...");
const db = getFirestore(app);
console.log("Firestore initialized.");

export default function Home() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [pickedDate, setPickedDate] = useState("");
  const [tasksArray, setTasksArray] = useState([]);

  function addTask(taskDescription, isCompleted) {
    const task = {
      description: taskDescription,
      completed: false
    };
    setTasksArray(prevTasks => [...prevTasks, task]);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUser(userDoc.data());
      } else {
        console.log("User document does not exist");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLoginClick = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in successfully!");
    } catch (error) {
      console.error("Error signing in:", error);
      handleAuthError(error.code);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully!");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleRegisterClick = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        uid: user.uid,
        dates: []
      });

      console.log("User registered successfully!");
    } catch (error) {
      console.error("Error registering user:", error);
      handleAuthError(error.code);
    }
  };

  const handleAuthError = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-email":
        setError("Invalid email format. Please enter a valid email.");
        break;
      case "auth/wrong-password":
        setError("Invalid password. Please try again.");
        break;
      case "auth/invalid-credential":
        setError("Invalid credentials. Please try again.");
        break;
      case "auth/email-already-in-use":
        setError("Email already in use. Please enter a different email.");
        break;
      case "(auth/weak-password)":
        setError("Password should be at least 6 characters.");
        break;
      default:
        setError("An error occurred. Please try again later.");
        break;
    }
  };

  const handleNewDate = async (userId, newDate) => {
    if (user) {

      const userId = user.uid;
      const userRef = doc(db, "users", userId);

      const userDoc = await getDoc(userRef);
      const currentDates = userDoc.data().dates || [];

      const newDateObj = {
        name: newDate,
        tasks: []
      };

      const existingDateIndex = currentDates.findIndex(date => date.name === newDate);
      if (existingDateIndex === -1) {
        currentDates.push(newDateObj);
      }

      await setDoc(userRef, { dates: currentDates }, { merge: true });

      setUser(prevUser => ({
        ...prevUser,
        dates: currentDates
      }));

    }
    else{
      console.error("No user is currently logged in.");
    }
  };

  const handleNewTask = async (userId, dateName, task) => {
    if (user) {

      const userId = user.uid;
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      const newTaskObj = {
        taskName: task,
        state: false
      }

      if (userDoc.exists()){
        const currentDates = userDoc.data().dates || [];
        const dateIndex = currentDates.findIndex(date => date.name === dateName);

        if (dateIndex !== -1){
          currentDates[dateIndex].tasks.push(newTaskObj);
        }
        else{
          const newDateObj = {
            name: dateName,
            tasks: [newTaskObj]
          };
          currentDates.push(newDateObj);
        }
        await setDoc(userRef, { dates:currentDates}, {merge:true});
        console.log("Task added successfully");
      }
      else{
        console.error("User document does not exist.");
      }

    }
    else{
      console.error("No user is currently logged in.");
    }
  };

  const getAllTasksOnDate = async (userId, dateName) => {
    if (user) {
      const userId = user.uid;
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const dates = userDoc.data().dates || [];
        const dateObj = dates.find((date) => date.name === dateName);

        if (dateObj) {
          setTasksArray(dateObj.tasks);
        } else {
          setTasksArray([]);
        }
      } else {
        console.error("User document does not exist.");
      }
    } else {
      console.error("No user is currently logged in.");
    }
  };

  const deleteTask = async (userId, taskIndex) => {
    if (userId && pickedDate) {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentDates = userDoc.data().dates || [];
        const dateObj = currentDates.find((date) => date.name === pickedDate);

        if (dateObj) {
          dateObj.tasks.splice(taskIndex, 1);

          await setDoc(userRef, { dates: currentDates }, { merge: true });

          await getAllTasksOnDate(userId, pickedDate);
        }
      }
    }
  };
  

  if (user) {
    return (
      <div>
        <main className="flex min-h-screen flex-col items-center">
          <ParticleBackground />
          <section className="grid-container">
            <div className="grid-item">
              <Dates
                pickedDate={pickedDate}
                setPickedDate={setPickedDate}
                getAllTasksOnDate={getAllTasksOnDate}
                userId={user.uid}
              />
            </div>
            <div className="grid-item">
              <Tasks
                pickedDate={pickedDate}
                handleLogoutClick={handleLogoutClick}
                handleNewDate={handleNewDate}
                handleNewTask={handleNewTask}
                userId={user.uid}
                tasksArray={tasksArray}
                getAllTasksOnDate={getAllTasksOnDate}
                deleteTask = {deleteTask}
              />
            </div>
          </section>
        </main>
      </div>
    );
  } else {
    return (
      <main>
        <section className="custom-grid">
          <div>
            <ParticleBackground />
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              handleLoginClick={handleLoginClick}
              handleRegisterClick={handleRegisterClick}
              error={error}
            />
          </div>
          <div className="container_left">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
              className="custom-column"
            >
              <h1 className="custom-heading">
                <span className="mb-6">Let&apos;s</span>
                <br />
                <TypeAnimation
                  sequence={['get organized', 1000, 'get motivated', 1000, 'be productive', 1000]}
                  wrapper="span"
                  speed={30}
                  repeat={Infinity}
                />
              </h1>
            </motion.div>
          </div>
        </section>
      </main>
    );
  }
}
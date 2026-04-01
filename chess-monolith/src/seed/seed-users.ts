import { db } from "../infrastructure/db/db";
import { user } from "../infrastructure/db/schema";
import crypto from "crypto"; // 👈 Added native Node.js crypto for generating UUIDs

const firstNames = [
  "Aarav",
  "Vihaan",
  "Aditya",
  "Arjun",
  "Sai",
  "Siddharth",
  "Rohan",
  "Rahul",
  "Amit",
  "Vikram",
  "Karan",
  "Surya",
  "Pranav",
  "Ishaan",
  "Dhruv",
  "Rishabh",
  "Yash",
  "Kabir",
  "Ravi",
  "Akash",
  "Neha",
  "Priya",
  "Pooja",
  "Anjali",
  "Sneha",
  "Kavya",
  "Shreya",
  "Ishita",
  "Riya",
  "Shruti",
  "Aditi",
  "Nandini",
  "Meera",
  "Sanya",
  "Tara",
  "Kiara",
  "Avni",
  "Diya",
  "Ananya",
  "Myra",
];

const lastNames = [
  "Sharma",
  "Singh",
  "Kumar",
  "Patel",
  "Gupta",
  "Verma",
  "Reddy",
  "Patil",
  "Desai",
  "Yadav",
  "Joshi",
  "Iyer",
  "Chatterjee",
  "Sen",
  "Das",
  "Bose",
  "Nair",
  "Menon",
  "Pillai",
  "Chauhan",
  "Rajput",
  "Rao",
  "Bhat",
  "Mehta",
  "Shah",
  "Agarwal",
  "Mishra",
  "Pandey",
  "Tiwari",
  "Kaur",
];

// Helper to get a random item from an array
const getRandom = (arr: string[]) =>
  arr[Math.floor(Math.random() * arr.length)];

async function seedIndianUsers(count: number = 200) {
  console.log(`Generating ${count} mock users...`);

  const mockUsers = [];

  for (let i = 0; i < count; i++) {
    const firstName = getRandom(firstNames);
    const lastName = getRandom(lastNames);
    const fullName = `${firstName} ${lastName}`;

    // Generate a unique username: e.g., "aarav_sharma_8432"
    const randomSuffix = Math.floor(Math.random() * 10000);
    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${randomSuffix}`;

    mockUsers.push({
      id: crypto.randomUUID(), // 👈 Added unique ID
      email: `${username}@example.com`, // 👈 Added unique email
      name: fullName,
      username: username,
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      rating: Math.floor(Math.random() * 1000) + 500,
    });
  }

  try {
    console.log("Inserting into database...");
    // Drizzle handles bulk inserts natively when you pass an array
    await db.insert(user).values(mockUsers);
    console.log(`✅ Successfully added ${count} users!`);
  } catch (error) {
    console.error("❌ Error inserting users:", error);
  }
}

// Run the function
seedIndianUsers(300);
